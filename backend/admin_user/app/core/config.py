from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"
SERVICE_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    service_name: str = "admin-user-service"
    api_v1_prefix: str = ""

    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = "root"
    mysql_database: str = "hr_management"

    db_pool_size: int = 10
    db_max_overflow: int = 20
    auto_create_tables: bool = False

    admin_bootstrap_email: str = "admin@hr.local"
    admin_bootstrap_password: str = "ChangeMe123!"

    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        )

    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_ENV_FILE), str(SERVICE_ENV_FILE)),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
