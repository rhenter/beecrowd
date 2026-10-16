import { describe, expect, it, vi } from 'vitest';
import { api } from './api';

describe('api service', () => {
  it('sends JSON requests with credentials and parses the response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"id": 1}', { status: 200 })));

    await expect(api('/api/shows/1', { method: 'GET' })).resolves.toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/shows/1', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('merges custom headers and handles no-content responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(api('/watched', {
      method: 'PUT',
      headers: { Authorization: 'Bearer test' },
      body: '{}',
    })).resolves.toBeNull();
    expect(fetch.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test',
    });
  });

  it('raises the backend detail for failed responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('{"detail":"Series not found"}', { status: 404 }),
    ));

    await expect(api('/missing')).rejects.toThrow('Series not found');
  });

  it('uses a generic message when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })));

    await expect(api('/down')).rejects.toThrow('The request could not be completed.');
  });
});
