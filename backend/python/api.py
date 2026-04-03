"""
Janani AI — Python FastAPI Service

Minimal placeholder for AI service.
Normalized design:
- NO direct MongoDB writes
- Receives queries from Node
- Returns structured AI responses only
"""

from fastapi import FastAPI

app = FastAPI(title="Janani AI Service")


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
