FROM python:3.13-slim AS builder

WORKDIR /app

# System deps for pymupdf
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libmupdf-dev && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir .

FROM python:3.13-slim AS runtime

WORKDIR /app

# Runtime deps only (pymupdf needs libmupdf at runtime)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libmupdf-dev curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY app/ app/

ENV APP_ENV=production
ENV APP_PORT=8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--log-level", "warning"]
