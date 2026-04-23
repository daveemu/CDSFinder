const BASE_URL = import.meta.env['VITE_API_BASE_URL'] ?? '';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error((error as { message?: string }).message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
