import {
  VercelRequest, VercelResponse,
  supabase, isLiveMode, mockStore,
  hashApiKey, writeAuditLog, enableCors, safeError, checkRateLimit
} from './utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (enableCors(req, res)) return;

  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }

  const ip = req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress || '127.0.0.1';

  // ── Rate Limiting ──────────────────────────────────────────────────────────
  // WHY: The validate endpoint is called by external services to check keys.
  // Without a rate limit, an attacker could enumerate valid keys through rapid
  // brute-force (even though keys are long, limiting attempts is defense-in-depth).
  // 100 validations per minute per IP is generous for legitimate use.
  if (checkRateLimit(`validate:${ip}`, 100, 60_000)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      valid: false,
      error: 'Too many requests. Rate limit exceeded. Please retry after 60 seconds.'
    });
  }

  const { key, requiredScope } = req.body as { key?: unknown; requiredScope?: unknown };

  if (!key) {
    return res.status(400).json({ valid: false, error: 'API key is required in the request body.' });
  }

  const keyStr = String(key);
  const hashed = hashApiKey(keyStr);

  try {
    if (isLiveMode && supabase) {
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
        await writeAuditLog({
          action: 'Key Validation Failed',
          category: 'Key Operations',
          target: `${keyStr.slice(0, 12)}...`,
          actorName: 'Anonymous Caller',
          actorEmail: 'unknown@client',
          ipAddress: ip,
          location: 'Internet Access Gate',
          severity: 'Warning'
        });
        return res.status(401).json({ valid: false, error: 'Invalid API key.' });
      }

      const kd = keyRecord as {
        id: string; name: string; scope: string; expiry: string | null;
        status: string; project_id: string; projects: { org_id: string; name: string }
      };

      if (kd.status !== 'Active') {
        return res.status(403).json({ valid: false, error: `Key is currently ${kd.status.toLowerCase()}.` });
      }

      if (kd.expiry && new Date(kd.expiry) < new Date()) {
        // Auto-deactivate expired keys
        await supabase.from('api_keys').update({ status: 'Disabled' }).eq('id', kd.id);
        return res.status(403).json({ valid: false, error: 'API key has expired.' });
      }

      if (requiredScope) {
        if (!checkScope(kd.scope, String(requiredScope))) {
          return res.status(403).json({
            valid: false,
            error: `Insufficient scope. Required: ${requiredScope}, Authorized: ${kd.scope}`
          });
        }
      }

      await writeAuditLog({
        orgId: kd.projects.org_id,
        action: 'Key Validated',
        category: 'Key Operations',
        target: kd.name,
        actorName: 'Gateway Process',
        actorEmail: 'gateway@keyforge.dev',
        ipAddress: ip,
        location: 'API Gate Proxy'
      });

      return res.status(200).json({
        valid: true,
        keyId: kd.id,
        keyName: kd.name,
        scope: kd.scope,
        projectName: kd.projects.name
      });
    } else {
      // Mock mode: compare raw key directly (no hashing in dev store)
      const keyRecord = mockStore.keys.find(k => k.key === keyStr);

      if (!keyRecord) {
        await writeAuditLog({
          action: 'Key Validation Failed',
          category: 'Key Operations',
          target: `${keyStr.slice(0, 12)}...`,
          actorName: 'Anonymous Caller',
          actorEmail: 'unknown@client',
          ipAddress: ip,
          location: 'Local Dev Gate',
          severity: 'Warning'
        });
        return res.status(401).json({ valid: false, error: 'Invalid API key.' });
      }

      if (keyRecord.status !== 'Active') {
        return res.status(403).json({ valid: false, error: `Key is ${keyRecord.status.toLowerCase()}.` });
      }

      if (requiredScope && !checkScope(keyRecord.scope, String(requiredScope))) {
        return res.status(403).json({
          valid: false,
          error: `Insufficient scope. Required: ${requiredScope}, Authorized: ${keyRecord.scope}`
        });
      }

      await writeAuditLog({
        action: 'Key Validated',
        category: 'Key Operations',
        target: keyRecord.name,
        actorName: 'Gateway Process (Dev)',
        actorEmail: 'gateway@keyforge.dev',
        ipAddress: ip,
        location: 'Local Dev Gate'
      });

      return res.status(200).json({ valid: true, keyId: keyRecord.id, keyName: keyRecord.name, scope: keyRecord.scope });
    }
  } catch (err: unknown) {
    console.error('[/api/validate] Error:', err instanceof Error ? err.message : err);
    return safeError(res, 500, 'An internal error occurred. Please try again.');
  }
}

/**
 * Scope hierarchy: Admin > Read/Write > (Read | Write) > individual scopes.
 * Returns true if the authorized scope grants the required scope.
 */
function checkScope(authorized: string, required: string): boolean {
  if (authorized === 'Admin') return true;
  if (authorized === required) return true;
  if (authorized === 'Read/Write' && (required === 'Read' || required === 'Write')) return true;
  return false;
}
