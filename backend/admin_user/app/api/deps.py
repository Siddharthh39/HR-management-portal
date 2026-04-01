from typing import Annotated, Generator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.user import User


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_actor(
    x_actor_email: Annotated[str | None, Header(alias="X-Actor-Email")] = None,
    db: Session = Depends(get_db),
) -> User:
    if not x_actor_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Actor-Email header is required",
        )

    actor = db.scalar(select(User).where(User.email == x_actor_email))
    if actor is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Actor not found",
        )
    return actor


def require_admin(actor: User = Depends(get_actor)) -> User:
    if not actor.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privilege required",
        )
    return actor
