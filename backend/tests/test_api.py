from series_app.main import app
from series_app.services.tvmaze import TVMazeError


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_search_contract(client):
    response = client.get("/api/search", params={"q": "example"})
    assert response.status_code == 200
    assert response.json()[0]["name"] == "The Example"
    assert response.json()[0]["slug"] == "the-example"
    assert "series_visitor" in response.cookies


def test_blank_search_does_not_call_tvmaze(client, monkeypatch):
    async def fail_if_called(query):
        raise AssertionError("TVMaze should not be called for blank searches")

    monkeypatch.setattr(app.state.tvmaze, "search", fail_if_called)

    response = client.get("/api/search", params={"q": "   "})

    assert response.status_code == 200
    assert response.json() == []


def test_invalid_visitor_cookie_is_replaced(client):
    response = client.get("/api/search?q=example", cookies={"series_visitor": "invalid"})

    assert response.status_code == 200
    assert response.cookies["series_visitor"] != "invalid"


def test_search_returns_bad_gateway_when_tvmaze_fails(client, monkeypatch):
    async def fail(query):
        raise TVMazeError("upstream failed")

    monkeypatch.setattr(app.state.tvmaze, "search", fail)

    response = client.get("/api/search?q=example")

    assert response.status_code == 502
    assert response.json() == {"detail": "upstream failed"}


def test_local_frontend_origins_are_allowed(client):
    response = client.options(
        "/api/search?q=example",
        headers={
            "Origin": "http://127.0.0.1:7777",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:7777"

    response = client.options(
        "/api/search?q=example",
        headers={
            "Origin": "http://0.0.0.0:7777",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200


def test_show_details_returns_bad_gateway_when_tvmaze_fails(client, monkeypatch):
    async def fail(show_id):
        raise TVMazeError("upstream failed")

    monkeypatch.setattr(app.state.tvmaze, "get_show", fail)

    response = client.get("/api/shows/1")

    assert response.status_code == 502
    assert response.json() == {"detail": "upstream failed"}


def test_watched_state_persists_for_browser(client):
    detail = client.get("/api/shows/1")
    assert detail.status_code == 200
    assert detail.json()["watched_episode_ids"] == []

    update = client.put("/api/shows/1/episodes/101/watched", json={"watched": True})
    assert update.status_code == 204

    detail = client.get("/api/shows/1")
    assert detail.json()["watched_episode_ids"] == [101]
    assert detail.json()["seasons"][0]["episodes"][0]["name"] == "Pilot"

    remove = client.put("/api/shows/1/episodes/101/watched", json={"watched": False})
    assert remove.status_code == 204
    assert client.get("/api/shows/1").json()["watched_episode_ids"] == []


def test_repeated_watched_updates_are_idempotent(client):
    assert client.put(
        "/api/shows/1/episodes/101/watched", json={"watched": False}
    ).status_code == 204
    assert client.put(
        "/api/shows/1/episodes/101/watched", json={"watched": True}
    ).status_code == 204
    assert client.put(
        "/api/shows/1/episodes/101/watched", json={"watched": True}
    ).status_code == 204
    assert client.get("/api/shows/1").json()["watched_episode_ids"] == [101]


def test_show_can_be_loaded_by_slug(client):
    response = client.get("/api/shows/by-slug/the-example")
    assert response.status_code == 200
    assert response.json()["id"] == 1


def test_show_by_slug_not_found(client):
    response = client.get("/api/shows/by-slug/unknown")

    assert response.status_code == 404
    assert response.json() == {"detail": "Series not found"}


def test_show_by_slug_returns_bad_gateway_when_search_fails(client, monkeypatch):
    async def fail(query):
        raise TVMazeError("upstream failed")

    monkeypatch.setattr(app.state.tvmaze, "search", fail)

    response = client.get("/api/shows/by-slug/the-example")

    assert response.status_code == 502


def test_comment_defaults_and_trims_values(client):
    response = client.post(
        "/api/shows/1/comments",
        json={"display_name": "  ", "body": "  Useful comment  "},
    )

    assert response.status_code == 201
    assert response.json()["display_name"] == "Visitor"
    assert response.json()["body"] == "Useful comment"


def test_comment_rejects_body_that_is_only_whitespace(client):
    response = client.post("/api/shows/1/comments", json={"body": "   "})

    assert response.status_code == 422
    assert response.json()["detail"] == "Comment cannot be empty"


def test_comment_validation_rejects_too_long_body(client):
    response = client.post("/api/shows/1/comments", json={"body": "x" * 1001})

    assert response.status_code == 422


def test_comments_and_insight_fallback(client):
    created = client.post(
        "/api/shows/1/comments",
        json={"display_name": "Rafa", "body": "Gostei do piloto."},
    )
    assert created.status_code == 201
    insight = client.post("/api/shows/1/insights", json={"episode_id": None})
    assert insight.status_code == 200
    assert insight.json()["generated_by_ai"] is False
    assert "comment" in insight.json()["text"]


def test_comments_are_scoped_to_selected_episode(client):
    client.post("/api/shows/1/comments", json={"body": "About the episode", "episode_id": 101})
    assert client.get("/api/shows/1/comments?episode_id=101").json()[0]["body"] == (
        "About the episode"
    )
    assert client.get("/api/shows/1/comments").json() == []


def test_episode_insight_uses_episode_context_and_requested_language(client):
    client.post(
        "/api/shows/1/comments",
        json={"body": "The ending was surprising", "episode_id": 101},
    )

    response = client.post(
        "/api/shows/1/insights",
        json={"episode_id": 101, "language": "pt-BR"},
    )

    assert response.status_code == 200
    assert response.json()["generated_by_ai"] is False
    assert "Pilot" in response.json()["text"]


def test_insight_rejects_episode_from_another_series(client):
    response = client.post("/api/shows/1/insights", json={"episode_id": 999})

    assert response.status_code == 404
    assert response.json() == {"detail": "Episode not found for this series"}


def test_insight_returns_bad_gateway_when_tvmaze_fails(client, monkeypatch):
    async def fail(show_id):
        raise TVMazeError("upstream failed")

    monkeypatch.setattr(app.state.tvmaze, "get_show", fail)

    response = client.post("/api/shows/1/insights", json={})

    assert response.status_code == 502


def test_insight_uses_provider_result(client):
    class Provider:
        async def generate(self, prompt):
            assert "The Example" in prompt
            return "Generated insight"

    app.state.insight_provider = Provider()

    response = client.post("/api/shows/1/insights", json={})

    assert response.status_code == 200
    assert response.json() == {"text": "Generated insight", "generated_by_ai": True}


def test_insight_validation_rejects_unknown_language(client):
    response = client.post("/api/shows/1/insights", json={"language": "fr"})

    assert response.status_code == 422
