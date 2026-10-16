const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function api(path, options = {}) {
  const { headers, ...requestOptions } = options;
  const response = await fetch(`${apiUrl}${path}`, {
    credentials: 'include',
    ...requestOptions,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'The request could not be completed.');
  }

  return response.status === 204 ? null : response.json();
}
