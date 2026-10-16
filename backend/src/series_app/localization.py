from functools import lru_cache
from gettext import GNUTranslations, NullTranslations, translation
from pathlib import Path

LOCALE_DIR = Path(__file__).parent / "locales"


def _locale_name(language: str) -> str:
    return "pt_BR" if language == "pt-BR" else "en"


@lru_cache(maxsize=2)
def _translations(language: str) -> GNUTranslations | NullTranslations:
    return translation(
        "messages",
        localedir=LOCALE_DIR,
        languages=[_locale_name(language)],
        fallback=True,
    )


def translate(message: str, language: str = "en") -> str:
    return _translations(language).gettext(message)
