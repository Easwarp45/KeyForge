import { VercelRequest, VercelResponse, supabase, isLiveMode, mockStore, hashApiKey, writeAuditLog, enableCors } from './utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }

  const { key, requiredScope } = req.body;
  if (!key) {
    return res.status(400).json({ valid: false, error: 'API key is required in request body' });
  }

  const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
  const hashed = hashApiKey(key);

  try {
    if (isLiveMode && supabase) {
      // Look up key prefix and details
      const { data: keyRecord, error } = await supabase
        .from('api_keys')
        .select(`
          id, name, scope, expiry, status, project_id,
          projects (org_id, name)
        `)
        .eq('hashed_key', hashed)
        .maybeSingle();

      if (error) throw error;

      if (!keyRecord) {
        // Log unauthorized attempt
        await writeAuditLog({
          action: 'Key Validation Failed',
          category: 'Key Operations',
          target: `${key.slice(0, 12)}...`,
          actorName: 'Anonymous Caller',
          actorEmail: 'unknown-client@ip.address',
          ipAddress: ip,
          location: 'Internet Access Gate',
          severity: 'Warning'
        });

        return res.status(401).json({ valid: false, error: 'Invalid API Key' });
      }

      const keyDetails: any = keyRecord;

      // Verify status
      if (keyDetails.status !== 'Active') {
        return res.status(403).json({
          valid: false,
          error: `Key status is currently: ${keyDetails.status}`
        });
      }

      // Verify expiration
      if (keyDetails.expiry && new Date(keyDetails.expiry) < new Date()) {
        // Automatically deactivate expired keys
        await supabase
          .from('api_keys')
          .update({ status: 'Disabled' })
          .eq('id', keyDetails.id);

        return res.status(403).json({ valid: false, error: 'API Key has expired' });
      }

      // Verify scope if requested
      if (requiredScope) {
        const allowed = checkScope(keyDetails.scope, requiredScope);
        if (!allowed) {
          return res.status(403).json({
            valid: false,
            error: `Insufficient scopes. Required: ${requiredScope}, Authorized: ${keyDetails.scope}`
          });
        }
      }

      // Success! Log validation telemetry
      await writeAuditLog({
        orgId: keyDetails.projects.org_id,
        action: 'Key Validated',
        category: 'Key Operations',
        target: keyDetails.name,
        actorName: 'Gateway Process',
        actorEmail: 'gateway-daemon@keyforge.dev',
        ipAddress: ip,
        location: 'API Gate Proxy'
      });

      return res.status(200).json({
        valid: true,
        keyId: keyDetails.id,
        keyName: keyDetails.name,
        scope: keyDetails.scope,
        projectName: keyDetails.projects.name
      });
    } else {
      // Fallback Mock validation
      const keyRecord = mockStore.keys.find(k => k.key === key);

      if (!keyRecord) {
        await writeAuditLog({
          action: 'Key Validation Failed',
          category: 'Key Operations',
          target: `${key.slice(0, 12)}...`,
          actorName: 'Anonymous Caller',
          actorEmail: 'unknown-client@ip.address',
          ipAddress: ip,
          location: 'Local Network Gate',
          severity: 'Warning'
        });
        return res.status(401).json({ valid: false, error: 'Invalid API Key' });
      }

      if (keyRecord.status !== 'Active') {
        return res.status(403).json({ valid: false, error: `Key status is: ${keyRecord.status}` });
      }

      if (requiredScope && !checkScope(keyRecord.scope, requiredScope)) {
        return res.status(403).json({
          valid: false,
          error: `Insufficient scopes. Required: ${requiredScope}, Authorized: ${keyRecord.scope}`
        });
      }

      // Success
      await writeAuditLog({
        action: 'Key Validated',
        category: 'Key Operations',
        target: keyRecord.name,
        actorName: 'Gateway Process (Mock)',
        actorEmail: 'gateway-daemon@keyforge.dev',
        ipAddress: ip,
        location: 'Mock Loopback'
      });

      return res.status(200).json({
        valid: true,
        keyId: keyRecord.id,
        keyName: keyRecord.name,
        scope: keyRecord.scope
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

// Scope check hierarchy: Admin covers everything. Read/Write covers Read and Write.
function checkScope(authorized: string, required: string): boolean {
  if (authorized === 'Admin') return true;
  if (authorized === required) return true;
  if (authorized === 'Read/Write' && (required === 'Read' || required === 'Write')) return true;
  return false;
}
