from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_actor, get_db, require_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserPermissionUpdate
from app.services.user_service import UserServiceError, create_user, replace_user_permissions

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
):
    users = db.scalars(
        select(User)
        .options(selectinload(User.permissions))
        .offset(skip)
        .limit(limit)
        .order_by(User.id.asc())
    ).all()
    return users


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        return create_user(db, payload)
    except UserServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{user_id}/permissions", response_model=UserOut)
def replace_user_permissions_endpoint(
    user_id: int,
    payload: UserPermissionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        return replace_user_permissions(db, user_id, payload.permission_names)
    except UserServiceError as exc:
        if str(exc) == "User not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(exc),
            ) from exc
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/me", response_model=UserOut)
def me(
    db: Session = Depends(get_db),
    actor: User = Depends(get_actor),
):
    user = db.scalar(
        select(User)
        .options(selectinload(User.permissions))
        .where(User.id == actor.id)
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
