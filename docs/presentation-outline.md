# Series Atlas technical challenge

## 30-minute presentation plan

### 0–10 min: architecture and trade-offs

1. Frame the delivery as a small split application: React/Vite on port 7777, FastAPI on port 8000, SQLAlchemy, PostgreSQL, and the local Agno AgentOS runtime.
2. Walk through the request path: the React frontend on `:7777` calls the product API on `:8000`; the TVMaze adapter owns external HTTP and normalization; SQLAlchemy persists only user-owned state.
3. Show how `AgentOS(base_app=app)` exposes the product routes and the agent runtime through one ASGI application.
4. Explain the AI boundary: an `InsightProvider` interface, Hugging Face model configuration on the server, bounded prompt context, timeout, and a deterministic fallback.
5. Explain the identity trade-off: a random HttpOnly browser cookie avoids an account flow for the demo, while production needs account authentication and authorization.
6. Explain delivery: GitHub hosts the repository, while Jenkins runs the `Jenkinsfile` inside the evaluation VM to lint and test the backend and build the frontend.

### 10–20 min: live product walkthrough

1. Start the system with `docker compose up --build`, open the frontend at `http://localhost:7777`, and show the API health endpoint at `http://localhost:8000/health`.
2. Search for a series and open its details. Point out the poster, summary, genres, and episodes grouped by season.
3. Mark an episode watched, refresh the page, and show that PostgreSQL preserves the state for the same browser.
4. Add one series comment and one episode comment. Switch the selected episode to show the comment scope.
5. Generate an insight without `HF_TOKEN` to show the labelled fallback. With a valid Hugging Face token, repeat the request and show the AI label.
6. Visit `/health` and `/docs`. Explain that AgentOS endpoints require the configured `OS_SECURITY_KEY`.

### 20–30 min: code review and discussion

Review these files in this order:

1. `src/series_app/api/routes.py` for request orchestration and validation.
2. `src/series_app/services/tvmaze.py` for the external API boundary, normalization, and timeout handling.
3. `src/series_app/services/insights.py` for provider isolation, prompt construction, and fallback behavior.
4. `src/series_app/models.py` and `alembic/versions/0001_initial.py` for persisted state and the watched-episode uniqueness rule.
5. `tests/test_api.py` and `tests/test_services.py` for behavior verified without external services.

Close by describing the next production steps: account-based identity, authorization and ownership rules, comment moderation, rate limits, and caching only after measuring TVMaze latency or availability.

## Likely reviewer questions

### Why separate frontend and API ports?

The React/Vite development server runs on `:7777` and the FastAPI product API runs on `:8000`. This keeps the browser client and API independently deployable while Vite's proxy and FastAPI CORS configuration make local development straightforward. Docker Compose starts both services separately.

### Why FastAPI instead of Django?

AgentOS is a FastAPI runtime and supports adding its routes to an existing FastAPI app. The challenge has no need for Django's admin, so FastAPI keeps the integration direct and leaves the React client independent.

### Why keep the catalog outside our database?

TVMaze owns the public series and episode catalog. The app stores only its own data: watched state and comments. This avoids duplicating external records and needing a catalog synchronization process.

### How does watched state survive a refresh?

The browser reuses a random UUID in an HttpOnly cookie. The API scopes watched records to that UUID and stores them in PostgreSQL. A different browser profile gets a different identity.

### What happens if Hugging Face is unavailable?

The provider is isolated behind `InsightProvider`. A missing token disables model calls, and a provider error or empty response returns a contextual fallback with `generated_by_ai=false`.

### Why is the model configuration not stored in the database?

This challenge has one server-side model choice and no operator screen. Environment configuration keeps the scope small and avoids exposing provider credentials to the browser or product database. Database-backed selection can be added if runtime model changes become a real product need.

### Why Jenkins if the code is on GitHub?

GitHub is the source-code repository and webhook/integration point. Jenkins is the CI executor required by the evaluation environment: it checks out the repository inside the VM, runs the `Jenkinsfile`, verifies the backend, and builds the frontend. The two tools have complementary responsibilities.

### What would change for production?

Replace the anonymous cookie identity with authenticated accounts, enforce authorization and comment ownership, add moderation and rate limits, keep credentials in a managed secret store, and add monitoring. Add cache or background work only if measured traffic or latency justifies it.
