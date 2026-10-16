from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SearchResult(BaseModel):
    id: int
    name: str
    slug: str
    premiered: str | None = None
    genres: list[str] = Field(default_factory=list)
    summary: str | None = None
    image: str | None = None


class Episode(BaseModel):
    id: int
    name: str
    season: int
    number: int | None = None
    airdate: str | None = None
    summary: str | None = None
    image: str | None = None


class Season(BaseModel):
    number: int
    episodes: list[Episode]


class ShowDetails(SearchResult):
    status: str | None = None
    runtime: int | None = None
    rating: float | None = None
    seasons: list[Season] = Field(default_factory=list)
    watched_episode_ids: list[int] = Field(default_factory=list)


class CommentCreate(BaseModel):
    display_name: str = Field(default="Visitante", min_length=1, max_length=40)
    body: str = Field(min_length=1, max_length=1000)
    episode_id: int | None = None


class CommentRead(BaseModel):
    id: int
    display_name: str
    body: str
    episode_id: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WatchedUpdate(BaseModel):
    watched: bool


class InsightRequest(BaseModel):
    episode_id: int | None = None
    language: Literal["en", "pt-BR"] = "en"


class InsightResponse(BaseModel):
    text: str
    generated_by_ai: bool
