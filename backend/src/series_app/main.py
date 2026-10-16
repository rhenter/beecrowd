from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from agno.db.postgres import PostgresDb
from agno.os import AgentOS
from agno.os.settings import AgnoAPISettings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from series_app.api.routes import router
from series_app.config import Settings, get_settings
from series_app.services.insights import AgnoInsightProvider, build_agent
from series_app.services.tvmaze import TVMazeClient


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    hf_token = settings.hf_token.strip() if settings.hf_token else None
    agent = build_agent(
        settings.ai_provider,
        settings.hf_model,
        hf_token,
        settings.ollama_model,
        settings.ollama_base_url,
    )
    agent_db = PostgresDb(db_url=settings.database_url, db_schema="agentos")

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=3.0)) as client:
            application.state.tvmaze = TVMazeClient(client, settings.tvmaze_base_url)
            yield

    app = FastAPI(
        title="Series Atlas API",
        version="1.0.0",
        description="TV series discovery, watch tracking, comments, and AI insights.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.insight_provider = (
        AgnoInsightProvider(agent)
        if settings.ai_provider == "ollama" or hf_token
        else None
    )
    app.include_router(router)

    @app.get("/health", tags=["health"], response_model=dict[str, str])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    agent_os = AgentOS(
        id="series-atlas-os",
        name="Series Atlas AgentOS",
        agents=[agent],
        db=agent_db,
        tracing=True,
        settings=AgnoAPISettings(os_security_key=settings.os_security_key),
    )
    app.mount("/os", agent_os.get_app())

    return app


app = create_app()
