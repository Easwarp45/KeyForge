import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Select from '../components/Select';
import { getAudits, type AuditLog } from '../api';

const categoryIcons: Record<AuditLog['category'], string> = {
  'Key Operations': 'vpn_key',
  'Project Operations': 'folder',
  'Team Access': 'group',
  'System Settings': 'settings',
};

const severityBadges: Record<AuditLog['severity'], string> = {
  Success: 'badge-active',
  Warning: 'badge-warning',
  Revocation: 'badge-expired',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22 } } };

const PAGE_SIZE = 50;

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [exporting, setExporting] = useState(false);

  /**
   * WHY pagination: Previously the API returned ALL audit log rows and
   * AuditLogs.tsx rendered them all. With tens of thousands of entries, this
   * causes browser tab timeouts. Now we fetch 50 rows at a time and provide
   * Previous / Next controls, matching how real compliance dashboards work.
   */
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadPage = useCallback((pageNum: number) => {
    setLoading(true);
    getAudits(pageNum)
      .then(res => {
        setLogs(res.logs);
        setTotal(res.total);
        setHasMore(res.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  const handlePrev = () => {
    const prev = Math.max(0, page - 1);
    setPage(prev);
    loadPage(prev);
  };

  const handleNext = () => {
    const next = page + 1;
    setPage(next);
    loadPage(next);
  };

  const handleExport = () => {
    setExporting(true);
    const headers = 'ID,Action,Category,Actor Name,Actor Email,Target,IP Address,Location,Timestamp,Severity';
    const rows = logs.map(l =>
      `${l.id},"${l.action}","${l.category}","${l.actorName}","${l.actorEmail}","${l.target}","${l.ip}","${l.location}","${l.timestamp}","${l.severity}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'keyforge-audit-logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // release memory
    setTimeout(() => setExporting(false), 1200);
  };

  const filteredLogs = logs
    .filter(log => categoryFilter === 'All Categories' || log.category === categoryFilter)
    .filter(log => severityFilter === 'All Severities' || log.severity === severityFilter)
    .filter(log => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(term) ||
        log.actorName.toLowerCase().includes(term) ||
        log.actorEmail.toLowerCase().includes(term) ||
        log.target.toLowerCase().includes(term) ||
        log.ip.toLowerCase().includes(term)
      );
    });

  const from = page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-bold text-on-surface" style={{ fontSize: 32, lineHeight: 1.2 }}>Audit Logs</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Read-only historical trail of all administrative and cryptographic actions.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary px-4 py-2.5 text-sm font-semibold shadow-emerald-sm rounded-lg flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {exporting ? 'progress_activity' : 'download'}
          </span>
          {exporting ? 'Exporting...' : 'Export Audit Trail'}
        </motion.button>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3 items-center">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
        <div className="text-xs">
          <p className="font-semibold text-primary">Immutable Governance Rules Enabled</p>
          <p className="text-on-surface-variant mt-0.5">
            Audit logs are written directly to a write-once-read-many (WORM) PostgreSQL schema.
            Row-level UPDATE and DELETE queries are completely blocked at the database engine level via security triggers.
            Results are paginated to {PAGE_SIZE} rows per page for performance.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-xl p-5 flex flex-wrap gap-4 items-center justify-between bg-surface-container-high/20 z-10 relative">
        <div className="flex flex-wrap gap-3 items-center flex-grow md:flex-grow-0">
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={['All Categories', 'Key Operations', 'Project Operations', 'Team Access', 'System Settings']}
            className="min-w-[170px]"
          />
          <Select
            value={severityFilter}
            onChange={setSeverityFilter}
            options={['All Severities', 'Success', 'Warning', 'Revocation']}
            className="min-w-[150px]"
          />
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 18 }}>search</span>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input pl-9 pr-4 py-2 text-sm rounded-lg w-full focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container/30">
                {['Action', 'Target Identity', 'Actor', 'Metadata (IP / Region)', 'Timestamp', 'Status'].map((h, i) => (
                  <th key={h} className={`p-4 font-mono text-xs text-on-surface-variant uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody
              variants={container}
              initial="hidden"
              animate="show"
              className="text-sm divide-y divide-outline-variant/20"
            >
              <AnimatePresence mode="popLayout">
                {filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    variants={item}
                    layout
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="table-row-hover group"
                  >
                    {/* Action & Category */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/25 flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-lg">{categoryIcons[log.category]}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{log.action}</p>
                          <p className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant/80 mt-0.5">{log.category}</p>
                        </div>
                      </div>
                    </td>

                    {/* Target */}
                    <td className="p-4">
                      <code className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 select-all">
                        {log.target}
                      </code>
                    </td>

                    {/* Actor — now real identity, not hardcoded DevMaster_01 */}
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-on-surface text-sm">{log.actorName}</p>
                        <p className="text-on-surface-variant text-xs">{log.actorEmail}</p>
                      </div>
                    </td>

                    {/* IP & Location */}
                    <td className="p-4 font-mono text-xs text-on-surface-variant">
                      <div>{log.ip}</div>
                      <div className="text-[10px] text-on-surface-variant/70 mt-0.5">{log.location}</div>
                    </td>

                    {/* Timestamp */}
                    <td className="p-4 font-mono text-xs text-on-surface-variant">{log.timestamp}</td>

                    {/* Status badge */}
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${severityBadges[log.severity]}`}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{
                          backgroundColor: log.severity === 'Success' ? '#4edea3' : log.severity === 'Warning' ? '#ffb3af' : '#ffb4ab'
                        }} />
                        {log.severity}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined block mb-2 animate-spin" style={{ fontSize: 40 }}>progress_activity</span>
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined block mb-2" style={{ fontSize: 40 }}>receipt_long</span>
                    No audit entries found matching the active filters.
                  </td>
                </tr>
              ) : null}
            </motion.tbody>
          </table>
        </div>

        {/* ── Pagination Footer ──────────────────────────────────────────── */}
        <div className="p-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-low/30">
          <span className="text-on-surface-variant text-sm">
            {total > 0 ? `Showing ${from}–${to} of ${total.toLocaleString()} actions` : 'No records'}
          </span>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded">
              Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </span>

            <div className="flex gap-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePrev}
                disabled={page === 0 || loading}
                className="px-3 py-1.5 text-xs btn-secondary rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!hasMore || loading}
                className="px-3 py-1.5 text-xs btn-secondary rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
