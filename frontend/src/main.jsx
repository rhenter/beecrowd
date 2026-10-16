import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ShowPage from './pages/ShowPage';
import { api } from './services/api';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import './style.css';

function getPathSlug() {
  return window.location.pathname.split('/').filter(Boolean)[0] || null;
}

function App() {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [comments, setComments] = useState([]);
  const [insight, setInsight] = useState(null);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('Visitor');
  const [busy, setBusy] = useState(false);
  const [seasonBusy, setSeasonBusy] = useState(null);
  const [error, setError] = useState('');
  const [routeLoading, setRouteLoading] = useState(() => Boolean(getPathSlug()));

  async function loadShow(path) {
    setBusy(true); setRouteLoading(true); setError(''); setInsight(null); setComments([]); setSelectedEpisode(null); setResults([]);
    try {
      const details = await api(path);
      setShow(details);
      setQuery('');
      await loadComments(details.id, null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); setRouteLoading(false); }
  }

  useEffect(() => {
    const handleRouteChange = () => {
      const slug = getPathSlug();
      if (slug) loadShow(`/api/shows/by-slug/${encodeURIComponent(slug)}`);
      else {
        setRouteLoading(false);
        setShow(null); setSelectedEpisode(null); setInsight(null); setQuery(''); setResults([]); setError('');
      }
    };

    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return undefined; }
    setResults([]);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setResults(await api(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal }));
        setError('');
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  async function loadComments(showId, episodeId) {
    const queryString = episodeId == null ? '' : `?episode_id=${episodeId}`;
    setComments(await api(`/api/shows/${showId}/comments${queryString}`));
  }

  async function openShow(item) {
    window.history.pushState({}, '', `/${item.slug}`);
    await loadShow(`/api/shows/${item.id}`);
  }

  async function toggleWatched(episode) {
    if (!show) return;
    const watched = show.watched_episode_ids.includes(episode.id);
    try {
      await api(`/api/shows/${show.id}/episodes/${episode.id}/watched`, { method: 'PUT', body: JSON.stringify({ watched: !watched }) });
      setShow({ ...show, watched_episode_ids: watched ? show.watched_episode_ids.filter((id) => id !== episode.id) : [...show.watched_episode_ids, episode.id] });
    } catch (err) { setError(err.message); }
  }

  async function markSeasonWatched(season) {
    const unwatchedEpisodes = season.episodes.filter((episode) => !show.watched_episode_ids.includes(episode.id));
    if (!unwatchedEpisodes.length) return;
    setSeasonBusy(season.number); setError('');
    try {
      await Promise.all(unwatchedEpisodes.map((episode) => api(`/api/shows/${show.id}/episodes/${episode.id}/watched`, { method: 'PUT', body: JSON.stringify({ watched: true }) })));
      setShow((current) => ({ ...current, watched_episode_ids: [...new Set([...current.watched_episode_ids, ...season.episodes.map((episode) => episode.id)])] }));
    } catch (err) { setError(err.message); }
    finally { setSeasonBusy(null); }
  }

  async function chooseEpisode(episode) {
    const next = selectedEpisode?.id === episode.id ? null : episode;
    setSelectedEpisode(next); setInsight(null);
    if (!show) return;
    try { await loadComments(show.id, next?.id ?? null); }
    catch (err) { setError(err.message); }
  }

  async function postComment(event) {
    event.preventDefault();
    if (!show || !comment.trim()) return;
    try {
      await api(`/api/shows/${show.id}/comments`, { method: 'POST', body: JSON.stringify({ display_name: name, body: comment, episode_id: selectedEpisode?.id ?? null }) });
      setComment(''); await loadComments(show.id, selectedEpisode?.id ?? null);
    } catch (err) { setError(err.message); }
  }

  async function commentOnEpisode(episode) {
    if (selectedEpisode?.id !== episode.id) await chooseEpisode(episode);
    requestAnimationFrame(() => document.getElementById('comments-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  async function getInsight() {
    if (!show) return;
    setBusy(true); setError('');
    try { setInsight(await api(`/api/shows/${show.id}/insights`, { method: 'POST', body: JSON.stringify({ episode_id: selectedEpisode?.id ?? null, language }) })); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function resetToHome() {
    window.history.pushState({}, '', '/');
    setShow(null); setSelectedEpisode(null); setInsight(null); setQuery(''); setResults([]);
  }

  return <div className="app-shell"><Header onHome={resetToHome} />
    {routeLoading ? <main className="detail-page route-loading" aria-busy="true"><span className="spinner" /></main> : !show ? <HomePage query={query} results={results} onQueryChange={setQuery} onSelectShow={openShow} /> : <ShowPage show={show} selectedEpisode={selectedEpisode} comments={comments} insight={insight} busy={busy} busySeason={seasonBusy} name={name} comment={comment} onBack={resetToHome} onSelectEpisode={chooseEpisode} onCommentEpisode={commentOnEpisode} onToggleWatched={toggleWatched} onMarkSeasonWatched={markSeasonWatched} onGenerateInsight={getInsight} onNameChange={setName} onCommentChange={setComment} onSubmitComment={postComment} onClearEpisode={() => chooseEpisode(selectedEpisode)} />}
    {error && <div className="toast" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><LanguageProvider><App /></LanguageProvider></React.StrictMode>);
