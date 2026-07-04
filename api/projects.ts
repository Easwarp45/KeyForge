import { VercelRequest, VercelResponse, supabase, isLiveMode, mockStore, writeAuditLog, enableCors, safeError } from './utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  const method = req.method;

  try {
    if (method === 'GET') {
      if (isLiveMode && supabase) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
      } else {
        return res.status(200).json(mockStore.projects);
      }
    } 
    
    if (method === 'POST') {
      const { name, environment, description, orgId } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      const projEnv = environment || 'Dev';
      const projDesc = description || 'No description provided.';
      const selectedOrgId = orgId || '00000000-0000-0000-0000-000000000000'; // Default org placeholder

      if (isLiveMode && supabase) {
        const { data, error } = await supabase
          .from('projects')
          .insert([
            {
              org_id: selectedOrgId,
              name,
              environment: projEnv,
              description: projDesc
            }
          ])
          .select()
          .single();

        if (error) throw error;

        await writeAuditLog({
          orgId: selectedOrgId,
          action: 'Project Created',
          category: 'Project Operations',
          target: name,
          actorName: 'DevMaster_01',
          actorEmail: 'devmaster@company.com',
          ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
          location: 'US-East (N. Virginia)'
        });

        return res.status(201).json(data);
      } else {
        const newProj = {
          id: Date.now().toString(),
          name,
          environment: projEnv,
          description: projDesc,
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
          target: name,
          actorName: 'DevMaster_01',
          actorEmail: 'devmaster@company.com',
          ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
          location: 'Local Loopback'
        });

        return res.status(201).json(newProj);
      }
    } 
    
    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      if (isLiveMode && supabase) {
        // Fetch project first to log the name
        const { data: project } = await supabase
          .from('projects')
          .select('name, org_id')
          .eq('id', id)
          .single();

        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id);

        if (error) throw error;

        if (project) {
          await writeAuditLog({
            orgId: project.org_id,
            action: 'Project Deleted',
            category: 'Project Operations',
            target: project.name,
            actorName: 'DevMaster_01',
            actorEmail: 'devmaster@company.com',
            ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
            location: 'US-East (N. Virginia)',
            severity: 'Revocation'
          });
        }

        return res.status(200).json({ success: true });
      } else {
        const project = mockStore.projects.find(p => p.id === id);
        mockStore.projects = mockStore.projects.filter(p => p.id !== id);

        if (project) {
          await writeAuditLog({
            action: 'Project Deleted',
            category: 'Project Operations',
            target: project.name,
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

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (err: any) {
    return safeError(res, 500, 'An internal error occurred. Please try again.');
  }
}
