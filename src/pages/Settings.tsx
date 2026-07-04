import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type ToggleProps = { checked: boolean; onChange: () => void; id: string };

function Toggle({ checked, onChange, id }: ToggleProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
      style={{ backgroundColor: checked ? '#10b981' : 'rgba(60,74,66,0.5)' }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

const sections = [
  {
    title: 'Account',
    icon: 'account_circle',
    fields: [
      { label: 'Display Name', type: 'text', value: '', id: 'display-name' },
      { label: 'Email Address', type: 'email', value: '', id: 'email' },
      { label: 'Organization', type: 'text', value: '', id: 'org' },
    ],
  },
  {
    title: 'Security',
    icon: 'shield',
    toggles: [
      { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security using TOTP or hardware keys.', key: 'mfa' },
      { label: 'Session Alerts', desc: 'Get notified when a new device signs into your account.', key: 'sessionAlerts' },
      { label: 'IP Allowlisting', desc: 'Restrict API key usage to specific IP addresses.', key: 'ipAllowlist' },
    ],
  },
  {
    title: 'Notifications',
    icon: 'notifications',
    toggles: [
      { label: 'Key Expiry Alerts', desc: 'Email me when API keys are within 7 days of expiry.', key: 'expiryAlerts' },
      { label: 'Quota Warning Emails', desc: 'Alert me when usage reaches 80% of quota.', key: 'quotaAlerts' },
      { label: 'Team Activity Digest', desc: 'Daily summary of team key operations.', key: 'activityDigest' },
      { label: 'Security Incident Alerts', desc: 'Immediate email on anomalous traffic or auth failures.', key: 'securityAlerts' },
    ],
  },
  {
    title: 'API & Integrations',
    icon: 'api',
    toggles: [
      { label: 'Webhook Events', desc: 'Send key lifecycle events to your webhook endpoint.', key: 'webhooks' },
      { label: 'Supabase Edge Functions', desc: 'Enable serverless key rotation via Supabase Edge Functions.', key: 'edgeFunctions' },
    ],
    fields: [
      { label: 'Webhook Endpoint URL', type: 'url', value: 'https://hooks.example.com/keyforge', id: 'webhook-url' },
    ],
  },
  {
    title: 'Appearance',
    icon: 'palette',
    toggles: [
      { label: 'Dark Mode (Default)', desc: 'Use the dark Digital Organicism theme.', key: 'darkMode' },
      { label: 'Grain Texture Overlay', desc: 'Subtle noise texture on all surfaces.', key: 'grain' },
      { label: 'Reduce Motion', desc: 'Minimize animations for accessibility.', key: 'reduceMotion' },
    ],
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function Settings() {
  const navigate = useNavigate();

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    mfa: true, sessionAlerts: true, ipAllowlist: false,
    expiryAlerts: true, quotaAlerts: true, activityDigest: false, securityAlerts: true,
    webhooks: false, edgeFunctions: false, darkMode: true, grain: true, reduceMotion: false,
  });

  const [fields, setFields] = useState<Record<string, string>>({
    'display-name': 'DevMaster_01',
    'email': 'devmaster@company.com',
    'org': 'Acme Corp',
    'webhook-url': 'https://hooks.example.com/keyforge',
  });

  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleToggle = (key: string) => {
    const next = !toggles[key];
    setToggles(p => ({ ...p, [key]: next }));
    // Side effect: darkMode toggle
    if (key === 'darkMode') {
      document.documentElement.classList.toggle('light', !next);
    }
    // Side effect: reduceMotion
    if (key === 'reduceMotion') {
      document.documentElement.style.setProperty('--motion-duration', next ? '0s' : '0.3s');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="font-bold text-on-surface" style={{ fontSize: 32, lineHeight: 1.2 }}>Settings</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Configure your KeyForge workspace and preferences.</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1 as any)}
            className="btn-secondary px-4 py-2.5 text-sm rounded-lg flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="btn-primary px-5 py-2.5 text-sm font-semibold shadow-emerald-sm rounded-lg cursor-pointer"
            style={saved ? { backgroundColor: '#22c55e' } : {}}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {saved ? 'check_circle' : 'save'}
            </span>
            {saved ? 'Saved!' : 'Save Changes'}
          </motion.button>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {sections.map(s => (
          <motion.button
            key={s.title}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveSection(activeSection === s.title ? null : s.title);
              document.getElementById(`section-${s.title}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeSection === s.title ? 'bg-primary-container text-on-primary-container font-semibold shadow-emerald-sm' : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
            }`}
          >
            {s.title}
          </motion.button>
        ))}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-5">
        {sections.map(section => (
          <motion.div key={section.title} variants={item} id={`section-${section.title}`} className="bento-card overflow-hidden">
            {/* Section header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container/40 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>{section.icon}</span>
              <h3 className="font-semibold text-on-surface" style={{ fontSize: 17 }}>{section.title}</h3>
            </div>

            <div className="p-6 space-y-5">
              {/* Text fields */}
              {section.fields?.map(f => (
                <div key={f.id}>
                  <label htmlFor={f.id} className="block font-mono text-xs text-on-surface-variant mb-2 uppercase tracking-wider">{f.label}</label>
                  <input
                    id={f.id}
                    type={f.type}
                    value={fields[f.id] ?? f.value}
                    onChange={e => setFields(p => ({ ...p, [f.id]: e.target.value }))}
                    className="glass-input w-full px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              ))}

              {/* Toggles */}
              {section.toggles?.map(t => (
                <div key={t.key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-on-surface text-sm">{t.label}</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">{t.desc}</p>
                  </div>
                  <Toggle
                    id={t.key}
                    checked={toggles[t.key] ?? false}
                    onChange={() => handleToggle(t.key)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
        {/* Danger zone */}
        <motion.div variants={item} className="bento-card overflow-hidden" style={{ borderColor: 'rgba(255,180,171,0.2)' }}>
          <div className="px-6 py-4 border-b border-error/20 bg-error/5 flex items-center gap-3">
            <span className="material-symbols-outlined text-error" style={{ fontSize: 22 }}>dangerous</span>
            <h3 className="font-semibold text-error" style={{ fontSize: 17 }}>Danger Zone</h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Revoke all */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-on-surface text-sm">Revoke All Active Keys</p>
                <p className="text-on-surface-variant text-xs mt-0.5">Immediately revokes all active API keys. This action cannot be undone.</p>
              </div>
              {showRevokeConfirm ? (
                <div className="flex gap-2 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowRevokeConfirm(false)} className="px-3 py-1.5 text-xs btn-secondary rounded-lg cursor-pointer">Cancel</motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowRevokeConfirm(false); navigate('/keys'); }}
                    className="px-3 py-1.5 text-xs bg-error text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Confirm Revoke
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRevokeConfirm(true)}
                  className="flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-lg border border-error text-error hover:bg-error/10 transition-all cursor-pointer"
                >
                  Revoke All
                </motion.button>
              )}
            </div>

            <div className="border-t border-outline-variant/20 pt-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-on-surface text-sm">Delete Account</p>
                <p className="text-on-surface-variant text-xs mt-0.5">Permanently delete your account and all associated data.</p>
              </div>
              {showDeleteConfirm ? (
                <div className="flex gap-2 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-xs btn-secondary rounded-lg cursor-pointer">Cancel</motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="px-3 py-1.5 text-xs bg-error text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Delete Forever
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-lg bg-error-container text-error hover:bg-error hover:text-white transition-all cursor-pointer"
                >
                  Delete Account
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
