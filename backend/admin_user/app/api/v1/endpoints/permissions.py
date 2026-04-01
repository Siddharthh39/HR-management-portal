from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.permission import Permission
from app.models.user import User
from app.schemas.permission import PermissionCreate, PermissionOut

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("", response_model=list[PermissionOut])
def list_permissions(db: Session = Depends(get_db)):
    permissions = db.scalars(select(Permission).order_by(Permission.name.asc())).all()
    return permissions


@router.post("", response_model=PermissionOut, status_code=status.HTTP_201_CREATED)
def create_permission(
    payload: PermissionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = db.scalar(select(Permission).where(Permission.name == payload.name))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission already exists",
        )

    permission = Permission(name=payload.name, description=payload.description)
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission
