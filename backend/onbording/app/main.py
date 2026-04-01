from fastapi import FastAPI

app = FastAPI(title="Onboarding Service", version="1.0.0")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "onboarding"}
