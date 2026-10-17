import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './services/api';

const entrypoint = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock('react-dom/client', () => ({ createRoot: () => entrypoint }));
vi.mock('./services/api', () => ({ api: vi.fn() }));

const episode = { id: 101, name: 'Pilot', season: 1, number: 1 };
const show = {
  id: 1, slug: 'example', name: 'Example', genres: ['Drama'],
  summary: 'A story.', premiered: '2020-01-01', watched_episode_ids: [],
  seasons: [{ number: 1, episodes: [episode] }],
};

async function mountApp(path = '/') {
  window.history.replaceState({}, '', path);
  await import('./main');
  await act(async () => {
    render(entrypoint.render.mock.calls[0][0]);
  });
}

async function click(element) {
  await act(async () => { fireEvent.click(element); });
}

beforeEach(() => {
  api.mockReset();
  api.mockImplementation(async (path) => {
    if (path.startsWith('/api/search')) return [show];
    if (path.includes('/comments')) return [];
    if (path.endsWith('/insights')) return { text: 'An insight.', generated_by_ai: true };
    if (path.endsWith('/watched')) return null;
    return { ...show, watched_episode_ids: [] };
  });
});

describe('application entrypoint', () => {
  it('searches, opens a result, and returns home', async () => {
    await mountApp();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search shows' }), {
      target: { value: 'Example' },
    });
    await click(await screen.findByRole('button', { name: /Example.*2020/ }));
    expect(await screen.findByRole('heading', { name: 'Example' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/example');
    fireEvent.click(screen.getByRole('button', { name: /Back to search/ }));
    expect(screen.getByRole('textbox', { name: 'Search shows' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('loads a direct link and persists watched state in both directions', async () => {
    await mountApp('/example');
    await click(await screen.findByRole('button', { name: 'Mark as watched' }));
    await click(await screen.findByRole('button', { name: 'Mark as unwatched' }));
    await screen.findByRole('button', { name: 'Mark as watched' });
    expect(api).toHaveBeenCalledWith('/api/shows/1/episodes/101/watched', {
      method: 'PUT', body: JSON.stringify({ watched: true }),
    });
    expect(api).toHaveBeenCalledWith('/api/shows/1/episodes/101/watched', {
      method: 'PUT', body: JSON.stringify({ watched: false }),
    });
  });

  it('posts an episode comment and requests an insight for that episode', async () => {
    await mountApp('/example');
    await click(await screen.findByRole('button', { name: 'Comment Pilot' }));
    await waitFor(() => expect(api).toHaveBeenCalledWith('/api/shows/1/comments?episode_id=101'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), {
      target: { value: 'Rafael' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '' }), {
      target: { value: 'Great episode' },
    });
    await click(screen.getByRole('button', { name: /Post on episode/ }));
    await waitFor(() => expect(api).toHaveBeenCalledWith('/api/shows/1/comments', {
      method: 'POST',
      body: JSON.stringify({ display_name: 'Rafael', body: 'Great episode', episode_id: 101 }),
    }));
    await click(screen.getByRole('button', { name: /Generate insight/ }));
    expect(await screen.findByText('An insight.')).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith('/api/shows/1/insights', {
      method: 'POST', body: JSON.stringify({ episode_id: 101, language: 'en' }),
    });
  });

  it('marks an entire season as watched', async () => {
    await mountApp('/example');
    await click(screen.getByRole('button', { name: /Mark season as watched/i }));
    expect(await screen.findByRole('button', { name: 'Mark as unwatched' })).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith('/api/shows/1/episodes/101/watched', {
      method: 'PUT', body: JSON.stringify({ watched: true }),
    });
  });

  it('shows route errors and reacts to browser navigation', async () => {
    api.mockRejectedValue(new Error('Series unavailable'));
    await mountApp('/missing');
    expect(await screen.findByRole('alert')).toHaveTextContent('Series unavailable');
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => {
      window.history.replaceState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('textbox', { name: 'Search shows' })).toBeInTheDocument();
  });
});
