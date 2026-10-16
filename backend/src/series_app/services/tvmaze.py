import re
from html import unescape
from typing import Any
from unicodedata import normalize

import httpx


class TVMazeError(Exception):
    """Raised when TVMaze cannot provide a valid response."""


class TVMazeClient:
    def __init__(self, client: httpx.AsyncClient, base_url: str) -> None:
        self._client = client
        self._base_url = base_url.rstrip("/")

    async def search(self, query: str) -> list[dict[str, Any]]:
        payload = await self._get("/search/shows", params={"q": query})
        return [self._normalize_show(item.get("show", {})) for item in payload]

    async def get_show(self, show_id: int) -> dict[str, Any]:
        return self._normalize_show(await self._get(f"/shows/{show_id}"))

    async def get_episodes(self, show_id: int) -> list[dict[str, Any]]:
        payload = await self._get(f"/shows/{show_id}/episodes")
        return [self._normalize_episode(item) for item in payload]

    async def _get(self, path: str, params: dict[str, str] | None = None) -> Any:
        try:
            response = await self._client.get(f"{self._base_url}{path}", params=params)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise TVMazeError("TVMaze is temporarily unavailable") from exc

    @staticmethod
    def _normalize_show(show: dict[str, Any]) -> dict[str, Any]:
        image = show.get("image") or {}
        rating = (show.get("rating") or {}).get("average")
        name = show.get("name", "Untitled")
        return {
            "id": show["id"],
            "name": name,
            "slug": TVMazeClient.slugify(name),
            "premiered": show.get("premiered"),
            "genres": show.get("genres") or [],
            "summary": TVMazeClient._plain_text(show.get("summary")),
            "image": image.get("medium") or image.get("original"),
            "status": show.get("status"),
            "runtime": show.get("runtime"),
            "rating": rating,
        }

    @staticmethod
    def slugify(value: str) -> str:
        value = normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
        return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

    @staticmethod
    def _normalize_episode(episode: dict[str, Any]) -> dict[str, Any]:
        image = episode.get("image") or {}
        return {
            "id": episode["id"],
            "name": episode.get("name", "Untitled"),
            "season": episode.get("season") or 0,
            "number": episode.get("number"),
            "airdate": episode.get("airdate"),
            "summary": TVMazeClient._plain_text(episode.get("summary")),
            "image": image.get("medium") or image.get("original"),
        }

    @staticmethod
    def _plain_text(value: str | None) -> str | None:
        if not value:
            return None
        return unescape(re.sub(r"<[^>]*>", " ", value)).strip()
