from fastapi import APIRouter
from datetime import datetime
import os
import httpx

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    ollama_status = "unknown"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')}/api/tags")
            ollama_status = "connected" if r.status_code == 200 else "error"
    except Exception:
        ollama_status = "unavailable"

    return {
        "status": "healthy",
        "service": "AI Service",
        "timestamp": datetime.utcnow().isoformat(),
        "ollama": ollama_status,
        "model": os.getenv("OLLAMA_VISION_MODEL", "llava"),
        "provider": os.getenv("AI_PROVIDER", "ollama"),
    }
