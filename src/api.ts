import { createClient } from '@supabase/supabase-js';

// ── Supabase Auth Client Setup ──────────────────────────────────────────────
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.includes('://')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function signInWithOAuth(provider: 'google' | 'github') {
  if (!supabaseClient) {
    // Development fallback — no logging in production
    window.location.href = '/dashboard';
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  window.location.href = '/';
}

// ── KeyForge Unified API Client ─────────────────────────────────────────────
// Abstracted API methods connecting frontend to Vercel Serverless `/api/*`

const API_BASE = ''; // Uses relative URLs since Vercel hosts SPA & Functions on the same origin

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    // Surface only the server's user-safe message; never raw status codes or stack traces
    throw new Error(errorData.error || 'An unexpected error occurred. Please try again.');
  }

  return res.json() as Promise<T>;
}

// ── Project Requests ────────────────────────────────────────────────────────
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

export async function getProjects(): Promise<Project[]> {
  return fetchJson<Project[]>(`${API_BASE}/api/projects`);
}

export async function createProject(name: string, environment: 'Dev' | 'Staging' | 'Prod', description?: string): Promise<Project> {
  return fetchJson<Project>(`${API_BASE}/api/projects`, {
    method: 'POST',
    body: JSON.stringify({ name, environment, description })
  });
}

export async function deleteProject(id: string): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${API_BASE}/api/projects?id=${id}`, {
    method: 'DELETE'
  });
}

// ── API Key Requests ────────────────────────────────────────────────────────
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

export async function getKeys(projectId?: string): Promise<ApiKey[]> {
  const url = projectId ? `${API_BASE}/api/keys?projectId=${projectId}` : `${API_BASE}/api/keys`;
  return fetchJson<ApiKey[]>(url);
}

export async function generateKey(params: {
  name: string;
  projectId: string;
  scope: string;
  expiry: string;
}): Promise<ApiKey> {
  return fetchJson<ApiKey>(`${API_BASE}/api/keys`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function rotateKey(id: string | number): Promise<ApiKey> {
  return fetchJson<ApiKey>(`${API_BASE}/api/keys?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'rotate' })
  });
}

export async function updateKeyStatus(id: string | number, status: 'Active' | 'Disabled'): Promise<ApiKey> {
  return fetchJson<ApiKey>(`${API_BASE}/api/keys?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function revokeKey(id: string | number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${API_BASE}/api/keys?id=${id}`, {
    method: 'DELETE'
  });
}

// ── Team Requests ───────────────────────────────────────────────────────────
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

export async function getTeam(): Promise<TeamMember[]> {
  return fetchJson<TeamMember[]>(`${API_BASE}/api/team`);
}

export async function inviteMember(name: string, email: string, role: string): Promise<TeamMember> {
  return fetchJson<TeamMember>(`${API_BASE}/api/team`, {
    method: 'POST',
    body: JSON.stringify({ name, email, role })
  });
}

export async function updateMember(id: string | number, params: { name?: string; role?: string }): Promise<TeamMember> {
  return fetchJson<TeamMember>(`${API_BASE}/api/team?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify(params)
  });
}

export async function removeMember(id: string | number): Promise<{ success: boolean }> {
  return fetchJson<{ success: boolean }>(`${API_BASE}/api/team?id=${id}`, {
    method: 'DELETE'
  });
}

// ── Audit Log Requests ──────────────────────────────────────────────────────
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

export async function getAudits(): Promise<AuditLog[]> {
  return fetchJson<AuditLog[]>(`${API_BASE}/api/audits`);
}

