import { describe, expect, it } from 'vitest';
import { getEpisodeCount, getShowProgress } from './show';

describe('show helpers', () => {
  it('counts episodes and calculates rounded progress', () => {
    const show = {
      seasons: [{ episodes: [{ id: 1 }, { id: 2 }] }, { episodes: [{ id: 3 }] }],
      watched_episode_ids: [1, 3],
    };

    expect(getEpisodeCount(show)).toBe(3);
    expect(getShowProgress(show)).toEqual({ watchedCount: 2, episodeCount: 3, progress: 67 });
  });

  it('handles missing and empty show data', () => {
    expect(getEpisodeCount()).toBe(0);
    expect(getShowProgress({ seasons: [], watched_episode_ids: [] })).toEqual({
      watchedCount: 0,
      episodeCount: 0,
      progress: 0,
    });
  });
});
