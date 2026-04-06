from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.permission import PermissionOut


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    password_hash: str = Field(min_length=8, max_length=255)
    status: str = Field(default="active", max_length=30)
    is_admin: bool = False
    permission_names: list[str] = Field(default_factory=list)


class UserPermissionUpdate(BaseModel):
    permission_names: list[str] = Field(default_factory=list)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    status: str
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    permissions: list[PermissionOut] = Field(default_factory=list)


class UserActor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    is_admin: bool
