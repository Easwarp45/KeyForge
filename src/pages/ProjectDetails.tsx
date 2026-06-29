import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Select from '../components/Select';

type Key = {
  id: number;
  name: string;
  key: string;
  scope: string;
  expiry: string;
  status: 'Active' | 'Revoked' | 'Disabled';
};

type ProjectData = {
  id: number;
  name: string;
  description: string;
  status: 'Healthy' | 'Warning' | 'Inactive';
  updated: string;
  icon: string;
  color: string;
  keys: Key[];
  calls: string;
  callsData: { date: string; calls: number }[];
  members: { name: string; email: string; role: string; avatar: string }[];
};

const projectsDataSource: Record<string, ProjectData> = {
  '1': {
    id: 1,
    name: 'Payment Gateway',
    description: 'Handles all payment processing and billing APIs.',
    status: 'Healthy',
    updated: '2 hours ago',
    icon: 'payments',
    color: '#10b981',
    calls: '2.4M',
    callsData: [
      { date: 'Jun 22', calls: 35000 },
      { date: 'Jun 23', calls: 41000 },
      { date: 'Jun 24', calls: 38000 },
      { date: 'Jun 25', calls: 44000 },
      { date: 'Jun 26', calls: 48000 },
      { date: 'Jun 27', calls: 52000 },
      { date: 'Jun 28', calls: 49000 },
    ],
    keys: [
      { id: 101, name: 'Stripe Prod Key', key: 'sk_live_stripe_982b', scope: 'Admin', expiry: 'Never', status: 'Active' },
      { id: 102, name: 'PayPal API Integration', key: 'sk_live_paypal_102f', scope: 'Read/Write', expiry: '30 Days', status: 'Active' },
      { id: 103, name: 'Legacy ApplePay Hook', key: 'sk_live_apple_774d', scope: 'Read', expiry: 'Never', status: 'Disabled' },
    ],
    members: [
      { name: 'Jordan Martinez', email: 'j.martinez@company.com', role: 'Owner', avatar: 'JM' },
      { name: 'Sam Rivera', email: 'sam.r@company.com', role: 'Developer', avatar: 'SR' },
    ],
  },
  '2': {
    id: 2,
    name: 'User Auth Service',
    description: 'Authentication and session management APIs.',
    status: 'Healthy',
    updated: '5 hours ago',
    icon: 'lock',
    color: '#d0bcff',
    calls: '890K',
    callsData: [
      { date: 'Jun 22', calls: 12000 },
      { date: 'Jun 23', calls: 14000 },
      { date: 'Jun 24', calls: 11000 },
      { date: 'Jun 25', calls: 15000 },
      { date: 'Jun 26', calls: 18000 },
      { date: 'Jun 27', calls: 17000 },
      { date: 'Jun 28', calls: 16000 },
    ],
    keys: [
      { id: 201, name: 'Cognito Client Sync', key: 'sk_live_auth_cc91', scope: 'Read/Write', expiry: 'Never', status: 'Active' },
      { id: 202, name: 'Auth0 Auth Hook', key: 'sk_live_auth_0a23', scope: 'Admin', expiry: '90 Days', status: 'Active' },
    ],
    members: [
      { name: 'Alex Chen', email: 'alex.chen@company.com', role: 'Admin', avatar: 'AC' },
      { name: 'Taylor Kim', email: 'taylor.k@company.com', role: 'Read Only', avatar: 'TK' },
    ],
  },
  '3': {
    id: 3,
    name: 'Data Pipeline',
    description: 'ETL and data transformation services.',
    status: 'Warning',
    updated: '1 day ago',
    icon: 'storage',
    color: '#ffb3af',
    calls: '340K',
    callsData: [
      { date: 'Jun 22', calls: 4000 },
      { date: 'Jun 23', calls: 4500 },
      { date: 'Jun 24', calls: 6000 },
      { date: 'Jun 25', calls: 3100 },
      { date: 'Jun 26', calls: 5000 },
      { date: 'Jun 27', calls: 5800 },
      { date: 'Jun 28', calls: 2400 },
    ],
    keys: [
      { id: 301, name: 'ETL Pipeline Key', key: 'sk_live_etl_4421', scope: 'Read/Write', expiry: '3 Days', status: 'Active' },
    ],
    members: [
      { name: 'Jordan Martinez', email: 'j.martinez@company.com', role: 'Owner', avatar: 'JM' },
      { name: 'Morgan Davis', email: 'mdavis@company.com', role: 'Developer', avatar: 'MD' },
    ],
  },
  '4': {
    id: 4,
    name: 'Phoenix Engine',
    description: 'Core API orchestration and routing layer.',
    status: 'Healthy',
    updated: '30 min ago',
    icon: 'hub',
    color: '#10b981',
    calls: '5.1M',
    callsData: [
      { date: 'Jun 22', calls: 78000 },
      { date: 'Jun 23', calls: 82000 },
      { date: 'Jun 24', calls: 89000 },
      { date: 'Jun 25', calls: 94000 },
      { date: 'Jun 26', calls: 92000 },
      { date: 'Jun 27', calls: 99000 },
      { date: 'Jun 28', calls: 104000 },
    ],
    keys: [
      { id: 401, name: 'Phoenix Central Hook', key: 'sk_live_phx_1120', scope: 'Admin', expiry: 'Never', status: 'Active' },
      { id: 402, name: 'Staging Engine Key', key: 'sk_stage_phx_3345', scope: 'Read/Write', expiry: '1 Year', status: 'Active' },
    ],
    members: [
      { name: 'Alex Chen', email: 'alex.chen@company.com', role: 'Admin', avatar: 'AC' },
      { name: 'Sam Rivera', email: 'sam.r@company.com', role: 'Developer', avatar: 'SR' },
    ],
  },
  '5': {
    id: 5,
    name: 'CyberVault Auth',
    description: 'Enterprise identity and access management.',
    status: 'Healthy',
    updated: '1 hour ago',
    icon: 'shield',
    color: '#4edea3',
    calls: '1.2M',
    callsData: [
      { date: 'Jun 22', calls: 15000 },
      { date: 'Jun 23', calls: 19000 },
      { date: 'Jun 24', calls: 24000 },
      { date: 'Jun 25', calls: 22000 },
      { date: 'Jun 26', calls: 25000 },
      { date: 'Jun 27', calls: 28000 },
      { date: 'Jun 28', calls: 27000 },
    ],
    keys: [
      { id: 501, name: 'Vault Security Read', key: 'sk_live_sec_0001', scope: 'Read', expiry: 'Never', status: 'Active' },
    ],
    members: [
      { name: 'Jordan Martinez', email: 'j.martinez@company.com', role: 'Owner', avatar: 'JM' },
      { name: 'Taylor Kim', email: 'taylor.k@company.com', role: 'Read Only', avatar: 'TK' },
    ],
  },
  '6': {
    id: 6,
    name: 'Nexus Data Hub',
    description: 'Centralized data lake integration APIs.',
    status: 'Inactive',
    updated: '3 days ago',
    icon: 'cloud',
    color: '#86948a',
    calls: '78K',
    callsData: [
      { date: 'Jun 22', calls: 1000 },
      { date: 'Jun 23', calls: 1100 },
      { date: 'Jun 24', calls: 1200 },
      { date: 'Jun 25', calls: 900 },
      { date: 'Jun 26', calls: 1000 },
      { date: 'Jun 27', calls: 1300 },
      { date: 'Jun 28', calls: 800 },
    ],
    keys: [],
    members: [
      { name: 'Morgan Davis', email: 'mdavis@company.com', role: 'Developer', avatar: 'MD' },
    ],
  },
};

const scopeColor: Record<string, string> = {
  Admin: 'bg-error/10 text-error border-error/20',
  Read: 'bg-surface-variant text-on-surface-variant border-outline-variant/50',
  'Read/Write': 'bg-primary/10 text-primary border-primary/20',
  Write: 'bg-secondary/10 text-secondary border-secondary/20',
};

const MASK = '••••••••••••••••';

const statusBadge: Record<string, string> = {
  Healthy: 'badge-active',
  Warning: 'badge-warning',
  Inactive: 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border text-on-surface-variant bg-surface-variant border-outline-variant/30',
};

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = projectsDataSource[id || '1'] || projectsDataSource['1'];

  const [keys, setKeys] = useState<Key[]>(project.keys);
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [rotatingId, setRotatingId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', scope: 'Read/Write', expiry: '30 Days' });

  const toggleReveal = (id: number) =>
    setRevealedKeys(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleCopy = (id: number, keyVal: string) => {
    navigator.clipboard.writeText(keyVal).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: number) => setKeys(prev => prev.filter(k => k.id !== id));

  const handleDisable = (id: number) =>
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: k.status === 'Active' ? 'Disabled' : 'Active' } : k));

  const handleRotate = async (id: number) => {
    setRotatingId(id);
    await new Promise(r => setTimeout(r, 1200));
    const newSuffix = Math.random().toString(36).slice(2, 10);
    setKeys(prev => prev.map(k => k.id === id ? { ...k, key: `sk_live_${newSuffix}` } : k));
    setRotatingId(null);
  };

  const handleCreate = () => {
    const id = Date.now();
    const suffix = Math.random().toString(36).slice(2, 10);
    setKeys(prev => [{
      id,
      name: newKey.name || 'New API Key',
      key: `sk_live_${suffix}`,
      scope: newKey.scope,
      expiry: newKey.expiry,
      status: 'Active',
    }, ...prev]);
    setShowCreateModal(false);
    setNewKey({ name: '', scope: 'Read/Write', expiry: '30 Days' });
  };

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
      {/* Back & Breadcrumbs */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/projects')}
          className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-variant transition-colors cursor-pointer flex items-center"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
        </motion.button>
        <span className="text-on-surface-variant text-sm font-mono cursor-pointer hover:underline" onClick={() => navigate('/projects')}>Projects</span>
        <span className="text-on-surface-variant font-mono">/</span>
        <span className="text-on-surface text-sm font-mono font-semibold">{project.name}</span>
      </div>

      {/* Header Profile Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bento-card gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${project.color}20` }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: project.color }}>{project.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-on-surface" style={{ fontSize: 26 }}>{project.name}</h2>
              <span className={statusBadge[project.status]}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: project.status === 'Healthy' ? '#4edea3' : project.status === 'Warning' ? '#ffb3af' : '#86948a' }} />
                {project.status}
              </span>
            </div>
            <p className="text-on-surface-variant text-sm mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/analytics?project=${encodeURIComponent(project.name)}`)}
            className="btn-secondary px-4 py-2 text-sm rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>leaderboard</span>
            Analytics
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="btn-primary px-4 py-2 text-sm font-semibold shadow-emerald-sm rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Generate Key
          </motion.button>
        </div>
      </div>

      {/* Security Guarantee Banner */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3 items-center">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        <div className="text-xs">
          <p className="font-semibold text-primary">Unbreachable Architecture & Key Protection Enabled</p>
          <p className="text-on-surface-variant mt-0.5">
            KeyForge employs <strong>Hash-on-Write</strong>. Raw private keys are cryptographically hashed using SHA-256 before database storage. 
            Once generated, the secret values are never displayed again or exposed to anyone—including administrators. Firewalls restrict query contexts dynamically.
          </p>
        </div>
      </div>

      {/* Bento Grid Info Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Recharts Call Volume chart */}
          <div className="bento-card p-6 h-80 flex flex-col justify-between">
            <h3 className="font-semibold text-on-surface text-sm mb-4">Project Call Volume (Last 7 Days)</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={project.callsData} margin={{ top: 0, right: 8, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={project.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={project.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,74,66,0.2)" />
                  <XAxis dataKey="date" stroke="#86948a" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke="#86948a" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip contentStyle={{ background: '#1a211d', border: '1px solid rgba(60,74,66,0.5)', borderRadius: 8, color: '#dde4dd' }} />
                  <Area type="monotone" dataKey="calls" stroke={project.color} strokeWidth={2} fill="url(#projGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Keys list */}
          <div className="bento-card overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high/10">
              <h3 className="font-semibold text-on-surface text-sm">Active API Keys</h3>
              <span className="font-mono text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">{keys.length} Keys</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container/30">
                    {['Label', 'API Token', 'Scope', 'Expiry', 'Status', 'Actions'].map((h, i) => (
                      <th key={h} className={`p-4 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant ${i === 5 ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-sm">
                  <AnimatePresence>
                    {keys.map(k => (
                      <motion.tr
                        key={k.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/3 transition-colors group"
                      >
                        <td className="p-4 font-medium text-on-surface">{k.name}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-xs text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                              {revealedKeys.has(k.id) ? k.key : `${k.key.slice(0, 8)}${MASK.slice(0, 8)}`}
                            </code>
                            <button onClick={() => toggleReveal(k.id)} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary transition-all p-1">
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{revealedKeys.has(k.id) ? 'visibility_off' : 'visibility'}</span>
                            </button>
                            <button onClick={() => handleCopy(k.id, k.key)} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary transition-all p-1">
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{copiedId === k.id ? 'check' : 'content_copy'}</span>
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${scopeColor[k.scope] ?? ''}`}>
                            {k.scope}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-on-surface-variant">{k.expiry}</td>
                        <td className="p-4">
                          <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${k.status === 'Active' ? 'bg-primary animate-pulse' : 'bg-outline'}`} />
                          <span className="text-xs">{k.status}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleRotate(k.id)} disabled={rotatingId === k.id || k.status !== 'Active'} className="p-1 hover:text-secondary rounded disabled:opacity-40" title="Rotate">
                              <span className={`material-symbols-outlined ${rotatingId === k.id ? 'animate-spin' : ''}`} style={{ fontSize: 16 }}>sync</span>
                            </button>
                            <button onClick={() => handleDisable(k.id)} className="p-1 hover:text-tertiary rounded" title={k.status === 'Active' ? 'Disable' : 'Enable'}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{k.status === 'Active' ? 'block' : 'check_circle'}</span>
                            </button>
                            <button onClick={() => handleDelete(k.id)} className="p-1 hover:text-error rounded" title="Delete">
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {keys.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-on-surface-variant text-xs">No active keys. Click Generate Key to create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column (1/3 width) */}
        <div className="flex flex-col gap-6">
          {/* Stats card */}
          <div className="bento-card p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-on-surface text-sm">Project Analytics Summary</h3>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {[
                { label: 'Total Calls', value: project.calls },
                { label: 'Latency', value: '184ms' },
                { label: 'Active Keys', value: keys.filter(k => k.status === 'Active').length },
                { label: 'Health Score', value: '99.8%' },
              ].map(s => (
                <div key={s.label} className="bg-surface-container-low/50 p-4 border border-outline-variant/30 rounded-xl">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">{s.label}</span>
                  <p className="text-xl font-black text-on-surface mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Members */}
          <div className="bento-card p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-on-surface text-sm">Assigned Contributors</h3>
            <div className="space-y-3">
              {project.members.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {m.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface">{m.name}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{m.email}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings / Danger Zone */}
          <div className="bento-card p-6 border border-error/15">
            <h3 className="font-semibold text-error text-sm mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>dangerous</span>
              Delete Project
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">Deleting this project will immediately revoke all active credentials assigned to it. This cannot be undone.</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { if(confirm('Delete project?')) navigate('/projects'); }}
              className="w-full bg-error-container hover:bg-error hover:text-white transition-colors py-2 rounded-lg text-xs font-semibold text-error cursor-pointer border border-error/20"
            >
              Delete Project
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Create Key Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex">
            <div className="absolute inset-0" style={{ background: 'rgba(9,16,12,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setShowCreateModal(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-outline-variant/40 shadow-2xl flex flex-col z-[110]"
            >
              <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/50">
                <h3 className="font-semibold text-on-surface" style={{ fontSize: 20 }}>Generate API Key</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 space-y-5 custom-scrollbar">
                <div>
                  <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Key Label *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Mobile Auth"
                    value={newKey.name}
                    onChange={e => setNewKey(p => ({ ...p, name: e.target.value }))}
                    className="glass-input w-full px-3 py-2.5 text-sm focus:border-primary outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-on-surface-variant mb-2.5 uppercase tracking-wider">Scopes</label>
                  <Select
                    value={newKey.scope}
                    onChange={val => setNewKey(p => ({ ...p, scope: val }))}
                    options={['Read', 'Read/Write', 'Admin', 'Write']}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-on-surface-variant mb-2.5 uppercase tracking-wider">Expiration</label>
                  <Select
                    value={newKey.expiry}
                    onChange={val => setNewKey(p => ({ ...p, expiry: val }))}
                    options={['30 Days', '60 Days', '90 Days', 'Never']}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-outline-variant/30 bg-surface-container/30 flex justify-end gap-3">
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary px-4 py-2 text-sm rounded-lg cursor-pointer">Cancel</button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!newKey.name.trim()}
                  onClick={handleCreate}
                  className="btn-primary px-5 py-2 text-sm shadow-emerald-sm rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  Generate Key
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
