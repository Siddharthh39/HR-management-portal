from fastapi import FastAPI

app = FastAPI(title="Salary Management Service", version="1.0.0")


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "salary-management"}
