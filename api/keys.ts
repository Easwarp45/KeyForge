import {
  VercelRequest, VercelResponse,
  supabase, isLiveMode, mockStore,
  generateApiKey, writeAuditLog, enableCors, safeError,
  requireAuth, checkRateLimit, sanitizeText
} from './utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  // ── Authentication Gate ──────────────────────────────────────────────────
  // WHY: Previously every endpoint was completely open. Now we verify the
  // Supabase JWT, resolve the user's org, and use it to scope all DB queries.
  const auth = await requireAuth(req, res);
  if (!auth) return; // requireAuth already sent 401

  const method = req.method;
  const ip = req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress || '127.0.0.1';

  try {
    // ── GET — List keys (scoped to org) ────────────────────────────────────
    if (method === 'GET') {
      const { projectId } = req.query;

      if (isLiveMode && supabase) {
        // Step 1: Resolve project IDs belonging to this org
        // WHY: The service role key bypasses RLS, so we must filter manually.
        const { data: orgProjects, error: projErr } = await supabase
          .from('projects')
          .select('id')
          .eq('org_id', auth.orgId);

        if (projErr) throw projErr;
        const projectIds = (orgProjects ?? []).map((p: { id: string }) => p.id);

        if (projectIds.length === 0) {
          return res.status(200).json([]);
        }

        // Step 2: Fetch keys, optionally filtered by one project
        let query = supabase
          .from('api_keys')
          .select('id, project_id, name, key_prefix, scope, expiry, status, created_at')
          .in('project_id', projectIds);

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const mapped = (data ?? []).map((k: Record<string, unknown>) => ({
          id: k['id'],
          name: k['name'],
          key: `${k['key_prefix']}••••••••••••`,
          project_id: k['project_id'],
          scope: k['scope'],
          expiry: k['expiry'] ? new Date(k['expiry'] as string).toLocaleDateString('en-US') : 'Never',
          status: k['status'],
          created: new Date(k['created_at'] as string).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        }));

        return res.status(200).json(mapped);
      } else {
        let data = mockStore.keys;
        if (projectId) {
          data = data.filter(k => k.project_id === projectId);
        }
        return res.status(200).json(data);
      }
    }

    // ── POST — Create a new API key ─────────────────────────────────────────
    if (method === 'POST') {
      // Rate limit: max 20 key-creations per minute per user
      // WHY: Prevents quota-bypass attacks where an attacker spams key creation.
      if (checkRateLimit(`keys_create:${auth.userId}`, 20, 60_000)) {
        return res.status(429).json({ error: 'Too many keys created. Please wait a moment and try again.' });
      }

      const { name, projectId, scope, expiry } = req.body as {
        name?: unknown; projectId?: unknown; scope?: unknown; expiry?: unknown
      };

      if (!name || !projectId) {
        return res.status(400).json({ error: 'Key name and Project ID are required.' });
      }

      // Sanitize user-supplied text before storing
      const safeName = sanitizeText(String(name));
      const safeScope = ['Read', 'Write', 'Read/Write', 'Admin'].includes(String(scope))
        ? String(scope)
        : 'Read/Write';

      const { raw, prefix, hash } = generateApiKey();
      const expirationDate = expiry && expiry !== 'Never' && expiry !== 'Never (Not Recommended)'
        ? new Date(Date.now() + parseInt(String(expiry)) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      if (isLiveMode && supabase) {
        // Verify the projectId belongs to the user's org (prevents cross-org key injection)
        const { data: proj } = await supabase
          .from('projects')
          .select('id, org_id')
          .eq('id', projectId)
          .eq('org_id', auth.orgId)
          .maybeSingle();

        if (!proj) {
          return res.status(403).json({ error: 'Project not found or access denied.' });
        }

        const { data, error } = await supabase
          .from('api_keys')
          .insert([{
            project_id: projectId,
            name: safeName,
            hashed_key: hash,
            key_prefix: prefix,
            scope: safeScope,
            expiry: expirationDate,
            status: 'Active'
          }])
          .select()
          .single();

        if (error) throw error;

        await writeAuditLog({
          orgId: auth.orgId,
          action: 'Key Generated',
          category: 'Key Operations',
          target: safeName,
          // WHY for actor fields: Previously hardcoded 'DevMaster_01'. Now uses real identity.
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'API Gateway'
        });

        return res.status(201).json({
          id: (data as Record<string, unknown>)['id'],
          name: (data as Record<string, unknown>)['name'],
          key: raw, // plaintext shown ONCE at creation, never stored
          project_id: (data as Record<string, unknown>)['project_id'],
          scope: (data as Record<string, unknown>)['scope'],
          expiry: (data as Record<string, unknown>)['expiry']
            ? new Date((data as Record<string, unknown>)['expiry'] as string).toLocaleDateString('en-US')
            : 'Never',
          status: (data as Record<string, unknown>)['status'],
          created: new Date((data as Record<string, unknown>)['created_at'] as string)
            .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        });
      } else {
        const newKey = {
          id: Date.now(),
          name: safeName,
          key: raw,
          project_id: String(projectId),
          scope: safeScope,
          expiry: expiry ? String(expiry) : 'Never',
          status: 'Active' as const,
          created: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        };
        mockStore.keys.unshift(newKey);

        await writeAuditLog({
          action: 'Key Generated',
          category: 'Key Operations',
          target: safeName,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'Local Dev'
        });

        return res.status(201).json(newKey);
      }
    }

    // ── PATCH — Rotate or toggle status ────────────────────────────────────
    if (method === 'PATCH') {
      const { id } = req.query;
      const { action, status } = req.body as { action?: string; status?: string };

      if (!id) {
        return res.status(400).json({ error: 'Key ID is required.' });
      }

      if (isLiveMode && supabase) {
        // Verify the key belongs to the user's org before mutating
        const { data: existingKey } = await supabase
          .from('api_keys')
          .select('id, name, projects!inner(org_id)')
          .eq('id', id)
          .maybeSingle();

        const keyWithProject = existingKey as { id: string; name: string; projects: { org_id: string } } | null;

        if (!keyWithProject || keyWithProject.projects.org_id !== auth.orgId) {
          return res.status(403).json({ error: 'Key not found or access denied.' });
        }

        if (action === 'rotate') {
          const { raw, prefix, hash } = generateApiKey();

          const { data, error } = await supabase
            .from('api_keys')
            .update({ hashed_key: hash, key_prefix: prefix, created_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          await writeAuditLog({
            orgId: auth.orgId,
            action: 'Key Rotated',
            category: 'Key Operations',
            target: keyWithProject.name,
            actorName: auth.name,
            actorEmail: auth.email,
            ipAddress: ip,
            location: 'API Gateway'
          });

          const d = data as Record<string, unknown>;
          return res.status(200).json({
            id: d['id'], name: d['name'],
            key: raw, // new secret — shown once
            project_id: d['project_id'], scope: d['scope'],
            expiry: d['expiry'] ? new Date(d['expiry'] as string).toLocaleDateString('en-US') : 'Never',
            status: d['status'],
            created: new Date(d['created_at'] as string).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          });
        }

        if (status) {
          if (!['Active', 'Disabled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value.' });
          }

          const { data, error } = await supabase
            .from('api_keys')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          await writeAuditLog({
            orgId: auth.orgId,
            action: status === 'Active' ? 'Key Enabled' : 'Key Disabled',
            category: 'Key Operations',
            target: keyWithProject.name,
            actorName: auth.name,
            actorEmail: auth.email,
            ipAddress: ip,
            location: 'API Gateway',
            severity: status === 'Active' ? 'Success' : 'Warning'
          });

          return res.status(200).json(data);
        }
      } else {
        const keyIdx = mockStore.keys.findIndex(k => k.id.toString() === id.toString());
        if (keyIdx === -1) return res.status(404).json({ error: 'Key not found.' });

        if (action === 'rotate') {
          const { raw, prefix } = generateApiKey();
          mockStore.keys[keyIdx].key = raw;
          mockStore.keys[keyIdx].key = `${prefix}${raw.slice(prefix.length)}`;

          // For mock mode, return the new raw key directly
          const { raw: freshRaw } = generateApiKey();
          mockStore.keys[keyIdx].key = freshRaw;

          await writeAuditLog({
            action: 'Key Rotated',
            category: 'Key Operations',
            target: mockStore.keys[keyIdx].name,
            actorName: auth.name,
            actorEmail: auth.email,
            ipAddress: ip,
            location: 'Local Dev'
          });

          return res.status(200).json(mockStore.keys[keyIdx]);
        }

        if (status && ['Active', 'Disabled'].includes(status)) {
          mockStore.keys[keyIdx].status = status as 'Active' | 'Disabled';

          await writeAuditLog({
            action: status === 'Active' ? 'Key Enabled' : 'Key Disabled',
            category: 'Key Operations',
            target: mockStore.keys[keyIdx].name,
            actorName: auth.name,
            actorEmail: auth.email,
            ipAddress: ip,
            location: 'Local Dev',
            severity: status === 'Active' ? 'Success' : 'Warning'
          });

          return res.status(200).json(mockStore.keys[keyIdx]);
        }
      }
    }

    // ── DELETE — Revoke key ─────────────────────────────────────────────────
    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Key ID is required.' });

      if (isLiveMode && supabase) {
        // Verify ownership before deletion — prevents cross-org deletes
        const { data: existingKey } = await supabase
          .from('api_keys')
          .select('id, name, projects!inner(org_id)')
          .eq('id', id)
          .maybeSingle();

        const keyWithProject = existingKey as { id: string; name: string; projects: { org_id: string } } | null;

        if (!keyWithProject || keyWithProject.projects.org_id !== auth.orgId) {
          return res.status(403).json({ error: 'Key not found or access denied.' });
        }

        const { error } = await supabase.from('api_keys').delete().eq('id', id);
        if (error) throw error;

        await writeAuditLog({
          orgId: auth.orgId,
          action: 'Key Revoked',
          category: 'Key Operations',
          target: keyWithProject.name,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'API Gateway',
          severity: 'Revocation'
        });

        return res.status(200).json({ success: true });
      } else {
        const key = mockStore.keys.find(k => k.id.toString() === id.toString());
        mockStore.keys = mockStore.keys.filter(k => k.id.toString() !== id.toString());

        if (key) {
          await writeAuditLog({
            action: 'Key Revoked',
            category: 'Key Operations',
            target: key.name,
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

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (err: unknown) {
    console.error('[/api/keys] Error:', err instanceof Error ? err.message : err);
    return safeError(res, 500, 'An internal error occurred. Please try again.');
  }
}
