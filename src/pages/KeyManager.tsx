import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from '../components/Select';
import { getProjects, getKeys, generateKey, rotateKey, updateKeyStatus, revokeKey, type ApiKey, type Project } from '../api';

const scopeColor: Record<string, string> = {
  Admin: 'bg-error/10 text-error border-error/20',
  Read: 'bg-surface-variant text-on-surface-variant border-outline-variant/50',
  'Read/Write': 'bg-primary/10 text-primary border-primary/20',
  Write: 'bg-secondary/10 text-secondary border-secondary/20',
};

const MASK = '••••••••••••••••';

export default function KeyManager() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'Active' | 'All'>('Active');
  const [filterProject, setFilterProject] = useState('All Projects');
  const [filterScope, setFilterScope] = useState('Any Scope');
  const [revealedKeys, setRevealedKeys] = useState<Set<string | number>>(new Set());
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [rotatingId, setRotatingId] = useState<string | number | null>(null);
  
  const [newKeyDetails, setNewKeyDetails] = useState<ApiKey | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showSearch, setShowSearch] = useState(!!searchParams.get('search'));
  
  const [newKey, setNewKey] = useState({ name: '', projectId: '', scope: 'Read/Write', expiry: '30 Days' });

  useEffect(() => {
    Promise.all([getProjects(), getKeys()])
      .then(([projData, keyData]) => {
        setProjects(projData);
        setKeys(keyData);
        if (projData.length > 0) {
          setNewKey(p => ({ ...p, projectId: projData[0].id }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
    if (q) setShowSearch(true);
  }, [searchParams]);

  /* ── Actions ─────────────────────────────────────────── */
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
        setNewKeyDetails(updated);
        setShowModal(true);
        setKeys(prev => prev.map(k => k.id === idVal ? { ...k, key: updated.key } : k));
      })
      .catch(console.error)
      .finally(() => setRotatingId(null));
  };

  const handleCreate = () => {
    if (!newKey.projectId || !newKey.name.trim()) return;
    generateKey({
      name: newKey.name,
      projectId: newKey.projectId,
      scope: newKey.scope,
      expiry: newKey.expiry
    })
      .then(createdKey => {
        setKeys(prev => [createdKey, ...prev]);
        setNewKeyDetails(createdKey);
        setNewKey(p => ({ ...p, name: '' }));
      })
      .catch(console.error);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewKeyDetails(null);
  };

  const handleExport = () => {
    const rows = ['Name,Key,Project,Scope,Expiry,Status', ...keys.map(k => {
      const pName = projects.find(p => p.id === k.project_id)?.name || 'General';
      return `${k.name},${k.key},${pName},${k.scope},${k.expiry},${k.status}`;
    })].join('\n');
    const a = document.createElement('a'); a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(rows)}`; a.download = 'api-keys.csv'; a.click();
  };

  /* ── Filtering ────────────────────────────────────────── */
  const displayed = keys
    .filter(k => filterStatus === 'All' || k.status === 'Active')
    .filter(k => filterProject === 'All Projects' || k.project_id === filterProject)
    .filter(k => filterScope === 'Any Scope' || k.scope === filterScope)
    .filter(k => {
      const pName = (projects.find(p => p.id === k.project_id)?.name || 'General').toLowerCase();
      return !search || k.name.toLowerCase().includes(search.toLowerCase()) || pName.includes(search.toLowerCase());
    });

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-bold text-on-surface" style={{ fontSize: 32, lineHeight: 1.2 }}>Key Manager</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Manage API keys, scopes, and rotations.</p>
        </div>
        <div className="flex gap-3 items-center">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="btn-secondary px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="btn-primary px-4 py-2.5 text-sm font-semibold shadow-emerald-sm rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Create New Key
          </motion.button>
        </div>
      </div>

      {/* Security Guarantee Banner */}
      <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3 items-center">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        <div className="text-xs">
          <p className="font-semibold text-primary">Unbreachable Architecture & Key Protection Enabled</p>
          <p className="text-on-surface-variant mt-0.5">
            KeyForge employs <strong>Hash-on-Write</strong>. Raw private keys are cryptographically hashed using SHA-256 before database storage. 
            Once generated, the secret values are never displayed again or exposed to anyone—including administrators. Firewalls restrict query contexts dynamically.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="p-5 border-b border-outline-variant/30 flex flex-wrap gap-3 items-center justify-between bg-surface-container-high/20 z-10 relative">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            {/* Custom Project Select */}
            <Select
              value={filterProject}
              onChange={setFilterProject}
              options={['All Projects', ...projects.map(p => ({ value: p.id, label: p.name }))] }
              className="min-w-[170px]"
            />

            {/* Custom Scope Select */}
            <Select
              value={filterScope}
              onChange={setFilterScope}
              options={['Any Scope', 'Read', 'Read/Write', 'Admin', 'Write']}
              className="min-w-[140px]"
            />

            {/* Status toggle */}
            <div className="flex items-center gap-1 bg-surface-variant/40 rounded-lg p-1 border border-outline-variant/30">
              {(['Active', 'All'] as const).map(f => (
                <motion.button
                  key={f}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${filterStatus === f ? 'bg-surface-bright text-on-surface shadow font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {f}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Search toggle */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {showSearch && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  type="text"
                  placeholder="Search keys..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="glass-input px-3 py-1.5 text-sm"
                  autoFocus
                />
              )}
            </AnimatePresence>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch(''); }}
              className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showSearch ? 'close' : 'search'}</span>
            </motion.button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container/30">
                {['Name', 'Secret Key', 'Project', 'Scope', 'Expiry', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`p-4 font-mono text-xs text-on-surface-variant uppercase tracking-widest ${i === 6 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-outline-variant/20">
              <AnimatePresence>
                {displayed.map(k => (
                  <motion.tr
                    key={k.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.18 }}
                    className="table-row-hover group"
                  >
                    <td className="p-4">
                      <div className="font-medium text-on-surface">{k.name}</div>
                      <div className="text-on-surface-variant text-xs mt-0.5">Created {k.created}</div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2 group/key">
                        <code className="font-mono text-sm text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 select-all">
                          {revealedKeys.has(k.id) ? k.key : `${k.key.slice(0, 8)}${MASK.slice(0, 8)}`}
                        </code>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleReveal(k.id)}
                          className="text-on-surface-variant opacity-0 group-hover/key:opacity-100 hover:text-primary transition-all p-1 cursor-pointer"
                          title={revealedKeys.has(k.id) ? 'Hide key' : 'Reveal key'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            {revealedKeys.has(k.id) ? 'visibility_off' : 'visibility'}
                          </span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopy(k.id, k.key)}
                          className="text-on-surface-variant opacity-0 group-hover/key:opacity-100 hover:text-primary transition-all p-1 cursor-pointer"
                          title="Copy to clipboard"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            {copiedId === k.id ? 'check' : 'content_copy'}
                          </span>
                        </motion.button>
                      </div>
                    </td>

                    <td className="p-4 text-on-surface-variant text-sm">
                      {projects.find(p => p.id === k.project_id)?.name || 'General'}
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${scopeColor[k.scope] ?? ''}`}>
                        {k.scope}
                      </span>
                    </td>

                    <td className="p-4 text-sm text-on-surface-variant">
                      {k.expiry}
                    </td>

                    <td className="p-4">
                      {k.status === 'Active' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-sm">Active</span>
                        </div>
                      ) : k.status === 'Disabled' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-outline" />
                          <span className="text-on-surface-variant text-sm">Disabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-error" />
                          <span className="text-error text-sm">{k.status}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Rotate */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRotate(k.id)}
                          disabled={rotatingId === k.id || k.status !== 'Active'}
                          className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-surface-variant rounded-md transition-colors disabled:opacity-40 cursor-pointer"
                          title="Rotate key"
                        >
                          <span
                            className={`material-symbols-outlined ${rotatingId === k.id ? 'animate-spin' : ''}`}
                            style={{ fontSize: 18 }}
                          >
                            sync
                          </span>
                        </motion.button>
                        {/* Enable / Disable */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDisable(k.id)}
                          disabled={k.status === 'Revoked'}
                          className="p-1.5 text-on-surface-variant hover:text-tertiary hover:bg-surface-variant rounded-md transition-colors disabled:opacity-40 cursor-pointer"
                          title={k.status === 'Active' ? 'Disable key' : 'Enable key'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            {k.status === 'Active' ? 'block' : 'check_circle'}
                          </span>
                        </motion.button>
                        {/* Delete */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(k.id)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-md transition-colors cursor-pointer"
                          title="Delete key"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-on-surface-variant font-mono text-sm">
                    <span className="material-symbols-outlined animate-spin align-middle mr-2" style={{ fontSize: 20 }}>progress_activity</span>
                    Loading credentials...
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined block mb-2" style={{ fontSize: 40 }}>search_off</span>
                    No keys match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-low/30">
          <span className="text-on-surface-variant text-sm">
            {displayed.length} of {keys.length} keys
          </span>
          <button
            onClick={() => navigate('/analytics')}
            className="text-xs text-primary hover:underline font-mono flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>leaderboard</span>
            View usage analytics →
          </button>
        </div>
      </div>

      {/* ── Create Key Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex"
          >
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(9,16,12,0.85)', backdropFilter: 'blur(8px)' }}
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-outline-variant/40 shadow-2xl flex flex-col z-[110]"
            >
              <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/50">
                <h3 className="font-semibold text-on-surface" style={{ fontSize: 22 }}>
                  {newKeyDetails ? 'Key Created' : 'Create New Key'}
                </h3>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCloseModal}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </motion.button>
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
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

                    {/* Key Name */}
                    <div>
                      <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Key Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Production Billing"
                        value={newKey.name}
                        onChange={e => setNewKey(p => ({ ...p, name: e.target.value }))}
                        className="glass-input w-full px-3 py-2.5 text-sm"
                        autoFocus
                      />
                      <p className="text-xs text-on-surface-variant mt-1.5">A descriptive name to identify this key.</p>
                    </div>

                    {/* Project */}
                    <div>
                      <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Project</label>
                      <Select
                        value={newKey.projectId}
                        onChange={val => setNewKey(p => ({ ...p, projectId: val }))}
                        options={projects.map(p => ({ value: p.id, label: p.name }))}
                        className="w-full"
                      />
                    </div>

                    {/* Scope */}
                    <div>
                      <label className="block font-mono text-xs text-on-surface-variant mb-3 uppercase tracking-wider">Permissions Scope</label>
                      <div className="space-y-2">
                        {[
                          { value: 'Read', label: 'Read Only', desc: 'Can only retrieve data, no modifications.' },
                          { value: 'Read/Write', label: 'Read / Write', desc: 'Standard access for most integrations.' },
                          { value: 'Write', label: 'Write Only', desc: 'Can write data but not retrieve.' },
                          { value: 'Admin', label: 'Admin Access', desc: 'Full destructive capabilities. Use with caution.', danger: true },
                        ].map(opt => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-surface-variant/20 ${
                              newKey.scope === opt.value
                                ? opt.danger ? 'border-error/50 bg-error/5' : 'border-primary/40 bg-primary/5'
                                : 'border-outline-variant/30'
                            }`}
                          >
                            <input
                              type="radio"
                              name="scope"
                              value={opt.value}
                              checked={newKey.scope === opt.value}
                              onChange={() => setNewKey(p => ({ ...p, scope: opt.value }))}
                              className="accent-emerald-500"
                            />
                            <div>
                              <div className={`font-medium text-sm ${opt.danger ? 'text-error' : newKey.scope === opt.value ? 'text-primary' : 'text-on-surface'}`}>
                                {opt.label}
                              </div>
                              <div className="text-on-surface-variant text-xs mt-0.5">{opt.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Expiry */}
                    <div>
                      <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Expiration</label>
                      <Select
                        value={newKey.expiry}
                        onChange={val => setNewKey(p => ({ ...p, expiry: val }))}
                        options={['30 Days', '60 Days', '90 Days', '1 Year', 'Never (Not Recommended)']}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="p-6 border-t border-outline-variant/30 bg-surface-container/30 flex justify-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCloseModal}
                      className="btn-secondary px-4 py-2 text-sm rounded-lg cursor-pointer"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreate}
                      disabled={!newKey.name.trim()}
                      className="btn-primary px-5 py-2 text-sm shadow-emerald-sm rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>key</span>
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
