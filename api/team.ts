import {
  VercelRequest, VercelResponse,
  supabase, isLiveMode, mockStore,
  writeAuditLog, enableCors, safeError,
  requireAuth, sanitizeText, isValidEmail
} from './utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  // Authentication gate
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const method = req.method;
  const ip = req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress || '127.0.0.1';

  try {
    // ── GET — List team members (scoped to org) ───────────────────────────
    if (method === 'GET') {
      if (isLiveMode && supabase) {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('org_id', auth.orgId) // tenant isolation
          .order('joined_at', { ascending: true });

        if (error) throw error;
        return res.status(200).json(data);
      } else {
        return res.status(200).json(mockStore.team);
      }
    }

    // ── POST — Invite a team member ───────────────────────────────────────
    if (method === 'POST') {
      const { name, email, role } = req.body as {
        name?: unknown; email?: unknown; role?: unknown
      };

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required.' });
      }

      // Validate email format — prevents garbage data in audit logs and invite flows
      if (!isValidEmail(String(email))) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const safeName = sanitizeText(String(name));
      const safeEmail = String(email).toLowerCase().trim();
      const allowedRoles = ['Owner', 'Admin', 'Developer', 'Read Only'];
      const safeRole = allowedRoles.includes(String(role)) ? String(role) : 'Developer';

      if (isLiveMode && supabase) {
        // Prevent duplicate invites to the same org
        const { data: existing } = await supabase
          .from('team_members')
          .select('id')
          .eq('org_id', auth.orgId)
          .eq('email', safeEmail)
          .maybeSingle();

        if (existing) {
          return res.status(409).json({ error: 'This email address is already a member of your team.' });
        }

        const { data, error } = await supabase
          .from('team_members')
          .insert([{
            org_id: auth.orgId,
            email: safeEmail,
            name: safeName,
            role: safeRole,
            status: 'Invited'
          }])
          .select()
          .single();

        if (error) throw error;

        await writeAuditLog({
          orgId: auth.orgId,
          action: 'Member Invited',
          category: 'Team Access',
          target: safeEmail,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'API Gateway'
        });

        return res.status(201).json(data);
      } else {
        const initials = safeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
        const newMember = {
          id: Date.now(),
          name: safeName,
          email: safeEmail,
          role: safeRole,
          avatar: initials,
          joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          status: 'Invited' as const,
          keys: 0
        };
        mockStore.team.push(newMember);

        await writeAuditLog({
          action: 'Member Invited',
          category: 'Team Access',
          target: safeEmail,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'Local Dev'
        });

        return res.status(201).json(newMember);
      }
    }

    // ── PATCH — Update member name or role ────────────────────────────────
    if (method === 'PATCH') {
      const { id } = req.query;
      const { name, role } = req.body as { name?: unknown; role?: unknown };

      if (!id) return res.status(400).json({ error: 'Member ID is required.' });

      const allowedRoles = ['Owner', 'Admin', 'Developer', 'Read Only'];
      const safeRole = role && allowedRoles.includes(String(role)) ? String(role) : undefined;
      const safeName = name ? sanitizeText(String(name)) : undefined;

      if (isLiveMode && supabase) {
        // Ownership check — only modify members in your org
        const { data: existing } = await supabase
          .from('team_members')
          .select('id, email')
          .eq('id', id)
          .eq('org_id', auth.orgId)
          .maybeSingle();

        if (!existing) {
          return res.status(403).json({ error: 'Member not found or access denied.' });
        }

        const updates: Record<string, string> = {};
        if (safeName) updates['name'] = safeName;
        if (safeRole) updates['role'] = safeRole;

        const { data, error } = await supabase
          .from('team_members')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await writeAuditLog({
          orgId: auth.orgId,
          action: 'Member Role Updated',
          category: 'Team Access',
          target: (existing as Record<string, unknown>)['email'] as string,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'API Gateway'
        });

        return res.status(200).json(data);
      } else {
        const idx = mockStore.team.findIndex(m => m.id.toString() === id.toString());
        if (idx === -1) return res.status(404).json({ error: 'Member not found.' });

        if (safeName) mockStore.team[idx].name = safeName;
        if (safeRole) mockStore.team[idx].role = safeRole;

        await writeAuditLog({
          action: 'Member Role Updated',
          category: 'Team Access',
          target: mockStore.team[idx].email,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'Local Dev'
        });

        return res.status(200).json(mockStore.team[idx]);
      }
    }

    // ── DELETE — Remove team member ───────────────────────────────────────
    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Member ID is required.' });

      if (isLiveMode && supabase) {
        const { data: member } = await supabase
          .from('team_members')
          .select('email')
          .eq('id', id)
          .eq('org_id', auth.orgId) // can't remove members from other orgs
          .maybeSingle();

        if (!member) {
          return res.status(403).json({ error: 'Member not found or access denied.' });
        }

        const { error } = await supabase.from('team_members').delete().eq('id', id);
        if (error) throw error;

        await writeAuditLog({
          orgId: auth.orgId,
          action: 'Member Revoked',
          category: 'Team Access',
          target: (member as Record<string, unknown>)['email'] as string,
          actorName: auth.name,
          actorEmail: auth.email,
          ipAddress: ip,
          location: 'API Gateway',
          severity: 'Revocation'
        });

        return res.status(200).json({ success: true });
      } else {
        const member = mockStore.team.find(m => m.id.toString() === id.toString());
        mockStore.team = mockStore.team.filter(m => m.id.toString() !== id.toString());

        if (member) {
          await writeAuditLog({
            action: 'Member Revoked',
            category: 'Team Access',
            target: member.email,
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
    console.error('[/api/team] Error:', err instanceof Error ? err.message : err);
    return safeError(res, 500, 'An internal error occurred. Please try again.');
  }
}
