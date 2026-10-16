from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from series_app.models import Comment
from series_app.schemas import (
    CommentCreate,
    CommentRead,
    Episode,
    InsightRequest,
    InsightResponse,
    SearchResult,
    Season,
    ShowDetails,
    WatchedUpdate,
)


def test_search_and_show_schemas_apply_defaults():
    search = SearchResult(id=1, name="Example", slug="example")
    show = ShowDetails(id=1, name="Example", slug="example")

    assert search.genres == []
    assert search.summary is None
    assert show.seasons == []
    assert show.watched_episode_ids == []


def test_episode_and_season_schemas_keep_optional_fields():
    episode = Episode(id=10, name="Pilot", season=1)
    season = Season(number=1, episodes=[episode])

    assert episode.number is None
    assert episode.image is None
    assert season.episodes == [episode]


def test_comment_create_defaults_and_limits():
    assert CommentCreate(body="hello").display_name == "Visitor"

    with pytest.raises(ValidationError):
        CommentCreate(body="")
    with pytest.raises(ValidationError):
        CommentCreate(display_name="x" * 41, body="hello")
    with pytest.raises(ValidationError):
        CommentCreate(body="x" * 1001)


def test_comment_read_supports_orm_objects():
    comment = Comment(
        id=1,
        display_name="Rafa",
        body="Hello",
        episode_id=None,
        created_at=datetime.now(UTC),
    )

    result = CommentRead.model_validate(comment)

    assert result.id == 1
    assert result.display_name == "Rafa"


def test_other_request_and_response_schemas():
    assert WatchedUpdate(watched=True).watched is True
    assert InsightRequest().language == "en"
    assert InsightRequest(episode_id=10, language="pt-BR").episode_id == 10
    assert InsightRequest(language="pt_BR").language == "pt-BR"
    assert InsightRequest(language="pt-PT").language == "pt-BR"
    assert InsightRequest(language="en-US").language == "en"
    assert InsightResponse(text="Insight", generated_by_ai=False).text == "Insight"

    with pytest.raises(ValidationError):
        InsightRequest(language="es")
