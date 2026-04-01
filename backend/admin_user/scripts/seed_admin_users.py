from pathlib import Path
import sys

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.config import settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.models.permission import Permission  # noqa: E402
from app.models.user import User  # noqa: E402


def create_database_if_missing() -> None:
    database_name = settings.mysql_database.replace("`", "")
    server_engine = create_engine(
        f"mysql+pymysql://{settings.mysql_user}:{settings.mysql_password}"
        f"@{settings.mysql_host}:{settings.mysql_port}",
        pool_pre_ping=True,
    )
    with server_engine.connect() as connection:
        connection.execute(
            text(
                "CREATE DATABASE IF NOT EXISTS "
                f"`{database_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        )
        connection.commit()


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def upsert_permission(db: Session, name: str, description: str | None = None) -> Permission:
    permission = db.scalar(select(Permission).where(Permission.name == name))
    if permission is None:
        permission = Permission(name=name, description=description)
        db.add(permission)
        db.flush()
    else:
        permission.description = description
    return permission


def upsert_user(
    db: Session,
    full_name: str,
    email: str,
    password_hash: str,
    is_admin: bool,
    status: str,
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            full_name=full_name,
            email=email,
            password_hash=password_hash,
            is_admin=is_admin,
            status=status,
        )
        db.add(user)
        db.flush()
    else:
        user.full_name = full_name
        user.password_hash = password_hash
        user.is_admin = is_admin
        user.status = status
    return user


def seed_data() -> None:
    create_database_if_missing()
    create_tables()

    with Session(engine) as db:
        ec2_permission = upsert_permission(
            db,
            name="aws.ec2",
            description="Allows user to access EC2 management scope.",
        )

        admin_user = upsert_user(
            db,
            full_name="Platform Admin",
            email=settings.admin_bootstrap_email,
            password_hash=settings.admin_bootstrap_password,
            is_admin=True,
            status="active",
        )
        admin_user.permissions = [ec2_permission]

        standard_user = upsert_user(
            db,
            full_name="HR Executive",
            email="hr.executive@hr.local",
            password_hash="HrExec123!",
            is_admin=False,
            status="active",
        )
        standard_user.permissions = [ec2_permission]

        db.commit()

    print("Seed completed: admin and default user created/updated with aws.ec2 permission.")


if __name__ == "__main__":
    seed_data()
