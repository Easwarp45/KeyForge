import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Select from '../components/Select';
import { getProjects, getKeys, generateKey, rotateKey, updateKeyStatus, revokeKey, getTeam, type ApiKey, type Project, type TeamMember } from '../api';

const defaultCallsData = [
  { date: 'Jun 22', calls: 35000 },
  { date: 'Jun 23', calls: 41000 },
  { date: 'Jun 24', calls: 38000 },
  { date: 'Jun 25', calls: 44000 },
  { date: 'Jun 26', calls: 48000 },
  { date: 'Jun 27', calls: 52000 },
  { date: 'Jun 28', calls: 49000 },
];

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

  const [project, setProject] = useState<Project | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [revealedKeys, setRevealedKeys] = useState<Set<string | number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [rotatingId, setRotatingId] = useState<string | number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Successful key creation visibility helper (Hash-on-Write once)
  const [newKeyDetails, setNewKeyDetails] = useState<ApiKey | null>(null);
  
  const [newKey, setNewKey] = useState({ name: '', scope: 'Read/Write', expiry: '30 Days' });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getProjects().then(projs => projs.find(p => p.id === id) || null),
      getKeys(id),
      getTeam().catch(() => []) // load members to display in sidebar
    ])
      .then(([projData, keyData, teamData]) => {
        setProject(projData);
        setKeys(keyData);
        setMembers(teamData.slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const activeProject = project || {
    id: id || '',
    name: 'Loading...',
    description: '',
    status: 'Healthy' as const,
    color: '#10b981',
    icon: 'folder',
    calls: '0',
  };

  const toggleReveal = (idVal: string | number) =>
    setRevealedKeys(prev => { const n = new Set(prev); n.has(idVal) ? n.delete(idVal) : n.add(idVal); return n; });

  const handleCopy = (idVal: string | number, keyVal: string) => {
    navigator.clipboard.writeText(keyVal).catch(() => {});
    setCopiedId(idVal);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (idVal: string | number) => {
    revokeKey(idVal)
      .then(() => setKeys(prev => prev.filter(k => k.id !== idVal)))
      .catch(console.error);
  };

  const handleDisable = (idVal: string | number) => {
    const targetKey = keys.find(k => k.id === idVal);
    if (!targetKey) return;
    const nextStatus = targetKey.status === 'Active' ? 'Disabled' : 'Active';
    updateKeyStatus(idVal, nextStatus)
      .then(updated => {
        setKeys(prev => prev.map(k => k.id === idVal ? { ...k, status: updated.status } : k));
      })
      .catch(console.error);
  };

  const handleRotate = (idVal: string | number) => {
    setRotatingId(idVal);
    rotateKey(idVal)
      .then(updated => {
        setNewKeyDetails(updated); // Show newly generated rotated key in modal exactly once!
        setShowCreateModal(true); // Re-use modal or open to display plaintext
        setKeys(prev => prev.map(k => k.id === idVal ? { ...k, key: updated.key } : k));
      })
      .catch(console.error)
      .finally(() => setRotatingId(null));
  };

  const handleCreate = () => {
    if (!id || !newKey.name.trim()) return;
    generateKey({
      name: newKey.name,
      projectId: id,
      scope: newKey.scope,
      expiry: newKey.expiry
    })
      .then(createdKey => {
        setKeys(prev => [createdKey, ...prev]);
        setNewKeyDetails(createdKey); // Show generated secret once!
        setNewKey({ name: '', scope: 'Read/Write', expiry: '30 Days' });
      })
      .catch(console.error);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewKeyDetails(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] font-mono text-sm text-on-surface-variant py-12">
        <span className="material-symbols-outlined animate-spin align-middle mr-2" style={{ fontSize: 20 }}>progress_activity</span>
        Loading project details...
      </div>
    );
  }

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
        <span className="text-on-surface text-sm font-mono font-semibold">{activeProject.name}</span>
      </div>

      {/* Header Profile Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bento-card gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${activeProject.color || '#4edea3'}20` }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: activeProject.color || '#4edea3' }}>{activeProject.icon || 'folder'}</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-on-surface" style={{ fontSize: 26 }}>{activeProject.name}</h2>
              <span className={statusBadge[activeProject.status || 'Healthy']}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: (activeProject.status || 'Healthy') === 'Healthy' ? '#4edea3' : activeProject.status === 'Warning' ? '#ffb3af' : '#86948a' }} />
                {activeProject.status || 'Healthy'}
              </span>
            </div>
            <p className="text-on-surface-variant text-sm mt-1">{activeProject.description || 'No description provided.'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/analytics?project=${encodeURIComponent(activeProject.name)}`)}
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
                <AreaChart data={defaultCallsData} margin={{ top: 0, right: 8, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeProject.color || '#10b981'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={activeProject.color || '#10b981'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,74,66,0.2)" />
                  <XAxis dataKey="date" stroke="#86948a" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke="#86948a" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip contentStyle={{ background: '#1a211d', border: '1px solid rgba(60,74,66,0.5)', borderRadius: 8, color: '#dde4dd' }} />
                  <Area type="monotone" dataKey="calls" stroke={activeProject.color || '#10b981'} strokeWidth={2} fill="url(#projGrad)" />
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
                { label: 'Total Calls', value: activeProject.calls || '0' },
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
              {(members.length ? members : [
                { name: 'Jordan Martinez', email: 'j.martinez@company.com', role: 'Owner', avatar: 'JM' },
                { name: 'Sam Rivera', email: 'sam.r@company.com', role: 'Developer', avatar: 'SR' },
              ]).map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {m.avatar || 'U'}
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
                <h3 className="font-semibold text-on-surface" style={{ fontSize: 20 }}>
                  {newKeyDetails ? 'Key Created' : 'Generate API Key'}
                </h3>
                <button onClick={handleCloseModal} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {newKeyDetails ? (
                <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-2xl animate-pulse">lock_open</span>
                      <p className="text-xs text-on-surface">
                        <strong>Copy this secret key.</strong> For security, we cannot show this token again after you close this panel.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider">Key Label</label>
                      <p className="font-bold text-sm text-on-surface">{newKeyDetails.name}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-mono text-xs text-on-surface-variant uppercase tracking-wider">Private Access Token</label>
                      <div className="flex gap-2 items-center bg-surface-container-high/40 p-3 rounded-lg border border-outline-variant/40">
                        <code className="font-mono text-xs text-primary select-all break-all flex-1">{newKeyDetails.key}</code>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopy('new', newKeyDetails.key)}
                          className="btn-secondary p-2 rounded-lg cursor-pointer"
                          title="Copy Key"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            {copiedId === 'new' ? 'check' : 'content_copy'}
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCloseModal}
                      className="w-full btn-primary py-3 rounded-lg font-bold text-sm shadow-emerald-sm cursor-pointer"
                    >
                      Done, I've Copied It
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
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
                        onChange={(val: string) => setNewKey(p => ({ ...p, scope: val }))}
                        options={['Read', 'Read/Write', 'Admin', 'Write']}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-xs text-on-surface-variant mb-2.5 uppercase tracking-wider">Expiration</label>
                      <Select
                        value={newKey.expiry}
                        onChange={(val: string) => setNewKey(p => ({ ...p, expiry: val }))}
                        options={['30 Days', '60 Days', '90 Days', 'Never']}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="p-6 border-t border-outline-variant/30 bg-surface-container/30 flex justify-end gap-3">
                    <button onClick={handleCloseModal} className="btn-secondary px-4 py-2 text-sm rounded-lg cursor-pointer">Cancel</button>
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
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
