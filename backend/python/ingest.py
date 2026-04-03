import json
from pathlib import Path

COLLECTION_NAME = "maternal_health"
BASE_DIR = Path(__file__).resolve().parent
BOOK_PATH = BASE_DIR / "health_book.txt"
VECTOR_DB_PATH = BASE_DIR / "vectordb"
FALLBACK_JSON_PATH = VECTOR_DB_PATH / "chunks_fallback.json"


def split_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
    chunks: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= text_len:
            break
        start = max(0, end - overlap)

    return chunks


def ingest() -> None:
    VECTOR_DB_PATH.mkdir(parents=True, exist_ok=True)

    if not BOOK_PATH.exists():
        raise FileNotFoundError(f"Knowledge file missing: {BOOK_PATH}")

    raw_text = BOOK_PATH.read_text(encoding="utf-8")
    chunks = split_text(raw_text, chunk_size=1000, overlap=100)

    if not chunks:
        raise ValueError("No chunks generated from health_book.txt")

    try:
        import chromadb

        client = chromadb.PersistentClient(path=str(VECTOR_DB_PATH))

        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass

        collection = client.get_or_create_collection(COLLECTION_NAME)

        ids = [f"chunk_{i}" for i in range(len(chunks))]
        metadatas = [{"source": "health_book", "chunk_index": i} for i in range(len(chunks))]
        collection.add(ids=ids, documents=chunks, metadatas=metadatas)

        test = collection.query(query_texts=["pregnancy warning signs"], n_results=3)
        retrieved = len(test.get("documents", [[]])[0]) if test else 0

        print(f"Ingest complete. Chunks stored: {len(chunks)}")
        print(f"Retrieval validation docs returned: {retrieved}")
    except Exception as err:
        payload = {
            "collection": COLLECTION_NAME,
            "chunks_count": len(chunks),
            "chunks": chunks,
            "error": str(err),
            "note": "ChromaDB unavailable, fallback chunks saved for non-crashing mode.",
        }
        FALLBACK_JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print("ChromaDB unavailable. Fallback chunk file generated.")
        print(f"Fallback file: {FALLBACK_JSON_PATH}")


if __name__ == "__main__":
    ingest()
