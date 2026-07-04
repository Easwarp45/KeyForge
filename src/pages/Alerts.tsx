import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type Alert = {
  id: number;
  type: 'expiry' | 'quota' | 'security' | 'rotation';
  title: string;
  message: string;
  keyName: string;
  time: string;
  severity: 'critical' | 'warning' | 'info';
  read: boolean;
};

const initialAlerts: Alert[] = [];

const severityConfig = {
  critical: { icon: 'error', color: 'text-error', bg: 'bg-error/10 border-error/20', dot: '#ffb4ab' },
  warning: { icon: 'warning', color: 'text-tertiary', bg: 'bg-tertiary/10 border-tertiary/20', dot: '#ffb3af' },
  info: { icon: 'info', color: 'text-primary', bg: 'bg-primary/5 border-primary/15', dot: '#4edea3' },
};

const typeIcon: Record<string, string> = {
  expiry: 'schedule',
  security: 'security',
  quota: 'speed',
  rotation: 'sync',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.22 } } };

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const markAllRead = () => {
    setAlerts(a => a.map(al => ({ ...al, read: true })));
    showToast('All alerts marked as read');
  };

  const dismiss = (id: number) => {
    setAlerts(a => a.filter(al => al.id !== id));
    showToast('Alert dismissed');
  };

  const markRead = (id: number) => {
    setAlerts(a => a.map(al => al.id === id ? { ...al, read: true } : al));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAction = (alert: Alert) => {
    if (alert.type === 'expiry') {
      // Simulate rotation action
      markRead(alert.id);
      showToast(`Key "${alert.keyName}" rotated successfully!`);
      // Optionally navigate to keys page after short delay
      setTimeout(() => navigate(`/keys?search=${alert.keyName}`), 1000);
    } else if (alert.type === 'security') {
      navigate(`/analytics`);
    } else {
      markRead(alert.id);
      showToast(`Alert resolved`);
    }
  };

  const filtered = filter === 'All' 
    ? alerts 
    : filter === 'Unread' 
      ? alerts.filter(a => !a.read) 
      : alerts.filter(a => a.severity === filter.toLowerCase());

  const unread = alerts.filter(a => !a.read).length;

  return (
    <div className="max-w-[1440px] mx-auto relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-bold text-on-surface flex items-center gap-3" style={{ fontSize: 32, lineHeight: 1.2 }}>
            Alerts
            {unread > 0 && (
              <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-error/20 text-error border border-error/30">{unread}</span>
            )}
          </h2>
          <p className="text-on-surface-variant mt-1 text-sm">Stay on top of key expiry, quota limits, and security events.</p>
        </div>
        <button onClick={markAllRead} className="btn-secondary px-4 py-2 text-sm rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>done_all</span>
          Mark All Read
        </button>
      </div>

      {/* Summary cards (Interactive for filtering) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Critical', count: alerts.filter(a => a.severity === 'critical').length, color: 'text-error', bg: 'bg-error/10 border-error/20', filterVal: 'Critical' },
          { label: 'Warning', count: alerts.filter(a => a.severity === 'warning').length, color: 'text-tertiary', bg: 'bg-tertiary/10 border-tertiary/20', filterVal: 'Warning' },
          { label: 'Info', count: alerts.filter(a => a.severity === 'info').length, color: 'text-primary', bg: 'bg-primary/10 border-primary/20', filterVal: 'Info' },
          { label: 'Unread', count: unread, color: 'text-secondary', bg: 'bg-secondary-container/20 border-secondary/20', filterVal: 'Unread' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setFilter(s.filterVal)}
            className={`bento-card p-4 border ${s.bg} flex items-center gap-3 text-left w-full transition-all duration-200 hover:scale-[1.02] ${filter === s.filterVal ? 'ring-1 ring-primary' : ''}`}
          >
            <span className={`font-black text-3xl ${s.color}`}>{s.count}</span>
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">{s.label} Alerts</span>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['All', 'Unread', 'Critical', 'Warning', 'Info'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-primary-container text-on-primary-container shadow-emerald-sm' : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/30'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
        <AnimatePresence>
          {filtered.map(alert => {
            const cfg = severityConfig[alert.severity];
            return (
              <motion.div
                key={alert.id}
                variants={item}
                layout
                exit={{ opacity: 0, x: 20, height: 0 }}
                className={`bento-card p-5 flex gap-4 items-start border ${cfg.bg} ${!alert.read ? 'opacity-100' : 'opacity-70'}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.dot}20` }}
                >
                  <span className={`material-symbols-outlined ${cfg.color}`} style={{ fontSize: 22 }}>{typeIcon[alert.type]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-semibold text-sm ${cfg.color}`}>{alert.title}</span>
                    {!alert.read && <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: cfg.dot }} />}
                  </div>
                  <p className="text-on-surface-variant text-sm">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <code className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{alert.keyName}</code>
                    <span className="font-mono text-xs text-on-surface-variant">{alert.time}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {alert.severity !== 'info' && (
                    <button
                      className="btn-primary px-3 py-1.5 text-xs rounded-lg"
                      onClick={() => handleAction(alert)}
                    >
                      {alert.type === 'expiry' ? 'Rotate Now' : 'Investigate'}
                    </button>
                  )}
                  <button
                    onClick={() => dismiss(alert.id)}
                    className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-error/10 transition-all"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="bento-card p-12 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 48 }}>notifications_off</span>
            <p className="text-on-surface-variant">No alerts in this category.</p>
          </div>
        )}
      </motion.div>

      {/* Toast feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-[200] bg-surface-container-high border border-outline-variant/30 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>info</span>
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
