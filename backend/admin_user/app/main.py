from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.init_db import initialize_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.auto_create_tables:
        initialize_database()
    yield


app = FastAPI(
    title="HR Admin and User Service",
    version="1.0.0",
    lifespan=lifespan,
)
app.include_router(api_router, prefix=settings.api_v1_prefix)
