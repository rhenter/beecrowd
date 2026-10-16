from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from series_app.database import Base, get_session
from series_app.main import app


class FakeTVMaze:
    async def search(self, query: str) -> list[dict]:
        return [{"id": 1, "name": "The Example", "slug": "the-example", "genres": ["Drama"], "premiered": "2020-01-01"}]

    async def get_show(self, show_id: int) -> dict:
        return {
            "id": show_id,
            "name": "The Example",
            "slug": "the-example",
            "genres": ["Drama"],
            "summary": "A character-driven story.",
            "image": None,
            "premiered": "2020-01-01",
            "rating": 8.2,
            "status": "Ended",
            "runtime": 45,
        }

    async def get_episodes(self, show_id: int) -> list[dict]:
        return [
            {"id": 101, "name": "Pilot", "season": 1, "number": 1, "airdate": "2020-01-01"},
            {"id": 102, "name": "Second Chances", "season": 1, "number": 2, "airdate": "2020-01-08"},
        ]


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    test_sessions = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_session():
        with test_sessions() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    app.state.tvmaze = FakeTVMaze()
    app.state.insight_provider = None
    test_client = TestClient(app)
    yield test_client
    test_client.close()
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()
