from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.permission import Permission
from app.models.user import User
from app.schemas.user import UserCreate


class UserServiceError(Exception):
    pass


def _normalize_permission_names(permission_names: list[str]) -> list[str]:
    cleaned = [name.strip() for name in permission_names if name.strip()]
    return list(dict.fromkeys(cleaned))


def _load_permissions_by_name(db: Session, permission_names: list[str]) -> list[Permission]:
    if not permission_names:
        return []

    permissions = db.scalars(
        select(Permission).where(Permission.name.in_(permission_names))
    ).all()
    existing_names = {permission.name for permission in permissions}
    missing = [name for name in permission_names if name not in existing_names]
    if missing:
        raise UserServiceError(
            f"Unknown permissions requested: {', '.join(sorted(missing))}"
        )
    return permissions


def create_user(db: Session, payload: UserCreate) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise UserServiceError("User with this email already exists")

    permission_names = _normalize_permission_names(payload.permission_names)
    permissions = _load_permissions_by_name(db, permission_names)

    user = User(
        full_name=payload.full_name,
        email=str(payload.email),
        password_hash=payload.password_hash,
        status=payload.status,
        is_admin=payload.is_admin,
    )
    user.permissions = permissions

    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise UserServiceError("Failed to create user due to integrity constraints") from exc

    return db.scalar(
        select(User)
        .options(selectinload(User.permissions))
        .where(User.id == user.id)
    )


def replace_user_permissions(
    db: Session,
    user_id: int,
    permission_names: list[str],
) -> User:
    user = db.scalar(
        select(User)
        .options(selectinload(User.permissions))
        .where(User.id == user_id)
    )
    if user is None:
        raise UserServiceError("User not found")

    normalized_names = _normalize_permission_names(permission_names)
    permissions = _load_permissions_by_name(db, normalized_names)
    user.permissions = permissions

    db.add(user)
    db.commit()

    return db.scalar(
        select(User)
        .options(selectinload(User.permissions))
        .where(User.id == user.id)
    )
