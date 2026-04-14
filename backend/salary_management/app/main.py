import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError


SERVICE_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ENV_FILE = SERVICE_ROOT.parent / ".env"
SERVICE_ENV_FILE = SERVICE_ROOT / ".env"

load_dotenv(BACKEND_ENV_FILE)
load_dotenv(SERVICE_ENV_FILE, override=True)

MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "root")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "hr_management")

DATABASE_URI = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
    f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    f"?ssl_verify_cert=false"
)

IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
engine = create_engine(DATABASE_URI, pool_pre_ping=True, pool_recycle=1800)

app = FastAPI(title="Salary Management Service", version="1.0.0")


def _validated_identifier(value: str, field_name: str) -> str:
    if not IDENTIFIER_RE.match(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}: {value}")
    return value


def _table_exists(table_name: str) -> bool:
    query = text(
        """
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = :schema_name
          AND table_name = :table_name
        """
    )
    with engine.connect() as connection:
        count = connection.execute(
            query,
            {"schema_name": MYSQL_DATABASE, "table_name": table_name},
        ).scalar_one()
    return bool(count)


def _build_filter_clauses(filters: list[str] | None) -> tuple[list[str], dict[str, Any]]:
    if not filters:
        return [], {}

    clauses: list[str] = []
    params: dict[str, Any] = {}

    for index, raw_filter in enumerate(filters):
        if ":" not in raw_filter:
            raise HTTPException(
                status_code=400,
                detail="Invalid filters format. Use filters=column:value",
            )

        column, value = raw_filter.split(":", 1)
        column = _validated_identifier(column.strip(), "filter column")
        param_name = f"filter_{index}"

        clauses.append(f"`{column}` = :{param_name}")
        params[param_name] = value

    return clauses, params


SENSITIVE_FIELDS = {
    "password",
    "password_hash",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "api_key",
}


def _sanitize_record(record: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in record.items() if key.lower() not in SENSITIVE_FIELDS}


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "salary-management"}


@app.get("/db/health", tags=["database"])
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1")).scalar_one()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {exc}") from exc

    return {
        "status": "ok",
        "service": "salary-management",
        "database": MYSQL_DATABASE,
        "host": MYSQL_HOST,
        "port": MYSQL_PORT,
    }


@app.get("/db/tables", tags=["database"])
def list_tables():
    query = text(
        """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = :schema_name
        ORDER BY table_name ASC
        """
    )

    try:
        with engine.connect() as connection:
            rows = connection.execute(query, {"schema_name": MYSQL_DATABASE}).scalars().all()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to list tables: {exc}") from exc

    return {"database": MYSQL_DATABASE, "tables": rows}


@app.get("/db/query", tags=["database"])
def query_table(
    table: str = Query(..., description="Table name to query"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    order_by: str | None = Query(default=None, description="Column name for sorting"),
    order_dir: str = Query(default="asc", pattern="^(asc|desc)$"),
    filters: list[str] | None = Query(
        default=None,
        description="Repeat as filters=column:value",
    ),
):
    table = _validated_identifier(table, "table")

    if not _table_exists(table):
        raise HTTPException(status_code=404, detail=f"Table not found: {table}")

    where_clauses, where_params = _build_filter_clauses(filters)
    where_sql = f" WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    order_sql = ""
    if order_by:
        order_column = _validated_identifier(order_by, "order_by")
        order_sql = f" ORDER BY `{order_column}` {order_dir.upper()}"

    select_sql = f"SELECT * FROM `{table}`{where_sql}{order_sql} LIMIT :limit OFFSET :offset"
    count_sql = f"SELECT COUNT(*) FROM `{table}`{where_sql}"

    params = {**where_params, "limit": limit, "offset": offset}

    try:
        with engine.connect() as connection:
            items = connection.execute(text(select_sql), params).mappings().all()
            total = connection.execute(text(count_sql), where_params).scalar_one()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail=f"Query failed: {exc}") from exc

    return {
        "table": table,
        "limit": limit,
        "offset": offset,
        "total": int(total),
        "items": [_sanitize_record(dict(item)) for item in items],
    }


@app.get("/db/query/{table}/{record_id}", tags=["database"])
def query_single_record(
    table: str,
    record_id: str,
    id_column: str = Query(default="id", description="Primary key column name"),
):
    table = _validated_identifier(table, "table")
    id_column = _validated_identifier(id_column, "id_column")

    if not _table_exists(table):
        raise HTTPException(status_code=404, detail=f"Table not found: {table}")

    sql = text(f"SELECT * FROM `{table}` WHERE `{id_column}` = :record_id LIMIT 1")

    try:
        with engine.connect() as connection:
            record = connection.execute(sql, {"record_id": record_id}).mappings().first()
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=500, detail=f"Query failed: {exc}") from exc

    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")

    return {
        "table": table,
        "id_column": id_column,
        "record": _sanitize_record(dict(record)),
    }
