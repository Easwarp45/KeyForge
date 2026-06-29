import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import Select from '../components/Select';

const dataByRange: Record<string, { date: string; calls: number }[]> = {
  '7D': [
    { date: 'May 24', calls: 32000 }, { date: 'May 25', calls: 28000 },
    { date: 'May 26', calls: 35000 }, { date: 'May 27', calls: 41000 },
    { date: 'May 28', calls: 38000 }, { date: 'May 29', calls: 44000 }, { date: 'May 30', calls: 38000 },
  ],
  '30D': [
    { date: 'May 1', calls: 18000 }, { date: 'May 7', calls: 24500 },
    { date: 'May 14', calls: 21000 }, { date: 'May 21', calls: 38000 }, { date: 'May 28', calls: 45000 },
  ],
  '90D': [
    { date: 'Mar 1', calls: 95000 }, { date: 'Mar 15', calls: 112000 },
    { date: 'Apr 1', calls: 120000 }, { date: 'Apr 15', calls: 130000 },
    { date: 'May 1', calls: 142000 }, { date: 'May 15', calls: 156000 }, { date: 'May 30', calls: 162000 },
  ],
  'Custom': [
    { date: 'May 15', calls: 22000 }, { date: 'May 16', calls: 27000 },
    { date: 'May 17', calls: 24000 }, { date: 'May 18', calls: 31000 },
    { date: 'May 19', calls: 29000 }, { date: 'May 20', calls: 35000 }, { date: 'May 22', calls: 38000 },
  ],
};

const topKeys = [
  { key: 'PROD_AUTH_MAIN', project: 'Phoenix Project', calls: 1248392, avg: '41.6k' },
  { key: 'MOBILE_IOS_V2', project: 'CyberVault', calls: 892104, avg: '29.7k' },
  { key: 'STRIPE_HOOK_01', project: 'Payment GW', calls: 540200, avg: '18.0k' },
  { key: 'ANALYTICS_READ', project: 'Data Pipeline', calls: 340500, avg: '11.4k' },
];

const endpoints = [
  { path: '/api/v1/auth/token', pct: 42 },
  { path: '/api/v1/keys/validate', pct: 28 },
  { path: '/api/v2/users/me', pct: 15 },
  { path: '/api/v1/logs/query', pct: 10 },
  { path: '/api/v1/events', pct: 5 },
];

const heatmapBase = [
  [10, 40, 20, 80, 30, 10, 5],
  [20, 60, 100, 90, 40, 20, 5],
  [5, 10, 20, 30, 10, 5, 5],
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

export default function Analytics() {
  const navigate = useNavigate();
  const [activeRange, setActiveRange] = useState<keyof typeof dataByRange>('30D');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedKey, setSelectedKey] = useState('All Active Keys');
  const [startDate, setStartDate] = useState('2024-05-15');
  const [endDate, setEndDate] = useState('2024-05-22');
  const [isLiveUpdate, setIsLiveUpdate] = useState(false);

  const handleExport = () => {
    const rows = ['Date,Calls', ...dataByRange[activeRange].map(d => `${d.date},${d.calls}`)].join('\n');
    const a = document.createElement('a'); a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(rows)}`; a.download = 'analytics.csv'; a.click();
  };

  const handleLiveUpdate = () => {
    setIsLiveUpdate(true);
    setTimeout(() => setIsLiveUpdate(false), 2000);
  };

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="font-bold text-on-surface" style={{ fontSize: 32, lineHeight: 1.2 }}>Usage Analytics</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Real-time performance monitoring across all production keys.</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>file_download</span>
            Export PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLiveUpdate}
            className={`btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-lg cursor-pointer ${isLiveUpdate ? 'opacity-80' : ''}`}
          >
            <span className={`material-symbols-outlined ${isLiveUpdate ? 'animate-spin' : ''}`} style={{ fontSize: 18 }}>refresh</span>
            {isLiveUpdate ? 'Updating...' : 'Live Update'}
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-container/40 rounded-xl border border-outline-variant/30 backdrop-blur-sm mb-8 z-10 relative">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] uppercase font-bold tracking-widest text-on-surface-variant pl-1">Project</label>
          <Select
            value={selectedProject}
            onChange={setSelectedProject}
            options={['All Projects', 'Phoenix Engine', 'CyberVault Auth', 'Payment Gateway']}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] uppercase font-bold tracking-widest text-on-surface-variant pl-1">Key Context</label>
          <Select
            value={selectedKey}
            onChange={setSelectedKey}
            options={['All Active Keys', 'PROD_WRITE_01', 'STAGING_READ_02', 'LEGACY_SUPPORT']}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="font-mono text-[10px] uppercase font-bold tracking-widest text-on-surface-variant pl-1">Date Range</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10" style={{ fontSize: 16 }}>calendar_today</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="glass-input w-full text-sm py-2 pl-9 pr-3 min-h-[38px] bg-[#121915]/80" />
            </div>
            <span className="flex items-center text-on-surface-variant text-sm">to</span>
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant z-10" style={{ fontSize: 16 }}>calendar_today</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="glass-input w-full text-sm py-2 pl-9 pr-3 min-h-[38px] bg-[#121915]/80" />
            </div>
          </div>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-4 gap-bento-gap">

        {/* Volume Chart – full width */}
        <motion.div variants={item} className="md:col-span-4 bento-card p-6 min-h-[340px] flex flex-col">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="font-semibold text-on-surface" style={{ fontSize: 20 }}>API Call Volume</h3>
              <div className="flex items-center gap-1.5 text-sm text-primary mt-1">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>trending_up</span>
                +12.5% from last period
              </div>
            </div>
            <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 gap-1">
              {(['7D', '30D', '90D', 'Custom'] as const).map(t => (
                <motion.button
                  key={t}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveRange(t)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${activeRange === t ? 'bg-primary/20 text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {t}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataByRange[activeRange]} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,74,66,0.2)" />
                <XAxis dataKey="date" stroke="#86948a" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis stroke="#86948a" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ background: '#1a211d', border: '1px solid rgba(60,74,66,0.5)', borderRadius: 8, color: '#dde4dd' }} />
                <Area type="monotone" dataKey="calls" stroke="#4edea3" strokeWidth={2.5} fill="url(#volGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Error rate donut */}
        <motion.div variants={item} className="md:col-span-1 bento-card p-5 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">Error Rate</p>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="64" cy="64" r="56" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="351.9" strokeDashoffset="4.2" />
              <circle cx="64" cy="64" r="56" fill="none" stroke="#fbbf24" strokeWidth="10" strokeDasharray="351.9" strokeDashoffset="340" />
              <circle cx="64" cy="64" r="56" fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray="351.9" strokeDashoffset="349" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-bold text-on-surface">1.2%</span>
              <span className="font-mono text-[9px] text-on-surface-variant uppercase">Error</span>
            </div>
          </div>
          <div className="flex gap-3 mt-4 text-[10px] font-bold">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> 200</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 4xx</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> 5xx</span>
          </div>
          <button onClick={() => navigate('/reports')} className="mt-3 text-[10px] text-primary hover:underline font-mono cursor-pointer">View full report →</button>
        </motion.div>

        {/* Response time gauge */}
        <motion.div variants={item} className="md:col-span-1 bento-card p-5 flex flex-col items-center justify-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">Avg Response</p>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <path d="M20 80 A 40 40 0 1 1 80 80" fill="none" stroke="rgba(255,255,255,0.05)" strokeLinecap="round" strokeWidth="8" />
              <path 
                d="M20 80 A 40 40 0 1 1 80 80" 
                fill="none" 
                stroke="#10b981" 
                strokeLinecap="round" 
                strokeWidth="8" 
                strokeDasharray="184"
                strokeDashoffset={184 * (1 - 0.248)}
              />
              <circle 
                cx={50 + 40 * Math.cos((138.59 + 0.248 * 262.82) * Math.PI / 180)} 
                cy={53.54 + 40 * Math.sin((138.59 + 0.248 * 262.82) * Math.PI / 180)} 
                r="4" 
                fill="white" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <span className="text-2xl font-bold text-on-surface">248ms</span>
              <span className="font-mono text-[10px] font-bold text-primary">OPTIMAL</span>
            </div>
          </div>
          <div className="w-full flex justify-between px-6 mt-2">
            <span className="font-mono text-[9px] text-on-surface-variant">0ms</span>
            <span className="font-mono text-[9px] text-on-surface-variant">1000ms</span>
          </div>
        </motion.div>

        {/* Heatmap */}
        <motion.div variants={item} className="md:col-span-1 bento-card p-5 flex flex-col">
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">Peak Usage Heatmap</p>
          <div className="flex-1 grid grid-cols-7 gap-1">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="text-[9px] text-on-surface-variant text-center">{d}</div>
            ))}
            {heatmapBase.flat().map((v, i) => (
              <div
                key={i}
                title={`${v}% activity`}
                className="w-full aspect-square rounded-sm transition-all hover:scale-110 cursor-default"
                style={{ backgroundColor: `rgba(78,222,163,${v / 100})` }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <span className="font-mono text-[9px] text-on-surface-variant">Min</span>
            <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary/10 to-primary" />
            <span className="font-mono text-[9px] text-on-surface-variant">Max</span>
          </div>
        </motion.div>

        {/* Status distribution */}
        <motion.div variants={item} className="md:col-span-1 bento-card p-5 flex flex-col">
          <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">Status Distribution</p>
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {[
              { label: '200 OK', pct: 98.4, color: '#4edea3', width: '98%' },
              { label: '401 Unauthorized', pct: 1.1, color: '#fbbf24', width: '10%' },
              { label: '500 Server Error', pct: 0.5, color: '#ef4444', width: '5%' },
            ].map(s => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface">{s.label}</span>
                  <span className="text-on-surface-variant">{s.pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: s.width }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top keys table */}
        <motion.div variants={item} className="md:col-span-2 bento-card p-5 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-on-surface text-sm">Top Usage by Key</h3>
            <button onClick={() => navigate('/keys')} className="text-xs text-primary hover:underline cursor-pointer">View all</button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">
                  <th className="pb-2">Key Identity</th>
                  <th className="pb-2 text-right">Calls</th>
                  <th className="pb-2 text-center">Trend</th>
                  <th className="pb-2 text-right">Avg/Day</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-outline-variant/10">
                {topKeys.map(k => (
                  <tr key={k.key} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate('/keys')}>
                    <td className="py-3">
                      <p className="font-bold text-on-surface font-mono">{k.key}</p>
                      <p className="font-mono text-[10px] text-on-surface-variant">{k.project}</p>
                    </td>
                    <td className="py-3 text-right font-mono">{k.calls.toLocaleString()}</td>
                    <td className="py-3 flex justify-center items-center">
                      <div className="flex gap-0.5 items-end h-6">
                        {[2, 3, 5, 4, 6].map((v, i) => (
                          <div key={i} className="w-1 rounded-sm" style={{ height: `${v * 4}px`, backgroundColor: `rgba(78,222,163,${0.2 + i * 0.2})` }} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-right text-primary font-bold font-mono">{k.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Resource utilization */}
        <motion.div variants={item} className="md:col-span-2 bento-card p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-on-surface text-sm">Resource Utilization</h3>
            <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">Top 5 Paths</span>
          </div>
          <div className="flex-1 space-y-4 pt-1">
            {endpoints.map(ep => (
              <div key={ep.path} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-on-surface-variant">{ep.path}</span>
                  <span className="font-bold text-on-surface">{ep.pct}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ep.pct}%` }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full bg-primary rounded-full shadow-emerald-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
