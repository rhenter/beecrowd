import { useLanguage } from '../i18n/LanguageContext';

export default function Header({ onHome }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} aria-label={t('homePage')}>
        <span className="brand-mark">✦</span><span>series<span className="brand-light">atlas</span></span>
      </button>
      <div className="topbar-note"><span className="live-dot" /> {t('binge')}</div>
      <label className="language-switcher"><span className="sr-only">{t('language')}</span><select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t('language')}><option value="en">EN</option><option value="pt-BR">PT-BR</option></select></label>
      <a className="github-link" href="https://www.tvmaze.com/" target="_blank" rel="noreferrer">TVMaze ↗</a>
    </header>
  );
}
