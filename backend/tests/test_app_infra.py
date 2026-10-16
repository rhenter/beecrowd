import os
import runpy
from contextlib import nullcontext

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import series_app.database as database
import series_app.main as main_module
import series_app.wait_for_db as wait_for_db
from series_app.config import Settings


def test_database_session_dependency_yields_and_closes_session(monkeypatch):
    engine = create_engine("sqlite://")
    sessions = sessionmaker(bind=engine)
    monkeypatch.setattr(database, "SessionLocal", sessions)

    dependency = database.get_session()
    session = next(dependency)

    assert session.is_active
    dependency.close()
    engine.dispose()


def test_create_app_configures_lifespan_and_health(monkeypatch):
    class DummyAgent:
        pass

    class DummyAgentOS:
        def __init__(self, **kwargs):
            self.app = FastAPI()

        def get_app(self):
            return self.app

    monkeypatch.setattr(main_module, "build_agent", lambda *args: DummyAgent())
    monkeypatch.setattr(main_module, "PostgresDb", lambda **kwargs: object())
    monkeypatch.setattr(main_module, "AgentOS", DummyAgentOS)
    settings = Settings(ai_provider="huggingface", database_url="sqlite://", hf_token="")

    app = main_module.create_app(settings)

    with TestClient(app) as client:
        assert client.get("/health").json() == {"status": "ok"}
        assert app.state.tvmaze._base_url == settings.tvmaze_base_url
        assert app.state.insight_provider is None


def test_wait_for_db_retries_until_connection_succeeds(monkeypatch):
    attempts = []

    def connect(dsn, connect_timeout):
        attempts.append((dsn, connect_timeout))
        if len(attempts) == 1:
            raise wait_for_db.psycopg.OperationalError("not ready")
        return nullcontext()

    monkeypatch.setattr(wait_for_db, "get_settings", lambda: Settings(database_url="postgresql+psycopg://db"))
    monkeypatch.setattr(wait_for_db.psycopg, "connect", connect)
    monkeypatch.setattr(wait_for_db.time, "sleep", lambda seconds: None)

    wait_for_db.main()

    assert attempts == [("postgresql://db", 2), ("postgresql://db", 2)]


def test_wait_for_db_raises_after_final_attempt(monkeypatch):
    attempts = 0

    def connect(dsn, connect_timeout):
        nonlocal attempts
        attempts += 1
        raise wait_for_db.psycopg.OperationalError("still unavailable")

    monkeypatch.setattr(wait_for_db, "get_settings", lambda: Settings(database_url="postgresql+psycopg://db"))
    monkeypatch.setattr(wait_for_db.psycopg, "connect", connect)
    monkeypatch.setattr(wait_for_db.time, "sleep", lambda seconds: None)

    with pytest.raises(wait_for_db.psycopg.OperationalError, match="still unavailable"):
        wait_for_db.main()

    assert attempts == 30


def test_wait_for_db_module_entrypoint(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://db")
    monkeypatch.setattr(wait_for_db.psycopg, "connect", lambda *args, **kwargs: nullcontext())

    runpy.run_module("series_app.wait_for_db", run_name="__main__")

    assert os.environ["DATABASE_URL"] == "postgresql+psycopg://db"
