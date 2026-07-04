import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Search resources...',
  '/keys': 'Search keys, projects...',
  '/projects': 'Search projects...',
  '/analytics': 'Search analytics, logs...',
  '/reports': 'Search reports...',
  '/alerts': 'Search alerts...',
  '/audits': 'Search audits...',
  '/team': 'Search members...',
  '/settings': 'Search settings...',
};

type Notification = { id: number; title: string; body: string; time: string; read: boolean };

const initialNotifs: Notification[] = [
  { id: 1, title: 'Key Expiring Soon', body: 'prod_eu_gateway expires in 2 days.', time: '5 min ago', read: false },
  { id: 2, title: 'Anomalous Traffic', body: 'Spike detected on PROD_AUTH_MAIN.', time: '23 min ago', read: false },
  { id: 3, title: 'Rotation Completed', body: 'analytics_read_v2 rotated successfully.', time: '1 hr ago', read: true },
];

export default function TopBar() {
  const [query, setQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(initialNotifs);
  const [showProfile, setShowProfile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const placeholder = pageTitles[location.pathname] ?? 'Search...';
  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const dismiss = (id: number) => setNotifs(n => n.filter(x => x.id !== id));

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const q = query.trim();
      const routeMap: Record<string, string> = {
        '/projects': `/projects?search=${encodeURIComponent(q)}`,
        '/keys': `/keys?search=${encodeURIComponent(q)}`,
      };
      const targetRoute = routeMap[location.pathname] || `/keys?search=${encodeURIComponent(q)}`;
      navigate(targetRoute);
    }
  };

  return (
    <header className="h-16 sticky top-0 z-40 bg-background/50 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-8 w-full flex-shrink-0">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-64 max-w-sm hidden md:block group">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors"
            style={{ fontSize: 20 }}
          >
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder={placeholder}
            className="w-full bg-surface-container-high/30 border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-full pl-10 pr-4 py-1.5 text-sm transition-all outline-none text-on-surface placeholder:text-on-surface-variant/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifs(s => !s); setShowProfile(false); }}
            className="relative text-on-surface-variant hover:bg-surface-variant/50 rounded-full p-2 transition-all"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-background animate-pulse flex items-center justify-center">
                <span className="text-[7px] font-bold text-white leading-none">{unread}</span>
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          <AnimatePresence>
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 z-50 bg-surface border border-outline-variant/40 rounded-xl shadow-2xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-outline-variant/30 bg-surface-container/50 flex justify-between items-center">
                    <h4 className="font-semibold text-on-surface text-sm">Notifications</h4>
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {notifs.map(n => (
                      <div key={n.id} className={`p-4 border-b border-outline-variant/20 flex gap-3 group/notif hover:bg-surface-variant/10 transition-colors ${!n.read ? 'bg-primary/3' : ''}`}>
                        <div className="mt-0.5 flex-shrink-0">
                          <span className={`w-2 h-2 rounded-full inline-block ${!n.read ? 'bg-error' : 'bg-outline'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-on-surface text-sm font-medium">{n.title}</p>
                          <p className="text-on-surface-variant text-xs mt-0.5">{n.body}</p>
                          <p className="font-mono text-[10px] text-on-surface-variant/60 mt-1">{n.time}</p>
                        </div>
                        <button
                          onClick={() => dismiss(n.id)}
                          className="text-on-surface-variant opacity-0 group-hover/notif:opacity-100 hover:text-error transition-all p-0.5 rounded"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      </div>
                    ))}
                    {notifs.length === 0 && (
                      <div className="p-6 text-center text-on-surface-variant text-sm">All caught up! 🎉</div>
                    )}
                  </div>
                  <div className="px-4 py-2.5 border-t border-outline-variant/30 bg-surface-container/30">
                    <button
                      onClick={() => { navigate('/alerts'); setShowNotifs(false); }}
                      className="text-xs text-primary hover:underline w-full text-center font-mono"
                    >
                      View all alerts →
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(s => !s); setShowNotifs(false); }}
            className="flex items-center gap-3 pl-4 ml-2 border-l border-outline-variant/20"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-on-surface leading-none">DevMaster_01</p>
              <p className="text-[10px] text-on-surface-variant mt-1">Enterprise Admin</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-sm border border-outline-variant hover:border-primary transition-colors">
              D
            </div>
          </button>

          {/* Profile dropdown */}
          <AnimatePresence>
            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 z-50 bg-surface border border-outline-variant/40 rounded-xl shadow-2xl overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-outline-variant/30 bg-surface-container/50">
                    <p className="font-semibold text-on-surface text-sm">DevMaster_01</p>
                    <p className="text-xs text-on-surface-variant">devmaster@company.com</p>
                  </div>
                  {[
                    { icon: 'settings', label: 'Settings', action: () => navigate('/settings') },
                    { icon: 'group', label: 'Team', action: () => navigate('/team') },
                    { icon: 'description', label: 'Reports', action: () => navigate('/reports') },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setShowProfile(false); }}
                      className="nav-item w-full text-left px-4 py-2.5 rounded-none text-sm"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-outline-variant/30 mt-1">
                    <button
                      onClick={() => navigate('/')}
                      className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
