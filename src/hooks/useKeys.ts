import { useState, useEffect, useCallback } from 'react';
import { getKeys, type ApiKey } from '../api';

/**
 * useKeys — Reusable API key fetching and caching hook
 *
 * WHY: The key-fetching pattern (useState + useEffect + getKeys() + error handling)
 * was being duplicated across KeyManager.tsx and Dashboard.tsx. Centralising it
 * in a hook means consistent loading states, error handling, and refresh logic,
 * and makes it trivial to add caching or SWR-style revalidation later.
 *
 * @param projectId — optional filter to load keys for a specific project only
 */
export interface UseKeysResult {
  keys: ApiKey[];
  setKeys: React.Dispatch<React.SetStateAction<ApiKey[]>>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useKeys(projectId?: string): UseKeysResult {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    getKeys(projectId)
      .then(setKeys)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load API keys. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { keys, setKeys, loading, error, refresh };
}
