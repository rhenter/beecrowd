import { useLanguage } from '../i18n/LanguageContext';

function EpisodeCard({ episode, watched, selected, onToggleWatched, onSelect, onComment }) {
  const { t } = useLanguage();
  return (
    <article className={`episode-card ${selected ? 'selected' : ''} ${watched ? 'watched' : ''}`}>
      <button className={`watch-toggle ${watched ? 'checked' : ''}`} onClick={() => onToggleWatched(episode)} aria-label={watched ? t('markUnwatched') : t('markWatched')}>{watched ? '✓' : ''}</button>
      <button className="episode-main" onClick={() => onSelect(episode)}><span className="episode-number">{String(episode.number ?? '–').padStart(2, '0')}</span><span className="episode-title">{episode.name}<small>{episode.airdate || t('dateUnavailable')}</small></span><span className="episode-chevron">{selected ? '−' : '+'}</span></button>
      <button className={`episode-comment-button ${selected ? 'active' : ''}`} onClick={() => onComment(episode)} aria-label={`${t('comment')} ${episode.name}`}>{t('comment')}</button>
    </article>
  );
}

export default function SeasonList({ seasons, watchedEpisodeIds, selectedEpisodeId, busySeason, onMarkSeasonWatched, onToggleWatched, onSelectEpisode, onCommentEpisode }) {
  const { t } = useLanguage();
  return seasons.map((season) => {
    const seasonComplete = season.episodes.every((episode) => watchedEpisodeIds.includes(episode.id));

    return (
      <div className="season-block" key={season.number}>
        <h3>
          <span className="season-title">{t('season')} {season.number}<small>{season.episodes.length} {t('episodes')}</small></span>
          <button className={`season-action ${seasonComplete ? 'complete' : ''}`} onClick={() => onMarkSeasonWatched(season)} disabled={seasonComplete || busySeason === season.number}>
            {busySeason === season.number ? t('saving') : seasonComplete ? t('seasonWatched') : t('markSeasonWatched')}
          </button>
        </h3>
        {season.episodes.map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} watched={watchedEpisodeIds.includes(episode.id)} selected={selectedEpisodeId === episode.id} onToggleWatched={onToggleWatched} onSelect={onSelectEpisode} onComment={onCommentEpisode} />
        ))}
      </div>
    );
  });
}
