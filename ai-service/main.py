from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from app.routers import analyze, generate, health

app = FastAPI(
    title="UI/UX Analyzer AI Service",
    description="Python FastAPI service for AI-powered UI/UX analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:3001")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router, prefix="/analyze")
app.include_router(generate.router, prefix="/generate")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVICE_PORT", "8000")),
        reload=os.getenv("NODE_ENV") == "development",
    )
