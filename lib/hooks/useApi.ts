import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export function useApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = useCallback(async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = await getToken();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }, [getToken]);

  return { fetchWithAuth };
}
