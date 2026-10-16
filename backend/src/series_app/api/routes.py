from collections import defaultdict
from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from series_app.config import Settings, get_settings
from series_app.database import get_session
from series_app.models import Comment, WatchedEpisode
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
from series_app.services.insights import fallback_insight, generate_insight, make_prompt
from series_app.services.tvmaze import TVMazeClient, TVMazeError

router = APIRouter(prefix="/api")


def get_visitor_id(
    response: Response,
    visitor_cookie: str | None = Cookie(default=None, alias="series_visitor"),
    settings: Settings = Depends(get_settings),
) -> str:
    try:
        visitor_id = str(UUID(visitor_cookie)) if visitor_cookie else str(uuid4())
    except ValueError:
        visitor_id = str(uuid4())
    response.set_cookie(
        "series_visitor",
        visitor_id,
        max_age=60 * 60 * 24 * 365,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    return visitor_id


def _tvmaze(request: Request) -> TVMazeClient:
    return request.app.state.tvmaze


@router.get("/search", response_model=list[SearchResult])
async def search_shows(
    q: str, request: Request, _: str = Depends(get_visitor_id)
) -> list[dict[str, Any]]:
    if not q.strip():
        return []
    try:
        return await _tvmaze(request).search(q.strip()[:100])
    except TVMazeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/shows/{show_id}", response_model=ShowDetails)
async def show_details(
    show_id: int,
    request: Request,
    visitor_id: str = Depends(get_visitor_id),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    try:
        show = await _tvmaze(request).get_show(show_id)
        episodes = await _tvmaze(request).get_episodes(show_id)
    except TVMazeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    grouped: dict[int, list[Episode]] = defaultdict(list)
    for item in episodes:
        grouped[item["season"]].append(Episode(**item))
    watched = await run_in_threadpool(
        lambda: session.scalars(
            select(WatchedEpisode.episode_id).where(
                WatchedEpisode.visitor_id == visitor_id,
                WatchedEpisode.show_id == show_id,
            )
        ).all()
    )
    return {
        **show,
        "seasons": [
            Season(number=number, episodes=items) for number, items in sorted(grouped.items())
        ],
        "watched_episode_ids": list(watched),
    }


@router.get("/shows/by-slug/{slug}", response_model=ShowDetails)
async def show_details_by_slug(
    slug: str,
    request: Request,
    visitor_id: str = Depends(get_visitor_id),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    try:
        matches = await _tvmaze(request).search(slug.replace("-", " "))
    except TVMazeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    show = next((item for item in matches if item["slug"] == slug), None)
    if show is None:
        raise HTTPException(status_code=404, detail="Series not found")
    return await show_details(show["id"], request, visitor_id, session)


@router.get("/shows/{show_id}/comments", response_model=list[CommentRead])
def list_comments(
    show_id: int,
    episode_id: int | None = None,
    session: Session = Depends(get_session),
) -> list[Comment]:
    query = select(Comment).where(Comment.show_id == show_id)
    query = query.where(Comment.episode_id == episode_id)
    return list(session.scalars(query.order_by(Comment.created_at.desc()).limit(100)).all())


@router.post(
    "/shows/{show_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    show_id: int,
    payload: CommentCreate,
    visitor_id: str = Depends(get_visitor_id),
    session: Session = Depends(get_session),
) -> Comment:
    comment = Comment(
        visitor_id=visitor_id,
        display_name=payload.display_name.strip() or "Visitor",
        show_id=show_id,
        episode_id=payload.episode_id,
        body=payload.body.strip(),
    )
    if not comment.body:
        raise HTTPException(status_code=422, detail="Comment cannot be empty")
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment


@router.put(
    "/shows/{show_id}/episodes/{episode_id}/watched", status_code=status.HTTP_204_NO_CONTENT
)
def set_watched(
    show_id: int,
    episode_id: int,
    payload: WatchedUpdate,
    visitor_id: str = Depends(get_visitor_id),
    session: Session = Depends(get_session),
) -> None:
    current = session.scalar(
        select(WatchedEpisode).where(
            WatchedEpisode.visitor_id == visitor_id,
            WatchedEpisode.episode_id == episode_id,
        )
    )
    if payload.watched and current is None:
        session.add(WatchedEpisode(visitor_id=visitor_id, show_id=show_id, episode_id=episode_id))
    elif not payload.watched and current is not None:
        session.delete(current)
    session.commit()


@router.post("/shows/{show_id}/insights", response_model=InsightResponse)
async def create_insight(
    show_id: int,
    payload: InsightRequest,
    request: Request,
    session: Session = Depends(get_session),
) -> InsightResponse:
    tvmaze: TVMazeClient = request.app.state.tvmaze
    try:
        show = await tvmaze.get_show(show_id)
        episode = None
        if payload.episode_id is not None:
            episodes = await tvmaze.get_episodes(show_id)
            episode = next((item for item in episodes if item["id"] == payload.episode_id), None)
            if episode is None:
                raise HTTPException(status_code=404, detail="Episode not found for this series")
        comments = await run_in_threadpool(
            lambda: session.scalars(
                select(Comment)
                .where(Comment.show_id == show_id, Comment.episode_id == payload.episode_id)
                .order_by(Comment.created_at.desc())
                .limit(20)
            ).all()
        )
    except TVMazeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    comment_texts = [item.body for item in comments]
    fallback = fallback_insight(show, episode, comment_texts, payload.language)
    text, generated = await generate_insight(
        request.app.state.insight_provider,
        make_prompt(show, episode, comment_texts, payload.language),
        fallback,
    )
    return InsightResponse(text=text, generated_by_ai=generated)
