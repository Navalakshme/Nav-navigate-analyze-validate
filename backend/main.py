"""
NAV — Navigate, Analyze, Validate
Main FastAPI application entry point.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.analysis import router

app = FastAPI(
    title="NAV — Navigate, Analyze, Validate",
    description="Candidate Intelligence & Evidence Agent",
    version="1.0.0",
)

# CORS — allow Vercel frontend + local dev
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://*.vercel.app",
    os.environ.get("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def health():
    return {"status": "NAV is running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
