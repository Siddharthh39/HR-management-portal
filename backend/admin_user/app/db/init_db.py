from app.db.base import Base
from app.db.session import engine
from app.models import permission, user  # noqa: F401


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
