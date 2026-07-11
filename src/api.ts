import { createClient } from '@supabase/supabase-js';

// ── Supabase Auth Client ──────────────────────────────────────────────────────
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.includes('://')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ── OAuth Sign-in ─────────────────────────────────────────────────────────────
export async function signInWithOAuth(provider: 'google' | 'github') {
  if (!supabaseClient) {
    // Dev fallback — navigate directly when Supabase is not configured
    window.location.href = '/dashboard';
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });

  if (error) throw error;
  return data;
}

// ── Email / Password Sign-in ──────────────────────────────────────────────────
/**
 * WHY: The previous handleSubmit in SignIn.tsx ran a 1.5s fake timer then
 * navigated to /dashboard regardless of credentials. Any email+password worked.
 * This function calls Supabase's real signInWithPassword and throws on failure.
 */
export async function signInWithEmail(email: string, password: string) {
  if (!supabaseClient) {
    // Dev mode fallback — allow any credentials locally
    return { user: null, session: null };
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

// ── Email / Password Sign-up ──────────────────────────────────────────────────
/**
 * WHY: The previous SignUp.tsx also ran a timer and navigated without ever
 * calling Supabase. This function creates a real account, triggering the
 * email verification flow that Supabase sends automatically.
 */
export async function signUpWithEmail(email: string, password: string, fullName: string) {
  if (!supabaseClient) {
    return { user: null, session: null };
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName } // stored in user_metadata, available in JWT claims
    }
  });

  if (error) throw new Error(error.message);
  return data;
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export async function signOut() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  window.location.href = '/';
}

// ── Unified API Client ────────────────────────────────────────────────────────
// All calls route to Vercel Serverless /api/* on the same origin.
const API_BASE = '';

/**
 * WHY for auth header: Every API handler now requires a valid Supabase JWT.
 * We read the current session token and attach it as "Authorization: Bearer <token>"
 * so the server can verify the caller's identity and scope queries to their org.
 */
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {})
  };

  // Attach session token for server-side authentication
  if (supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(
      typeof errorData['error'] === 'string'
        ? errorData['error']
        : 'An unexpected error occurred. Please try again.'
    );
  }

  return res.json() as Promise<T>;
}

// ── Project API ───────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  environment: 'Dev' | 'Staging' | 'Prod';
  description: string;
  keys?: number;
  calls?: string;
  status?: 'Healthy' | 'Warning' | 'Inactive';
  updated?: string;
  icon?: string;
  color?: string;
}

export function getProjects(): Promise<Project[]> {
  return fetchJson<Project[]>(`${API_BASE}/api/projects`);
}

export function createProject(name: string, environment: 'Dev' | 'Staging' | 'Prod', description?: string): Promise<Project> {
  return fetchJson<Project>(`${API_BASE}/api/projects`, {
    method: 'POST',
    body: JSON.stringify({ name, environment, description })
  });
}

export function deleteProject(id: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${API_BASE}/api/projects?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

// ── API Key API ───────────────────────────────────────────────────────────────
export interface ApiKey {
  id: string | number;
  name: string;
  key: string;
  project_id: string;
  scope: 'Read' | 'Read/Write' | 'Write' | 'Admin';
  expiry: string;
  status: 'Active' | 'Disabled' | 'Revoked';
  created?: string;
  project?: string;
}

export function getKeys(projectId?: string): Promise<ApiKey[]> {
  const url = projectId
    ? `${API_BASE}/api/keys?projectId=${encodeURIComponent(projectId)}`
    : `${API_BASE}/api/keys`;
  return fetchJson<ApiKey[]>(url);
}

export function generateKey(params: {
  name: string; projectId: string; scope: string; expiry: string;
}): Promise<ApiKey> {
  return fetchJson<ApiKey>(`${API_BASE}/api/keys`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export function rotateKey(id: string | number): Promise<ApiKey> {
  return fetchJson<ApiKey>(`${API_BASE}/api/keys?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'rotate' })
  });
}

export function updateKeyStatus(id: string | number, status: 'Active' | 'Disabled'): Promise<ApiKey> {
  return fetchJson<ApiKey>(`${API_BASE}/api/keys?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export function revokeKey(id: string | number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${API_BASE}/api/keys?id=${id}`, { method: 'DELETE' });
}

// ── Team API ──────────────────────────────────────────────────────────────────
export interface TeamMember {
  id: string | number;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Developer' | 'Read Only';
  avatar?: string;
  joined?: string;
  status: 'Active' | 'Invited';
  keys?: number;
}

export function getTeam(): Promise<TeamMember[]> {
  return fetchJson<TeamMember[]>(`${API_BASE}/api/team`);
}

export function inviteMember(name: string, email: string, role: string): Promise<TeamMember> {
  return fetchJson<TeamMember>(`${API_BASE}/api/team`, {
    method: 'POST',
    body: JSON.stringify({ name, email, role })
  });
}

export function updateMember(id: string | number, params: { name?: string; role?: string }): Promise<TeamMember> {
  return fetchJson<TeamMember>(`${API_BASE}/api/team?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify(params)
  });
}

export function removeMember(id: string | number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${API_BASE}/api/team?id=${id}`, { method: 'DELETE' });
}

// ── Audit Log API ─────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string | number;
  action: string;
  category: 'Key Operations' | 'Project Operations' | 'Team Access' | 'System Settings';
  actorName: string;
  actorEmail: string;
  target: string;
  ip: string;
  location: string;
  timestamp: string;
  severity: 'Success' | 'Warning' | 'Revocation';
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * WHY for page param: Server now returns paginated results (50 at a time)
 * rather than loading every audit log row into memory at once.
 */
export function getAudits(page = 0): Promise<AuditLogsResponse> {
  return fetchJson<AuditLogsResponse>(`${API_BASE}/api/audits?page=${page}`);
}
