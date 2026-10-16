def test_search_contract(client):
    response = client.get("/api/search", params={"q": "example"})
    assert response.status_code == 200
    assert response.json()[0]["name"] == "The Example"
    assert response.json()[0]["slug"] == "the-example"
    assert "series_visitor" in response.cookies


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


def test_watched_state_persists_for_browser(client):
    detail = client.get("/api/shows/1")
    assert detail.status_code == 200
    assert detail.json()["watched_episode_ids"] == []

    update = client.put("/api/shows/1/episodes/101/watched", json={"watched": True})
    assert update.status_code == 204

    detail = client.get("/api/shows/1")
    assert detail.json()["watched_episode_ids"] == [101]
    assert detail.json()["seasons"][0]["episodes"][0]["name"] == "Pilot"


def test_show_can_be_loaded_by_slug(client):
    response = client.get("/api/shows/by-slug/the-example")
    assert response.status_code == 200
    assert response.json()["id"] == 1


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
    assert client.get("/api/shows/1/comments?episode_id=101").json()[0]["body"] == "About the episode"
    assert client.get("/api/shows/1/comments").json() == []
