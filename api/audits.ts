import {
  VercelRequest, VercelResponse,
  supabase, isLiveMode, mockStore,
  enableCors, safeError, requireAuth
} from './utils.js';

// Number of records returned per page — prevents loading entire audit log at once
const PAGE_SIZE = 50;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  // Authentication gate
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const method = req.method;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }

  try {
    // WHY pagination: Without it, one million audit log rows would be loaded
    // into memory on every page visit, causing timeouts and memory exhaustion.
    // ?page=0 returns rows 0–49, ?page=1 returns 50–99, etc.
    const page = Math.max(0, parseInt(req.query.page as string) || 0);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    if (isLiveMode && supabase) {
      const { data, error, count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('org_id', auth.orgId) // tenant isolation — only see your org's logs
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const mapped = (data ?? []).map((log: Record<string, unknown>) => ({
        id: log['id'],
        action: log['action'],
        category: log['category'],
        actorName: log['actor_name'],
        actorEmail: log['actor_email'],
        target: log['target'],
        ip: log['ip_address'],
        location: log['location'],
        timestamp: new Date(log['created_at'] as string).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        severity: log['severity']
      }));

      return res.status(200).json({
        logs: mapped,
        total: count ?? 0,
        page,
        pageSize: PAGE_SIZE,
        hasMore: (count ?? 0) > to + 1
      });
    } else {
      // In mock mode, paginate the in-memory array
      const sliced = mockStore.audits.slice(from, to + 1);
      return res.status(200).json({
        logs: sliced,
        total: mockStore.audits.length,
        page,
        pageSize: PAGE_SIZE,
        hasMore: mockStore.audits.length > to + 1
      });
    }
  } catch (err: unknown) {
    console.error('[/api/audits] Error:', err instanceof Error ? err.message : err);
    return safeError(res, 500, 'An internal error occurred. Please try again.');
  }
}
