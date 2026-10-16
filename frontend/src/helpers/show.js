export function getEpisodeCount(show) {
  return show?.seasons.reduce((count, season) => count + season.episodes.length, 0) ?? 0;
}

export function getShowProgress(show) {
  const episodeCount = getEpisodeCount(show);
  const watchedCount = show?.watched_episode_ids.length ?? 0;

  return {
    watchedCount,
    episodeCount,
    progress: episodeCount ? Math.round((watchedCount / episodeCount) * 100) : 0,
  };
}
