from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from series_app.database import Base


class WatchedEpisode(Base):
    __tablename__ = "watched_episodes"
    __table_args__ = (
        UniqueConstraint("visitor_id", "episode_id", name="uq_watched_visitor_episode"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    visitor_id: Mapped[str] = mapped_column(String(36), index=True)
    show_id: Mapped[int] = mapped_column(Integer, index=True)
    episode_id: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    visitor_id: Mapped[str] = mapped_column(String(36), index=True)
    display_name: Mapped[str] = mapped_column(String(40), default="Visitante")
    show_id: Mapped[int] = mapped_column(Integer, index=True)
    episode_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    body: Mapped[str] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
