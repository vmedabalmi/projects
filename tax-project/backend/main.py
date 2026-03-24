from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api.routes import router

app = FastAPI(
    title="Tax Planner",
    description="Consumer-facing tax planning for 1040 and Schedule C",
    version="0.1.0",
)

app.include_router(router, prefix="/api")

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def serve_frontend():
    return FileResponse(FRONTEND_DIR / "index.html")
