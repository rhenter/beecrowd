import time

import psycopg

from series_app.config import get_settings


def main() -> None:
    dsn = get_settings().database_url.replace("postgresql+psycopg://", "postgresql://", 1)
    for attempt in range(30):
        try:
            with psycopg.connect(dsn, connect_timeout=2):
                return
        except psycopg.OperationalError:
            if attempt == 29:
                raise
            time.sleep(1)


if __name__ == "__main__":
    main()
