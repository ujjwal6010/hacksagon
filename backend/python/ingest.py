import os
from dotenv import load_dotenv
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

load_dotenv()

def manual_split_text(text, chunk_size=1000, chunk_overlap=100):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - chunk_overlap)
    return chunks

def ingest_docs(file_path: str, persist_directory: str = "vectordb"):
    """Loads a document and stores it in ChromaDB using FastEmbed."""
    print(f"Loading document: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Manual splitting to avoid LangChain's torch-dependent splitters
    chunks = manual_split_text(text)
    docs = [Document(page_content=chunk, metadata={"source": file_path}) for chunk in chunks]
    print(f"Split into {len(docs)} chunks.")

    # Using FastEmbed - Very reliable locally and doesn't require Torch
    embeddings = FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    
    print("Creating vector database...")
    if os.path.exists(persist_directory):
        print(f"Updating existing database at {persist_directory}...")
        vectordb = Chroma(
            persist_directory=persist_directory,
            embedding_function=embeddings,
            collection_name="pregnancy_docs"
        )
        vectordb.add_documents(docs)
    else:
        print(f"Creating new database at {persist_directory}...")
        vectordb = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            persist_directory=persist_directory,
            collection_name="pregnancy_docs"
        )
    print(f"Vector DB created and persisted at {persist_directory}")
    return vectordb

if __name__ == "__main__":
    sample_file = "health_book.txt"
    if os.path.exists(sample_file):
        ingest_docs(sample_file)
    else:
        print(f"File {sample_file} not found.")
