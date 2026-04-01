from fastapi import FastAPI

app = FastAPI(title="Punch In Out Service", version="1.0.0")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "punch-in-out"}
