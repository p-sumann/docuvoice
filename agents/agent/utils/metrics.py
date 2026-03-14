import time
from dataclasses import dataclass, field

import structlog

logger = structlog.get_logger(__name__)


@dataclass
class SessionMetrics:
    start_time: float = field(default_factory=time.time)
    tool_calls: dict[str, int] = field(default_factory=dict)
    errors: int = 0

    def record_tool_call(self, tool_name: str) -> None:
        self.tool_calls[tool_name] = self.tool_calls.get(tool_name, 0) + 1

    def record_error(self) -> None:
        self.errors += 1

    @property
    def elapsed_seconds(self) -> int:
        return int(time.time() - self.start_time)

    def log_summary(self, session_id: str) -> None:
        logger.info(
            "session_metrics",
            session_id=session_id,
            duration_seconds=self.elapsed_seconds,
            tool_calls=self.tool_calls,
            total_tool_calls=sum(self.tool_calls.values()),
            errors=self.errors,
        )
