import {
  VercelRequest, VercelResponse,
  supabase, isLiveMode, mockStore,
  writeAuditLog, enableCors, safeError,
  requireAuth, sanitizeText
} from './utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  // Authentication gate — resolves org context for tenant isolation
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const method = req.method;
  const ip = req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress || '127.0.0.1';

  try {
    // ── GET — List projects (scoped to org) ───────────────────────────────
    if (method === 'GET') {
      if (isLiveMode && supabase) {
        // WHY: Without org_id scoping, every user would see every project in
        // the entire database. The service role key bypasses RLS, so we filter manually.
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('org_id', auth.orgId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
      } else {
        return res.status(200).json(mockStore.projects);
      }
    }

    // ── POST — Create project ─────────────────────────────────────────────
    if (method === 'POST') {
      const { name, environment, description } = req.body as {
        name?: unknown; environment?: unknown; description?: unknown
      };

      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Project name is required.' });
      }

      // Sanitize all user-supplied text to prevent stored XSS
      const safeName = sanitizeText(String(name));
      const safeDesc = description ? sanitizeText(String(description), 500) : 'No description provided.';
      const safeEnv = ['Dev', 'Staging', 'Prod'].includes(String(environment))
        ? String(environment)
        : 'Dev';

      if (isLiveMode && supabase) {
        const { data, error } = await supabase
          .from('projects')
          .insert([{
            org_id: auth.orgId, // tie project to authenticated user's org
            name: safeName,
            environment: safeEnv,
            description: safeDesc
          }])
          .select()
          .single();

        if (error) throw error;

        await writeAuditLog({
          orgId: auth.orgId,
          action: 'Project Created',
          category: 'Project Operations',
          target: safeName,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'API Gateway'
        });

        return res.status(201).json(data);
      } else {
        const newProj = {
          id: Date.now().toString(),
          name: safeName,
          environment: safeEnv,
          description: safeDesc,
          keys: 0,
          calls: '0',
          status: 'Healthy',
          updated: 'Just now',
          icon: 'folder',
          color: '#4edea3'
        };
        mockStore.projects.unshift(newProj);

        await writeAuditLog({
          action: 'Project Created',
          category: 'Project Operations',
          target: safeName,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'Local Dev'
        });

        return res.status(201).json(newProj);
      }
    }

    // ── DELETE — Remove project ───────────────────────────────────────────
    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Project ID is required.' });

      if (isLiveMode && supabase) {
        // Ownership check: only delete if project belongs to this org
        const { data: project } = await supabase
          .from('projects')
          .select('name, org_id')
          .eq('id', id)
          .eq('org_id', auth.orgId) // enforces tenant isolation
          .maybeSingle();

        if (!project) {
          return res.status(403).json({ error: 'Project not found or access denied.' });
        }

        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;

        await writeAuditLog({
          orgId: auth.orgId,
          action: 'Project Deleted',
          category: 'Project Operations',
          target: (project as Record<string, unknown>)['name'] as string,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'API Gateway',
          severity: 'Revocation'
        });

        return res.status(200).json({ success: true });
      } else {
        const project = mockStore.projects.find(p => p.id === id);
        mockStore.projects = mockStore.projects.filter(p => p.id !== id);

        if (project) {
          await writeAuditLog({
            action: 'Project Deleted',
            category: 'Project Operations',
            target: project.name,
            actorName: auth.name,
            actorEmail: auth.email,
            ipAddress: ip,
            location: 'Local Dev',
            severity: 'Revocation'
          });
        }

        return res.status(200).json({ success: true });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (err: unknown) {
    console.error('[/api/projects] Error:', err instanceof Error ? err.message : err);
    return safeError(res, 500, 'An internal error occurred. Please try again.');
  }
}
