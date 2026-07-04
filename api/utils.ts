import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

// ── Types for Vercel Serverless Functions ─────────────────────────────────────
export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  cookies: Record<string, string>;
  body: any;
  method?: string;
}

export interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  send: (body: any) => VercelResponse;
}

// ── Environment Configuration ────────────────────────────────────────────────
let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.includes('://')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Detect if we should run in live Supabase mode or fallback mock mode
export const isLiveMode = !!(supabaseUrl && supabaseServiceKey);

export const supabase = isLiveMode 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;

export interface MockDataStore {
  projects: any[];
  keys: any[];
  team: any[];
  audits: any[];
}

// Persist in global scope (active during serverless runtime memory retention)
const globalRef = globalThis as any;
if (!globalRef.mockStore) {
  globalRef.mockStore = {
    projects: [],
    keys: [],
    team: [],
    audits: []
  };
}

export const mockStore: MockDataStore = globalRef.mockStore;

// ── Cryptographic Key Hashing Engine ────────────────────────────────────────
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  // Generate 32 bytes of secure random bytes as hex token
  const token = crypto.randomBytes(24).toString('hex');
  const raw = `sk_live_${token}`;
  const prefix = raw.slice(0, 12); // e.g. "sk_live_abcd"
  const hash = hashApiKey(raw);
  return { raw, prefix, hash };
}

// Helper to write audit trail records safely in both modes
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
}) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  if (isLiveMode && supabase) {
    await supabase.from('audit_logs').insert([
      {
        org_id: params.orgId || '00000000-0000-0000-0000-000000000000', // fallback or real UUID
        action: params.action,
        category: params.category,
        target: params.target,
        actor_name: params.actorName,
        actor_email: params.actorEmail,
        ip_address: params.ipAddress,
        location: params.location,
        severity: params.severity || 'Success'
      }
    ]);
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

// Cors wrapper helper for endpoints
const ALLOWED_ORIGINS = [
  'https://key-forge-five.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

export function enableCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers['origin'] as string || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Vary', 'Origin');

  // ── Security Headers ──────────────────────────────────────────────────────
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
  );
  res.setHeader('X-Powered-By', ''); // Remove server fingerprint

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Sanitized error response — never expose internal error messages to client
export function safeError(res: VercelResponse, statusCode: number, clientMessage: string): VercelResponse {
  return res.status(statusCode).json({ error: clientMessage });
}
