FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.13.0 /uv /uvx /bin/
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH"
WORKDIR /app
COPY backend/pyproject.toml ./pyproject.toml
COPY backend/uv.lock ./uv.lock
RUN uv sync --locked --no-dev --no-install-project
COPY backend/src/ ./src/
COPY backend/alembic.ini ./alembic.ini
COPY backend/alembic/ ./alembic/
ENV PYTHONPATH=/app/src
EXPOSE 8000
CMD ["sh", "-c", "python -m series_app.wait_for_db && alembic upgrade head && uvicorn series_app.main:app --host 0.0.0.0 --port 8000"]
