"""Structured logging configuration.

In production (app_env != "development"), outputs JSON lines for CloudWatch.
CloudWatch Logs Insights can query these directly — no log agent needed on ECS Fargate.
In development, outputs colored human-readable logs.
"""

import logging
import os
import sys

import structlog

from app.config import settings


def _add_service_context(
    logger: logging.Logger, method_name: str, event_dict: dict
) -> dict:
    """Inject service metadata into every log line for CloudWatch filtering."""
    event_dict["service"] = "docuvoice-backend"
    event_dict["env"] = settings.app_env
    # ECS injects these env vars automatically
    ecs_task = os.environ.get("ECS_TASK_ARN", "")
    if ecs_task:
        event_dict["ecs_task"] = ecs_task.rsplit("/", 1)[-1]
    return event_dict


def setup_logging() -> None:
    """Configure structlog for the application."""
    is_production = settings.app_env != "development"

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if is_production:
        shared_processors.append(_add_service_context)
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # foreign_pre_chain processes logs from non-structlog loggers (uvicorn, etc.)
    # so they get the same timestamps, levels, and formatting as structlog loggers
    foreign_pre_chain = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.UnicodeDecoder(),
    ]
    if is_production:
        foreign_pre_chain.append(_add_service_context)

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=foreign_pre_chain,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO if is_production else logging.DEBUG)

    # Quiet noisy libraries
    for lib in ("botocore", "boto3", "urllib3", "httpx", "httpcore", "instructor"):
        logging.getLogger(lib).setLevel(logging.WARNING)

    # Route uvicorn logs through structlog so they match the app format
    for uvicorn_logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uvicorn_logger = logging.getLogger(uvicorn_logger_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.addHandler(handler)
        uvicorn_logger.propagate = False
