import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Project = {
  id: number; name: string; description: string; keys: number;
  calls: string; status: 'Healthy' | 'Warning' | 'Inactive';
  updated: string; icon: string; color: string;
};

const initialProjects: Project[] = [
  { id: 1, name: 'Payment Gateway', description: 'Handles all payment processing and billing APIs.', keys: 14, calls: '2.4M', status: 'Healthy', updated: '2 hours ago', icon: 'payments', color: '#10b981' },
  { id: 2, name: 'User Auth Service', description: 'Authentication and session management APIs.', keys: 8, calls: '890K', status: 'Healthy', updated: '5 hours ago', icon: 'lock', color: '#d0bcff' },
  { id: 3, name: 'Data Pipeline', description: 'ETL and data transformation services.', keys: 6, calls: '340K', status: 'Warning', updated: '1 day ago', icon: 'storage', color: '#ffb3af' },
  { id: 4, name: 'Phoenix Engine', description: 'Core API orchestration and routing layer.', keys: 22, calls: '5.1M', status: 'Healthy', updated: '30 min ago', icon: 'hub', color: '#10b981' },
  { id: 5, name: 'CyberVault Auth', description: 'Enterprise identity and access management.', keys: 11, calls: '1.2M', status: 'Healthy', updated: '1 hour ago', icon: 'shield', color: '#4edea3' },
  { id: 6, name: 'Nexus Data Hub', description: 'Centralized data lake integration APIs.', keys: 5, calls: '78K', status: 'Inactive', updated: '3 days ago', icon: 'cloud', color: '#86948a' },
];

const statusBadge: Record<string, string> = {
  Healthy: 'badge-active',
  Warning: 'badge-warning',
  Inactive: 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border text-on-surface-variant bg-surface-variant border-outline-variant/30',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function Projects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Healthy' | 'Warning' | 'Inactive'>('All');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const filtered = projects
    .filter(p => statusFilter === 'All' || p.status === statusFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));

  const handleCreateProject = () => {
    if (!newName.trim()) return;
    setProjects(prev => [...prev, {
      id: Date.now(), name: newName, description: newDesc || 'No description provided.',
      keys: 0, calls: '0', status: 'Healthy', updated: 'Just now', icon: 'folder', color: '#4edea3',
    }]);
    setShowNewModal(false); setNewName(''); setNewDesc('');
  };

  const handleDeleteProject = (id: number) => setProjects(prev => prev.filter(p => p.id !== id));

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-bold text-on-surface" style={{ fontSize: 32, lineHeight: 1.2 }}>Projects</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Organize your API keys by project and team.</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input pl-9 pr-4 py-2 text-sm rounded-lg w-52 focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/onboarding')}
            className="btn-primary px-4 py-2 text-sm font-semibold shadow-emerald-sm rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            New Project
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Projects', value: projects.length, icon: 'folder', filter: 'All' as const },
          { label: 'Healthy', value: projects.filter(p => p.status === 'Healthy').length, icon: 'check_circle', color: 'text-primary', filter: 'Healthy' as const },
          { label: 'Warnings', value: projects.filter(p => p.status === 'Warning').length, icon: 'warning', color: 'text-tertiary', filter: 'Warning' as const },
          { label: 'Total Keys', value: projects.reduce((a, p) => a + p.keys, 0), icon: 'vpn_key', color: 'text-secondary', filter: 'All' as const },
        ].map(s => (
          <motion.button
            key={s.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter(s.filter)}
            className={`bento-card p-5 flex items-center gap-4 text-left w-full transition-all cursor-pointer ${statusFilter === s.filter ? 'border-primary/40' : ''}`}
          >
            <span className={`material-symbols-outlined ${s.color ?? 'text-outline'}`} style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">{s.label}</p>
              <p className="font-black text-on-surface mt-0.5" style={{ fontSize: 28 }}>{s.value}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 mb-6">
        {(['All', 'Healthy', 'Warning', 'Inactive'] as const).map(f => (
          <motion.button
            key={f}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              statusFilter === f ? 'bg-primary-container text-on-primary-container font-semibold shadow-emerald-sm' : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
            }`}
          >
            {f}
          </motion.button>
        ))}
      </div>

      {/* Project grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-bento-gap">
        <AnimatePresence>
          {filtered.map(p => (
            <motion.div
              key={p.id}
              variants={item}
              layout
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="bento-card p-6 flex flex-col gap-4 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${p.color}20` }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: p.color }}>{p.icon}</span>
                </div>
                <span className={statusBadge[p.status]}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: p.status === 'Healthy' ? '#4edea3' : p.status === 'Warning' ? '#ffb3af' : '#86948a' }} />
                  {p.status}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-on-surface" style={{ fontSize: 18 }}>{p.name}</h3>
                <p className="text-on-surface-variant text-sm mt-1 line-clamp-2">{p.description}</p>
              </div>

              <div className="flex gap-6 border-t border-outline-variant/20 pt-4">
                <div>
                  <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Keys</p>
                  <p className="font-bold text-on-surface mt-0.5">{p.keys}</p>
                </div>
                <div>
                  <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">API Calls</p>
                  <p className="font-bold text-on-surface mt-0.5">{p.calls}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Updated</p>
                  <p className="font-mono text-xs text-on-surface-variant mt-0.5">{p.updated}</p>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {expandedId === p.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-outline-variant/20 pt-3"
                  >
                    <p className="text-xs text-on-surface-variant mb-2">Actions</p>
                    <div className="flex gap-2 flex-wrap">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); navigate('/keys'); }} className="btn-secondary text-xs px-3 py-1.5 rounded-lg cursor-pointer">View Keys</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); navigate(`/analytics?project=${encodeURIComponent(p.name)}`); }} className="btn-secondary text-xs px-3 py-1.5 rounded-lg cursor-pointer">Analytics</motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                        className="text-xs px-3 py-1.5 rounded-lg text-error border border-error/20 hover:bg-error/10 transition-colors cursor-pointer"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}`); }}
                  className="btn-secondary flex-1 py-1.5 text-xs rounded-lg cursor-pointer animate-pulse-subtle"
                >
                  View Details
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === p.id ? null : p.id); }}
                  className="btn-secondary px-3 py-1.5 text-xs rounded-lg cursor-pointer"
                  title="More actions"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {expandedId === p.id ? 'expand_less' : 'more_vert'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* New project card */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.01 }}
          onClick={() => navigate('/onboarding')}
          className="bento-card p-6 flex flex-col items-center justify-center gap-3 border-dashed cursor-pointer min-h-[220px] opacity-50 hover:opacity-100 transition-opacity hover:border-primary/40"
        >
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 28 }}>add</span>
          </div>
          <p className="text-on-surface-variant font-medium text-sm">Create New Project</p>
        </motion.div>
      </motion.div>

      {/* ── New Project Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0" style={{ background: 'rgba(9,16,12,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setShowNewModal(false)} />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="relative z-10 w-full max-w-md bg-surface border border-outline-variant/40 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/50">
                <h3 className="font-semibold text-on-surface" style={{ fontSize: 20 }}>New Project</h3>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowNewModal(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </motion.button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Project Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Mobile Backend"
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Describe the project's purpose..."
                    rows={3}
                    className="glass-input w-full px-3 py-2.5 text-sm resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-outline-variant/30 bg-surface-container/30 flex justify-end gap-3">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowNewModal(false)} className="btn-secondary px-4 py-2 text-sm rounded-lg cursor-pointer">Cancel</motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreateProject}
                  disabled={!newName.trim()}
                  className="btn-primary px-5 py-2 text-sm rounded-lg shadow-emerald-sm disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
                  Create Project
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
