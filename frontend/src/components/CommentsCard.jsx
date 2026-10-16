import { useLanguage } from '../i18n/LanguageContext';

export default function CommentsCard({ showName, selectedEpisode, comments, name, comment, onNameChange, onCommentChange, onSubmit, onClearEpisode }) {
  const { t } = useLanguage();
  return (
    <section className="comments-card" id="comments-card">
      <div className="section-heading compact"><div><span className="eyebrow">{t('community')}</span><h2>{t('shareThoughts')}</h2></div><span className="comment-count">{comments.length}</span></div>
      <div className={`comment-context ${selectedEpisode ? 'episode-context' : ''}`}><span className="context-icon">{selectedEpisode ? '◈' : '◎'}</span><div><span className="context-label">{selectedEpisode ? t('commentingEpisode') : t('commentingShow')}</span><strong>{selectedEpisode ? `${String(selectedEpisode.number ?? '–').padStart(2, '0')} · ${selectedEpisode.name}` : showName}</strong><small>{selectedEpisode ? t('linkedEpisode') : t('visibleShow')}</small></div>{selectedEpisode && <button className="context-clear" type="button" onClick={onClearEpisode}>{t('show')}</button>}</div>
      <form onSubmit={onSubmit} className="comment-form"><input value={name} onChange={(event) => onNameChange(event.target.value)} maxLength="40" aria-label={t('yourName')} placeholder={t('yourName')} /><textarea value={comment} onChange={(event) => onCommentChange(event.target.value)} maxLength="1000" placeholder={t('commentPlaceholder', { name: selectedEpisode?.name || showName })} required /><button className="primary-button" disabled={!comment.trim()}>{selectedEpisode ? t('postOnEpisode') : t('postOnShow')} <span>↗</span></button></form>
      <div className="comment-list">{comments.length ? comments.map((item) => <article className="comment-item" key={item.id}><span className="avatar">{item.display_name.slice(0, 1).toUpperCase()}</span><div><strong>{item.display_name}</strong><small>{new Date(item.created_at).toLocaleDateString()}</small><p>{item.body}</p></div></article>) : <div className="empty-comments">{t('noComments')}</div>}</div>
    </section>
  );
}
