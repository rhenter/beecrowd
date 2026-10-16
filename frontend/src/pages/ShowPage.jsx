import CommentsCard from '../components/CommentsCard';
import InsightCard from '../components/InsightCard';
import SeasonList from '../components/SeasonList';
import { getShowProgress } from '../helpers/show';
import { useLanguage } from '../i18n/LanguageContext';

export default function ShowPage({ show, selectedEpisode, comments, insight, busy, busySeason, name, comment, onBack, onSelectEpisode, onCommentEpisode, onToggleWatched, onMarkSeasonWatched, onGenerateInsight, onNameChange, onCommentChange, onSubmitComment, onClearEpisode }) {
  const { t } = useLanguage();
  const { watchedCount, episodeCount, progress } = getShowProgress(show);

  return (
    <main className="detail-page">
      <button className="back-button" onClick={onBack}>← <span>{t('backToSearch')}</span></button>
      <section className="show-hero">
        <div className="show-art">{show.image ? <img src={show.image} alt={t('posterFor', { name: show.name })} /> : <div className="art-placeholder">✦</div>}</div>
        <div className="show-copy"><div className="eyebrow"><span>✦</span> {show.status?.toUpperCase() || 'SHOW'} {show.premiered ? `· ${show.premiered.slice(0, 4)}` : ''}</div>
          <h1>{show.name}</h1><div className="genre-row">{show.genres.map((genre) => <span key={genre}>{genre}</span>)}{show.rating && <span className="rating">★ {show.rating.toFixed(1)}</span>}</div>
          <p className="show-summary">{show.summary || t('summaryUnavailable')}</p>
          <div className="progress-card"><div className="progress-label"><span>{t('yourProgress')}</span><strong>{watchedCount} <small>/ {episodeCount} {t('episodes')}</small></strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
        </div>
      </section>
      <div className="content-grid">
        <section className="episodes-section"><div className="section-heading"><div><span className="eyebrow">{t('episodeGuide')}</span><h2>{t('seasons')}</h2></div><span className="count-pill">{episodeCount} {t('episodes')}</span></div><SeasonList seasons={show.seasons} watchedEpisodeIds={show.watched_episode_ids} selectedEpisodeId={selectedEpisode?.id} busySeason={busySeason} onMarkSeasonWatched={onMarkSeasonWatched} onToggleWatched={onToggleWatched} onSelectEpisode={onSelectEpisode} onCommentEpisode={onCommentEpisode} /></section>
        <aside className="community-column"><InsightCard insight={insight} busy={busy} onGenerate={onGenerateInsight} /><CommentsCard showName={show.name} selectedEpisode={selectedEpisode} comments={comments} name={name} comment={comment} onNameChange={onNameChange} onCommentChange={onCommentChange} onSubmit={onSubmitComment} onClearEpisode={onClearEpisode} /></aside>
      </div>
    </main>
  );
}
