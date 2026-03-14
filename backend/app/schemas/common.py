from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


def _to_camel(field_name: str) -> str:
    parts = field_name.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


class CamelCaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=_to_camel,
        serialize_by_alias=True,
    )


class ApiResponse(CamelCaseModel, Generic[T]):
    data: T
    success: bool = True
    error: str | None = None


class PaginatedResponse(CamelCaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    has_more: bool
