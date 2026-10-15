import type { ApiResponse } from '@/types/hr';

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

type RequestOptions = RequestInit & { token?: string };

export async function apiClient<T>(path: string, options: RequestOptions = {}) {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const payload = (await response.json()) as any;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? 'Unable to complete the request');
  }
  return (payload.data !== undefined ? payload.data : payload) as T;
}
