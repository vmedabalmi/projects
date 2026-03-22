from fastapi import FastAPI

from backend.api.routes import router

app = FastAPI(
    title="Tax Planner",
    description="Consumer-facing tax planning for 1040 and Schedule C",
    version="0.1.0",
)

app.include_router(router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
