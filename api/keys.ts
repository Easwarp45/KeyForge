import { VercelRequest, VercelResponse, supabase, isLiveMode, mockStore, generateApiKey, writeAuditLog, enableCors } from './utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  const method = req.method;

  try {
    if (method === 'GET') {
      const { projectId } = req.query;

      if (isLiveMode && supabase) {
        let query = supabase
          .from('api_keys')
          .select('id, project_id, name, key_prefix, scope, expiry, status, created_at');

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Map column name format to match frontend schema
        const mapped = data.map(k => ({
          id: k.id,
          name: k.name,
          key: `${k.key_prefix}••••••••••••`, // masked representation
          project_id: k.project_id,
          scope: k.scope,
          expiry: k.expiry ? new Date(k.expiry).toLocaleDateString('en-US') : 'Never',
          status: k.status,
          created: new Date(k.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
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

    if (method === 'POST') {
      const { name, projectId, scope, expiry } = req.body;
      if (!name || !projectId) {
        return res.status(400).json({ error: 'Key name and Project ID are required' });
      }

      const { raw, prefix, hash } = generateApiKey();
      const expirationDate = expiry && expiry !== 'Never' && expiry !== 'Never (Not Recommended)'
        ? new Date(Date.now() + parseInt(expiry) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      if (isLiveMode && supabase) {
        const { data, error } = await supabase
          .from('api_keys')
          .insert([
            {
              project_id: projectId,
              name,
              hashed_key: hash,
              key_prefix: prefix,
              scope: scope || 'Read/Write',
              expiry: expirationDate,
              status: 'Active'
            }
          ])
          .select()
          .single();

        if (error) throw error;

        // Log audit
        await writeAuditLog({
          action: 'Key Generated',
          category: 'Key Operations',
          target: name,
          actorName: 'DevMaster_01',
          actorEmail: 'devmaster@company.com',
          ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
          location: 'US-East (N. Virginia)'
        });

        return res.status(201).json({
          id: data.id,
          name: data.name,
          key: raw, // RETURN plaintext key exactly ONCE
          project_id: data.project_id,
          scope: data.scope,
          expiry: data.expiry ? new Date(data.expiry).toLocaleDateString('en-US') : 'Never',
          status: data.status,
          created: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        });
      } else {
        const newKey = {
          id: Date.now(),
          name,
          key: raw, // Return raw key on creation
          project_id: projectId,
          scope: scope || 'Read/Write',
          expiry: expiry || 'Never',
          status: 'Active' as const,
          created: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        };
        mockStore.keys.unshift(newKey);

        await writeAuditLog({
          action: 'Key Generated',
          category: 'Key Operations',
          target: name,
          actorName: 'DevMaster_01',
          actorEmail: 'devmaster@company.com',
          ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
          location: 'Local Loopback'
        });

        return res.status(201).json(newKey);
      }
    }

    if (method === 'PATCH') {
      const { id } = req.query;
      const { action, status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Key ID is required' });
      }

      if (isLiveMode && supabase) {
        if (action === 'rotate') {
          const { raw, prefix, hash } = generateApiKey();
          
          const { data: oldKey } = await supabase
            .from('api_keys')
            .select('name')
            .eq('id', id)
            .single();

          const { data, error } = await supabase
            .from('api_keys')
            .update({
              hashed_key: hash,
              key_prefix: prefix,
              created_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          if (oldKey) {
            await writeAuditLog({
              action: 'Key Rotated',
              category: 'Key Operations',
              target: oldKey.name,
              actorName: 'DevMaster_01',
              actorEmail: 'devmaster@company.com',
              ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
              location: 'US-East (N. Virginia)'
            });
          }

          return res.status(200).json({
            id: data.id,
            name: data.name,
            key: raw, // Return new rotated plaintext key exactly ONCE
            project_id: data.project_id,
            scope: data.scope,
            expiry: data.expiry ? new Date(data.expiry).toLocaleDateString('en-US') : 'Never',
            status: data.status,
            created: new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          });
        } 
        
        if (status) {
          const { data: oldKey } = await supabase
            .from('api_keys')
            .select('name')
            .eq('id', id)
            .single();

          const { data, error } = await supabase
            .from('api_keys')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          if (oldKey) {
            await writeAuditLog({
              action: status === 'Active' ? 'Key Enabled' : 'Key Disabled',
              category: 'Key Operations',
              target: oldKey.name,
              actorName: 'DevMaster_01',
              actorEmail: 'devmaster@company.com',
              ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
              location: 'US-East (N. Virginia)',
              severity: status === 'Active' ? 'Success' : 'Warning'
            });
          }

          return res.status(200).json(data);
        }
      } else {
        const keyIdx = mockStore.keys.findIndex(k => k.id.toString() === id.toString());
        if (keyIdx === -1) {
          return res.status(404).json({ error: 'Key not found' });
        }

        if (action === 'rotate') {
          const { raw } = generateApiKey();
          mockStore.keys[keyIdx].key = raw;

          await writeAuditLog({
            action: 'Key Rotated',
            category: 'Key Operations',
            target: mockStore.keys[keyIdx].name,
            actorName: 'DevMaster_01',
            actorEmail: 'devmaster@company.com',
            ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
            location: 'Local Loopback'
          });

          return res.status(200).json(mockStore.keys[keyIdx]);
        }

        if (status) {
          mockStore.keys[keyIdx].status = status;

          await writeAuditLog({
            action: status === 'Active' ? 'Key Enabled' : 'Key Disabled',
            category: 'Key Operations',
            target: mockStore.keys[keyIdx].name,
            actorName: 'DevMaster_01',
            actorEmail: 'devmaster@company.com',
            ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
            location: 'Local Loopback',
            severity: status === 'Active' ? 'Success' : 'Warning'
          });

          return res.status(200).json(mockStore.keys[keyIdx]);
        }
      }
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Key ID is required' });
      }

      if (isLiveMode && supabase) {
        const { data: oldKey } = await supabase
          .from('api_keys')
          .select('name')
          .eq('id', id)
          .single();

        const { error } = await supabase
          .from('api_keys')
          .delete()
          .eq('id', id);

        if (error) throw error;

        if (oldKey) {
          await writeAuditLog({
            action: 'Key Revoked',
            category: 'Key Operations',
            target: oldKey.name,
            actorName: 'DevMaster_01',
            actorEmail: 'devmaster@company.com',
            ipAddress: req.headers['x-forwarded-for'] as string || '127.0.0.1',
            location: 'US-East (N. Virginia)',
            severity: 'Revocation'
          });
        }

        return res.status(200).json({ success: true });
      } else {
        const key = mockStore.keys.find(k => k.id.toString() === id.toString());
        mockStore.keys = mockStore.keys.filter(k => k.id.toString() !== id.toString());

        if (key) {
          await writeAuditLog({
            action: 'Key Revoked',
            category: 'Key Operations',
            target: key.name,
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
