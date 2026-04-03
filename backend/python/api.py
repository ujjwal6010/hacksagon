"""Janani AI FastAPI service.

This module is Python-only AI logic and returns structured responses.
It does not write to MongoDB and does not call Node backend routes.
"""

import logging

from fastapi import FastAPI

from rag_service import JananiRAGService, safe_ask_fallback
from schemas import AskRequest, AskResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Janani AI Service", version="1.0.0")
rag_service = JananiRAGService()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest) -> AskResponse:
    try:
        result = rag_service.ask(
            query=payload.query,
            language_code=payload.language_code,
            patient_data=payload.patient_data,
            history=payload.history,
            source=payload.source,
        )
        return AskResponse(**result)
    except Exception as err:
        logger.exception("/ask failed, returning safe fallback: %s", err)
        fallback = safe_ask_fallback(payload.query, payload.language_code)
        return AskResponse(**fallback)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
