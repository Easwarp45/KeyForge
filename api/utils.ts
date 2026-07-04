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
    projects: [
      { id: '1', name: 'Payment Gateway', description: 'Handles all payment processing and billing APIs.', keys: 3, calls: '2.4M', status: 'Healthy', updated: '2 hours ago', icon: 'payments', color: '#10b981' },
      { id: '2', name: 'User Auth Service', description: 'Authentication and session management APIs.', keys: 2, calls: '890K', status: 'Healthy', updated: '5 hours ago', icon: 'lock', color: '#d0bcff' },
      { id: '3', name: 'Data Pipeline', description: 'ETL and data transformation services.', keys: 1, calls: '340K', status: 'Warning', updated: '1 day ago', icon: 'storage', color: '#ffb3af' },
      { id: '4', name: 'Phoenix Engine', description: 'Core API orchestration and routing layer.', keys: 2, calls: '5.1M', status: 'Healthy', updated: '30 min ago', icon: 'hub', color: '#10b981' },
    ],
    keys: [
      { id: 101, name: 'Stripe Prod Key', key: 'sk_live_stripe_982b', project_id: '1', scope: 'Admin', expiry: 'Never', status: 'Active' },
      { id: 102, name: 'PayPal API Integration', key: 'sk_live_paypal_102f', project_id: '1', scope: 'Read/Write', expiry: '30 Days', status: 'Active' },
      { id: 103, name: 'Legacy ApplePay Hook', key: 'sk_live_apple_774d', project_id: '1', scope: 'Read', expiry: 'Never', status: 'Disabled' },
      { id: 201, name: 'Cognito Client Sync', key: 'sk_live_auth_cc91', project_id: '2', scope: 'Read/Write', expiry: 'Never', status: 'Active' },
      { id: 202, name: 'Auth0 Auth Hook', key: 'sk_live_auth_0a23', project_id: '2', scope: 'Admin', expiry: '90 Days', status: 'Active' },
      { id: 301, name: 'ETL Pipeline Key', key: 'sk_live_etl_4421', project_id: '3', scope: 'Read/Write', expiry: '3 Days', status: 'Active' },
    ],
    team: [
      { id: 1, name: 'Jordan Martinez', email: 'j.martinez@company.com', role: 'Owner', avatar: 'JM', joined: 'Jan 2024', status: 'Active', keys: 22 },
      { id: 2, name: 'Alex Chen', email: 'alex.chen@company.com', role: 'Admin', avatar: 'AC', joined: 'Feb 2024', status: 'Active', keys: 14 },
      { id: 3, name: 'Sam Rivera', email: 'sam.r@company.com', role: 'Developer', avatar: 'SR', joined: 'Mar 2024', status: 'Active', keys: 8 },
      { id: 4, name: 'Taylor Kim', email: 'taylor.k@company.com', role: 'Read Only', avatar: 'TK', joined: 'Apr 2024', status: 'Active', keys: 0 },
      { id: 5, name: 'Morgan Davis', email: 'mdavis@company.com', role: 'Developer', avatar: 'MD', joined: 'May 2024', status: 'Invited', keys: 0 },
    ],
    audits: [
      { id: 1, action: 'Key Rotated', category: 'Key Operations', actorName: 'Alex Chen', actorEmail: 'alex.chen@company.com', target: 'sk_live_stripe_982b', ip: '192.168.1.42', location: 'US-East (N. Virginia)', timestamp: '2026-07-04 14:15:22 UTC', severity: 'Success' },
      { id: 2, action: 'Key Revoked', category: 'Key Operations', actorName: 'Jordan Martinez', actorEmail: 'j.martinez@company.com', target: 'sk_live_crm_sync', ip: '85.204.101.99', location: 'EU-Central (Frankfurt)', timestamp: '2026-07-04 12:44:10 UTC', severity: 'Revocation' },
      { id: 3, action: 'Project Created', category: 'Project Operations', actorName: 'Jordan Martinez', actorEmail: 'j.martinez@company.com', target: 'CyberVault Auth', ip: '85.204.101.99', location: 'EU-Central (Frankfurt)', timestamp: '2026-07-04 10:12:15 UTC', severity: 'Success' },
      { id: 4, action: 'Member Invited', category: 'Team Access', actorName: 'Jordan Martinez', actorEmail: 'j.martinez@company.com', target: 'morgan.davis@company.com', ip: '85.204.101.99', location: 'EU-Central (Frankfurt)', timestamp: '2026-07-04 09:30:00 UTC', severity: 'Success' },
      { id: 5, action: 'MFA Enabled', category: 'System Settings', actorName: 'Sam Rivera', actorEmail: 'sam.r@company.com', target: 'Account Security Settings', ip: '14.192.83.210', location: 'AP-South (Mumbai)', timestamp: '2026-07-03 21:05:40 UTC', severity: 'Success' },
    ]
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
export function enableCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
