import { VercelRequest, VercelResponse, supabase, isLiveMode, mockStore, writeAuditLog, enableCors } from './utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  const method = req.method;

  try {
    if (method === 'GET') {
      if (isLiveMode && supabase) {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('joined_at', { ascending: true });

        if (error) throw error;
        return res.status(200).json(data);
      } else {
        return res.status(200).json(mockStore.team);
      }
    }

    if (method === 'POST') {
      const { name, email, role } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and Email are required' });
      }

      if (isLiveMode && supabase) {
        const { data, error } = await supabase
          .from('team_members')
          .insert([
            {
              org_id: '00000000-0000-0000-0000-000000000000', // default org placeholder
              email,
              name,
              role: role || 'Developer',
              status: 'Invited'
            }
          ])
          .select()
          .single();

        if (error) throw error;

        await writeAuditLog({
          action: 'Member Invited',
          category: 'Team Access',
          target: email,
          actorName: 'DevMaster_01',
          actorEmail: 'devmaster@company.com',
          ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
          location: 'US-East (N. Virginia)'
        });

        return res.status(201).json(data);
      } else {
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
        const newMember = {
          id: Date.now(),
          name,
          email,
          role: role || 'Developer',
          avatar: initials,
          joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          status: 'Invited' as const,
          keys: 0
        };
        mockStore.team.push(newMember);

        await writeAuditLog({
          action: 'Member Invited',
          category: 'Team Access',
          target: email,
          actorName: 'DevMaster_01',
          actorEmail: 'devmaster@company.com',
          ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
          location: 'Local Loopback'
        });

        return res.status(201).json(newMember);
      }
    }

    if (method === 'PATCH') {
      const { id } = req.query;
      const { name, role } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Member ID is required' });
      }

      if (isLiveMode && supabase) {
        const { data, error } = await supabase
          .from('team_members')
          .update({ name, role })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await writeAuditLog({
          action: 'Member Role Updated',
          category: 'Team Access',
          target: data.email,
          actorName: 'DevMaster_01',
          actorEmail: 'devmaster@company.com',
          ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
          location: 'US-East (N. Virginia)'
        });

        return res.status(200).json(data);
      } else {
        const idx = mockStore.team.findIndex(m => m.id.toString() === id.toString());
        if (idx === -1) {
          return res.status(404).json({ error: 'Member not found' });
        }

        mockStore.team[idx].name = name || mockStore.team[idx].name;
        mockStore.team[idx].role = role || mockStore.team[idx].role;

        await writeAuditLog({
          action: 'Member Role Updated',
          category: 'Team Access',
          target: mockStore.team[idx].email,
          actorName: 'DevMaster_01',
          actorEmail: 'devmaster@company.com',
          ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
          location: 'Local Loopback'
        });

        return res.status(200).json(mockStore.team[idx]);
      }
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Member ID is required' });
      }

      if (isLiveMode && supabase) {
        const { data: member } = await supabase
          .from('team_members')
          .select('email')
          .eq('id', id)
          .single();

        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', id);

        if (error) throw error;

        if (member) {
          await writeAuditLog({
            action: 'Member Revoked',
            category: 'Team Access',
            target: member.email,
            actorName: 'DevMaster_01',
            actorEmail: 'devmaster@company.com',
            ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
            location: 'US-East (N. Virginia)',
            severity: 'Revocation'
          });
        }

        return res.status(200).json({ success: true });
      } else {
        const member = mockStore.team.find(m => m.id.toString() === id.toString());
        mockStore.team = mockStore.team.filter(m => m.id.toString() !== id.toString());

        if (member) {
          await writeAuditLog({
            action: 'Member Revoked',
            category: 'Team Access',
            target: member.email,
            actorName: 'DevMaster_01',
            actorEmail: 'devmaster@company.com',
            ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
            location: 'Local Loopback',
            severity: 'Revocation'
          });
        }

        return res.status(200).json({ success: true });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
