import { useLanguage } from '../i18n/LanguageContext';

export default function SearchResults({ results, onSelect }) {
  const { t } = useLanguage();
  if (!results.length) return null;

  return (
    <div className="search-results">
      {results.map((item) => (
        <button key={item.id} onClick={() => onSelect(item)} className="result-row">
          {item.image ? <img src={item.image} alt="" /> : <span className="result-placeholder">✦</span>}
          <span><strong>{item.name}</strong><small>{item.premiered?.slice(0, 4) || t('unknownYear')} · {item.genres.join(' / ') || t('show')}</small></span>
          <span className="result-arrow">↗</span>
        </button>
      ))}
    </div>
  );
}
