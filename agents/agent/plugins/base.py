from abc import ABC, abstractmethod
from typing import Any


class DomainPlugin(ABC):
    """Abstract base class for domain-specific plugins."""

    @abstractmethod
    def get_system_prompt(self, workspace_name: str, doc_count: int) -> str:
        """Return the system prompt for this domain."""
        ...

    @abstractmethod
    def get_tools(self) -> list[Any]:
        """Return the list of @function_tool decorated functions for this domain."""
        ...

    @abstractmethod
    def get_document_types(self) -> list[str]:
        """Return expected document types for this domain."""
        ...

    @abstractmethod
    def get_suggested_questions(self) -> list[dict[str, str]]:
        """Return suggested questions for the frontend UI."""
        ...
