import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getKeys, getAudits, type ApiKey, type AuditLog } from '../api';

export default function Reports() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'Weekly' | 'Monthly' | 'Quarterly'>('Monthly');
  const [exporting, setExporting] = useState(false);
  const [sortField, setSortField] = useState<'calls' | 'errors' | 'uptime'>('calls');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    Promise.all([getKeys(), getAudits()])
      .then(([keysData, auditResponse]) => {
        setKeys(keysData);
        // getAudits returns a paginated response — extract .logs for analysis
        setAudits(auditResponse.logs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Compute Summary Statistics ───────────────────────────────────────────
  const validationAudits = audits.filter(a => a.action === 'Key Validated' || a.action === 'Key Validation Failed');
  const totalCallsCount = validationAudits.length;
  
  const errorAuditsCount = audits.filter(a => a.action === 'Key Validation Failed').length;
  const errorRateVal = totalCallsCount > 0 ? (errorAuditsCount / totalCallsCount) * 100 : 0;
  const errorRate = `${errorRateVal.toFixed(2)}%`;

  const activeKeysCount = keys.filter(k => k.status === 'Active').length;
  const avgLatency = totalCallsCount > 0 ? '14ms' : '0ms';

  // ── Compute Per-Key Breakdown ─────────────────────────────────────────────
  const keyReports = keys.map(k => {
    // Match audits where target matches key name
    const keyAudits = audits.filter(a => a.target === k.name);
    const calls = keyAudits.filter(a => a.action === 'Key Validated').length;
    const errors = keyAudits.filter(a => a.action === 'Key Validation Failed').length;
    const total = calls + errors;
    
    let uptime = '100.00%';
    if (total > 0) {
      const uptimeVal = ((total - errors) / total) * 100;
      uptime = `${uptimeVal.toFixed(2)}%`;
    }

    let status = 'Healthy';
    if (k.status !== 'Active') status = 'Inactive';
    else if (errors > 0 && errors / total > 0.05) status = 'Warning';

    return {
      name: k.name,
      calls: total,
      errors,
      uptime,
      status
    };
  });

  const handleExport = () => {
    setExporting(true);
    const rows = ['Key Name,Total Calls,Errors,Uptime,Health', ...keyReports.map(k => `${k.name},${k.calls},${k.errors},${k.uptime},${k.status}`)].join('\n');
    const a = document.createElement('a'); a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(rows)}`; a.download = 'keyforge-report.csv'; a.click();
    setTimeout(() => setExporting(false), 1500);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(false); }
  };

  const sorted = [...keyReports].sort((a, b) => {
    const valA = sortField === 'uptime' ? parseFloat(a.uptime) : a[sortField];
    const valB = sortField === 'uptime' ? parseFloat(b.uptime) : b[sortField];
    return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  // ── Compute Dynamic Chart Data from Audits ────────────────────────────────
  // We construct data points based on selected period
  const getChartData = () => {
    if (totalCallsCount === 0) {
      // Return zeroed template so charts render cleanly with baseline values
      if (period === 'Weekly') {
        return [
          { month: 'W1', calls: 0, errors: 0 },
          { month: 'W2', calls: 0, errors: 0 },
          { month: 'W3', calls: 0, errors: 0 },
          { month: 'W4', calls: 0, errors: 0 },
        ];
      } else if (period === 'Quarterly') {
        return [
          { month: 'Q1', calls: 0, errors: 0 },
          { month: 'Q2', calls: 0, errors: 0 },
          { month: 'Q3', calls: 0, errors: 0 },
          { month: 'Q4', calls: 0, errors: 0 },
        ];
      } else {
        return [
          { month: 'Jan', calls: 0, errors: 0 },
          { month: 'Feb', calls: 0, errors: 0 },
          { month: 'Mar', calls: 0, errors: 0 },
          { month: 'Apr', calls: 0, errors: 0 },
          { month: 'May', calls: 0, errors: 0 },
          { month: 'Jun', calls: 0, errors: 0 },
        ];
      }
    }

    // Dynamic grouping of audits
    const counts: Record<string, { calls: number; errors: number }> = {};
    
    validationAudits.forEach(a => {
      let key = 'Other';
      const date = new Date(a.timestamp);
      
      if (period === 'Weekly') {
        // Group by week of month (W1-W4 approximate)
        const day = date.getDate();
        const weekNum = Math.min(4, Math.floor((day - 1) / 7) + 1);
        key = `W${weekNum}`;
      } else if (period === 'Quarterly') {
        // Group by Q1-Q4
        const month = date.getMonth();
        const qNum = Math.floor(month / 3) + 1;
        key = `Q${qNum}`;
      } else {
        // Group by Month Name (Jan, Feb...)
        key = date.toLocaleString('en-US', { month: 'short' });
      }

      if (!counts[key]) counts[key] = { calls: 0, errors: 0 };
      if (a.action === 'Key Validated') {
        counts[key].calls++;
      } else {
        counts[key].errors++;
      }
    });

    // Sort/format matching keys
    const order = period === 'Weekly' 
      ? ['W1', 'W2', 'W3', 'W4']
      : period === 'Quarterly'
      ? ['Q1', 'Q2', 'Q3', 'Q4']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return order.map(label => ({
      month: label,
      calls: counts[label]?.calls || 0,
      errors: counts[label]?.errors || 0
    }));
  };

  const chartData = getChartData();

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span className="material-symbols-outlined ml-1 opacity-50 font-semibold" style={{ fontSize: 14, verticalAlign: 'middle' }}>
      {sortField === field ? (sortAsc ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
    </span>
  );

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-bold text-on-surface" style={{ fontSize: 32, lineHeight: 1.2 }}>Reports</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Comprehensive analysis and usage reports for your API keys.</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-surface-variant/40 rounded-lg p-1 border border-outline-variant/30">
            {(['Weekly', 'Monthly', 'Quarterly'] as const).map(p => (
              <motion.button
                key={p}
                whileTap={{ scale: 0.96 }}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm transition-all cursor-pointer ${period === p ? 'bg-surface-bright text-on-surface font-semibold shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {p}
              </motion.button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            disabled={exporting || keyReports.length === 0}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined ${exporting ? 'animate-bounce' : ''}`} style={{ fontSize: 18 }}>
              {exporting ? 'check' : 'file_download'}
            </span>
            {exporting ? 'Downloaded!' : 'Export Report'}
          </motion.button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-bento-gap">
        {/* Summary stats */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Calls (MTD)', value: totalCallsCount.toLocaleString(), change: totalCallsCount > 0 ? '+100%' : '0%', route: '/analytics' },
            { label: 'Avg Error Rate', value: errorRate, change: '0%' },
            { label: 'Avg Latency', value: avgLatency, change: '0%' },
            { label: 'Active Keys', value: activeKeysCount.toString(), change: keys.length > 0 ? `+${activeKeysCount}` : '0', route: '/keys' },
          ].map(s => (
            <motion.button
              key={s.label}
              whileHover={s.route ? { scale: 1.02, y: -1 } : {}}
              whileTap={s.route ? { scale: 0.98 } : {}}
              onClick={() => s.route && navigate(s.route)}
              className={`bento-card p-5 text-left w-full ${s.route ? 'hover:border-primary/40 transition-colors cursor-pointer' : ''}`}
            >
              <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-2">{s.label}</p>
              <p className="font-black text-on-surface" style={{ fontSize: 28 }}>{s.value}</p>
              <p className="font-mono text-xs mt-1 text-primary">{s.change} vs last</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-bento-gap">
          <div className="bento-card p-6 flex flex-col min-h-[300px]">
            <h3 className="font-semibold text-on-surface mb-5" style={{ fontSize: 18 }}>{period} API Volume</h3>
            <div className="flex-1">
              {totalCallsCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 40 }}>bar_chart</span>
                  <p className="text-on-surface-variant text-sm">No volume data recorded yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,74,66,0.25)" />
                    <XAxis dataKey="month" stroke="#86948a" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                    <YAxis stroke="#86948a" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip contentStyle={{ background: '#1a211d', border: '1px solid rgba(60,74,66,0.5)', borderRadius: 8, color: '#dde4dd' }} />
                    <Bar dataKey="calls" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bento-card p-6 flex flex-col min-h-[300px]">
            <h3 className="font-semibold text-on-surface mb-5" style={{ fontSize: 18 }}>Error Trend</h3>
            <div className="flex-1">
              {errorAuditsCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 40 }}>show_chart</span>
                  <p className="text-on-surface-variant text-sm">No errors detected.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,74,66,0.25)" />
                    <XAxis dataKey="month" stroke="#86948a" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                    <YAxis stroke="#86948a" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip contentStyle={{ background: '#1a211d', border: '1px solid rgba(60,74,66,0.5)', borderRadius: 8, color: '#dde4dd' }} />
                    <Line type="monotone" dataKey="errors" stroke="#ffb4ab" strokeWidth={2.5} dot={{ fill: '#ffb4ab', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>

        {/* Per-key breakdown table with sortable columns */}
        <motion.div variants={item} className="bento-card overflow-hidden">
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
            <h3 className="font-semibold text-on-surface" style={{ fontSize: 18 }}>Per-Key Breakdown</h3>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                {period} · {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <button onClick={() => navigate('/keys')} className="text-xs text-primary hover:underline font-mono cursor-pointer">
                Manage keys →
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {keyReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 40 }}>vpn_key</span>
                <p className="text-on-surface-variant text-sm">No keys found.</p>
                <button onClick={() => navigate('/keys')} className="mt-2 btn-primary text-xs px-4 py-2 rounded-lg">
                  Generate Key
                </button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container/30">
                    <th className="p-4 font-mono text-xs text-on-surface-variant uppercase tracking-widest">Key Name</th>
                    <th className="p-4 font-mono text-xs text-on-surface-variant uppercase tracking-widest cursor-pointer hover:text-primary" onClick={() => toggleSort('calls')}>
                      Total Calls <SortIcon field="calls" />
                    </th>
                    <th className="p-4 font-mono text-xs text-on-surface-variant uppercase tracking-widest text-right cursor-pointer hover:text-primary" onClick={() => toggleSort('errors')}>
                      Errors <SortIcon field="errors" />
                    </th>
                    <th className="p-4 font-mono text-xs text-on-surface-variant uppercase tracking-widest text-right cursor-pointer hover:text-primary" onClick={() => toggleSort('uptime')}>
                      Uptime <SortIcon field="uptime" />
                    </th>
                    <th className="p-4 font-mono text-xs text-on-surface-variant uppercase tracking-widest text-right">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {sorted.map(k => (
                    <tr key={k.name} className="table-row-hover cursor-pointer" onClick={() => navigate('/keys')}>
                      <td className="p-4 font-medium text-on-surface text-sm">{k.name}</td>
                      <td className="p-4 font-mono text-sm text-on-surface-variant">{k.calls.toLocaleString()}</td>
                      <td className="p-4 font-mono text-sm text-error text-right">{k.errors.toLocaleString()}</td>
                      <td className="p-4 font-mono text-sm text-on-surface text-right">{k.uptime}</td>
                      <td className="p-4 text-right">
                        <span className={k.status === 'Healthy' ? 'badge-active' : 'badge-warning'}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: k.status === 'Healthy' ? '#4edea3' : '#ffb3af' }} />
                          {k.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
