import SearchResults from '../components/SearchResults';
import { useLanguage } from '../i18n/LanguageContext';

const popularShows = ['Severance', 'The Bear', 'Dark', 'Succession'];

export default function HomePage({ query, results, onQueryChange, onSelectShow }) {
  const { t } = useLanguage();
  return (
    <main className="landing">
      <section className="hero">
        <div className="eyebrow"><span>✦</span> {t('explore')}</div>
        <h1>{t('stories')}<br />{t('withYou')} <span>{t('you')}</span></h1>
        <p>{t('homeDescription')}</p>
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchShows')} />
          <kbd>↵</kbd>
          <SearchResults results={results} onSelect={onSelectShow} />
        </div>
        <div className="popular"><span>{t('popular')}</span>{popularShows.map((title) => <button key={title} onClick={() => onQueryChange(title)}>{title}</button>)}</div>
      </section>
      <section className="feature-strip">
        <article><span className="feature-icon violet">◷</span><div><strong>{t('progressSaved')}</strong><p>{t('continueWatching')}</p></div></article>
        <article><span className="feature-icon blue">▤</span><div><strong>{t('seasonsInOrder')}</strong><p>{t('episodesOrganized')}</p></div></article>
        <article><span className="feature-icon amber">✧</span><div><strong>{t('aiInsights')}</strong><p>{t('newAngles')}</p></div></article>
      </section>
      <footer className="landing-footer">{t('footer')} <span>·</span> {t('showData')}</footer>
    </main>
  );
}
