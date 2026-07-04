import { VercelRequest, VercelResponse, supabase, isLiveMode, mockStore, enableCors } from './utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  const method = req.method;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }

  try {
    if (isLiveMode && supabase) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB schema names to match frontend expectations
      const mapped = data.map(log => ({
        id: log.id,
        action: log.action,
        category: log.category,
        actorName: log.actor_name,
        actorEmail: log.actor_email,
        target: log.target,
        ip: log.ip_address,
        location: log.location,
        timestamp: new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        severity: log.severity
      }));

      return res.status(200).json(mapped);
    } else {
      return res.status(200).json(mockStore.audits);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
