import { useState, useEffect, useCallback } from 'react';
import { getAudits, type AuditLog } from '../api';

/**
 * useAudits — Reusable paginated audit log fetching hook
 *
 * WHY: Dashboard.tsx and AuditLogs.tsx both fetch audit data but previously
 * had separate (and inconsistent) implementations. This hook provides a shared
 * fetch-plus-state pattern that supports the paginated API response.
 */
export interface UseAuditsResult {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  page: number;
  total: number;
  hasMore: boolean;
  goToPage: (p: number) => void;
  refresh: () => void;
}

export function useAudits(initialPage = 0): UseAuditsResult {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback((pageNum: number) => {
    setLoading(true);
    setError(null);
    getAudits(pageNum)
      .then(res => {
        setLogs(res.logs);
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(pageNum);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load audit logs. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPage(initialPage); }, [fetchPage, initialPage]);

  const goToPage = (p: number) => fetchPage(p);
  const refresh = () => fetchPage(page);

  return { logs, loading, error, page, total, hasMore, goToPage, refresh };
}
