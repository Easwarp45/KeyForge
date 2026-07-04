import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Select from '../components/Select';
import { getTeam, inviteMember, updateMember, removeMember, type TeamMember } from '../api';

const roleColors: Record<string, string> = {
  Owner: 'text-error bg-error/10 border-error/20',
  Admin: 'text-secondary bg-secondary-container/20 border-secondary/20',
  Developer: 'text-primary bg-primary/10 border-primary/20',
  'Read Only': 'text-on-surface-variant bg-surface-variant border-outline-variant/30',
};

const avatarColors = ['bg-primary-container', 'bg-secondary-container', 'bg-tertiary-container', 'bg-surface-bright', 'bg-primary/30'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Developer' | 'Admin' | 'Read Only'>('Developer');
  const [name, setName] = useState('');
  const [filter, setFilter] = useState<'All' | 'Admin' | 'Developer' | 'Invited'>('All');

  // Edit states
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<'Owner' | 'Admin' | 'Developer' | 'Read Only'>('Developer');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    getTeam()
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    inviteMember(name, email, role)
      .then(newMember => {
        setMembers(prev => [...prev, newMember]);
        setShowInvite(false);
        setEmail('');
        setName('');
      })
      .catch(console.error);
  };

  const handleDelete = (idVal: string | number) => {
    removeMember(idVal)
      .then(() => {
        setMembers(prev => prev.filter(m => m.id !== idVal));
      })
      .catch(console.error);
  };

  const handleEditClick = (member: TeamMember) => {
    setEditingMember(member);
    setEditRole(member.role);
    setEditName(member.name);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) return;

    updateMember(editingMember.id, { name: editName, role: editRole })
      .then(updated => {
        setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, name: updated.name, role: updated.role } : m));
        setEditingMember(null);
      })
      .catch(console.error);
  };

  const filteredMembers = members.filter(m => {
    if (filter === 'All') return true;
    if (filter === 'Admin') return m.role === 'Admin' || m.role === 'Owner';
    if (filter === 'Developer') return m.role === 'Developer';
    if (filter === 'Invited') return m.status === 'Invited';
    return true;
  });

  return (
    <div className="max-w-[1440px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-bold text-on-surface" style={{ fontSize: 32, lineHeight: 1.2 }}>Team</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Manage team members and their API key permissions.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowInvite(true)}
          className="btn-primary px-4 py-2.5 text-sm font-semibold shadow-emerald-sm cursor-pointer rounded-lg"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          Invite Member
        </motion.button>
      </div>

      {/* Stats (Interactive filters) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Members', value: members.length, icon: 'group', filterVal: 'All' as const },
          { label: 'Admins & Owners', value: members.filter(m => m.role === 'Admin' || m.role === 'Owner').length, icon: 'admin_panel_settings', color: 'text-error', filterVal: 'Admin' as const },
          { label: 'Developers', value: members.filter(m => m.role === 'Developer').length, icon: 'code', color: 'text-primary', filterVal: 'Developer' as const },
          { label: 'Pending Invites', value: members.filter(m => m.status === 'Invited').length, icon: 'mail', color: 'text-secondary', filterVal: 'Invited' as const },
        ].map(s => (
          <motion.button
            key={s.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilter(s.filterVal)}
            className={`bento-card p-5 flex items-center gap-4 text-left w-full transition-all duration-200 cursor-pointer ${filter === s.filterVal ? 'ring-1 ring-primary' : ''}`}
          >
            <span className={`material-symbols-outlined ${s.color ?? 'text-outline'}`} style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">{s.label}</p>
              <p className="font-black text-on-surface mt-0.5" style={{ fontSize: 28 }}>{s.value}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Members list */}
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="py-12 text-center text-on-surface-variant font-mono text-sm">
              <span className="material-symbols-outlined animate-spin align-middle mr-2" style={{ fontSize: 20 }}>progress_activity</span>
              Loading team directory...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-mono text-sm">
              No team members found matching your filters.
            </div>
          ) : filteredMembers.map((m, i) => (
            <motion.div
              key={m.id}
              variants={item}
              layout
              exit={{ opacity: 0, x: -50 }}
              className="bento-card p-5 flex items-center gap-4"
            >
              <div className={`w-11 h-11 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0`}>
                {m.avatar}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-on-surface text-sm">{m.name}</p>
                  {m.status === 'Invited' && (
                    <span className="font-mono text-[10px] text-on-surface-variant bg-surface-variant border border-outline-variant/30 px-1.5 py-0.5 rounded uppercase tracking-wider">Pending</span>
                  )}
                </div>
                <p className="text-on-surface-variant text-xs mt-0.5">{m.email}</p>
              </div>

              <div className="hidden md:flex items-center gap-6">
                <div className="text-right">
                  <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Keys</p>
                  <p className="font-bold text-on-surface text-sm mt-0.5">{m.keys}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Since</p>
                  <p className="font-mono text-xs text-on-surface mt-0.5">{m.joined}</p>
                </div>
              </div>

              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border flex-shrink-0 ${roleColors[m.role] ?? ''}`}>
                {m.role}
              </span>

              <div className="flex gap-1 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEditClick(m)}
                  className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-md transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                </motion.button>
                {m.role !== 'Owner' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-md transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_remove</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0" style={{ background: 'rgba(9,16,12,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setShowInvite(false)} />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="relative z-10 w-full max-w-md bg-surface border border-outline-variant/40 rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleInviteSubmit}>
                <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/50">
                  <h3 className="font-semibold text-on-surface" style={{ fontSize: 20 }}>Invite Team Member</h3>
                  <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setShowInvite(false)} className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                  </motion.button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="glass-input w-full px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="glass-input w-full px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Role</label>
                    <Select
                      value={role}
                      onChange={val => setRole(val as any)}
                      options={['Developer', 'Admin', 'Read Only']}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant">They'll receive an email invitation to join your KeyForge workspace.</p>
                </div>
                <div className="p-6 border-t border-outline-variant/30 bg-surface-container/30 flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="btn-secondary px-4 py-2 text-sm rounded-lg cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="btn-primary px-5 py-2 text-sm rounded-lg shadow-emerald-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
                    Send Invite
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingMember && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0" style={{ background: 'rgba(9,16,12,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setEditingMember(null)} />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
              className="relative z-10 w-full max-w-md bg-surface border border-outline-variant/40 rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSaveEdit}>
                <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/50">
                  <h3 className="font-semibold text-on-surface" style={{ fontSize: 20 }}>Edit Team Member</h3>
                  <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setEditingMember(null)} className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">close</span>
                  </motion.button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Jane Doe"
                      className="glass-input w-full px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">Role</label>
                    <Select
                      value={editRole}
                      disabled={editingMember.role === 'Owner'}
                      onChange={val => setEditRole(val as any)}
                      options={['Owner', 'Admin', 'Developer', 'Read Only']}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-outline-variant/30 bg-surface-container/30 flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="btn-secondary px-4 py-2 text-sm rounded-lg cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="btn-primary px-5 py-2 text-sm rounded-lg shadow-emerald-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                    Save Changes
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
