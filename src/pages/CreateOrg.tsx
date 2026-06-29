import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Select from '../components/Select';

export default function CreateOrg() {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [industry, setIndustry] = useState('Technology & SaaS');
  const [region, setRegion] = useState('US-East (N. Virginia)');
  const [loading, setLoading] = useState(false);

  const handleNameChange = (val: string) => {
    setOrgName(val);
    setOrgSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-on-surface flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-primary/5 filter blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[460px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl border-t-2 border-t-primary rounded-xl p-8 shadow-2xl relative z-20"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">corporate_fare</span>
          </div>
          <h2 className="font-bold text-headline-md text-on-surface mb-2">Create Organization</h2>
          <p className="text-body-md text-on-surface-variant max-w-xs">
            Set up your shared workspace environment. Invite collaborators next.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corporation"
              value={orgName}
              onChange={e => handleNameChange(e.target.value)}
              className="w-full bg-black/40 border border-outline-variant/50 rounded-lg p-3 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
              Organization Slug
            </label>
            <div className="flex rounded-lg border border-outline-variant/50 overflow-hidden bg-black/40 items-center">
              <span className="bg-surface-container px-3 py-3 text-xs text-on-surface-variant font-mono border-r border-outline-variant/30 select-none">
                keyforge.dev/
              </span>
              <input
                type="text"
                required
                placeholder="acme-corp"
                value={orgSlug}
                onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                className="flex-grow bg-transparent p-3 text-xs font-mono text-on-surface outline-none border-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2.5">
              Industry
            </label>
            <Select
              value={industry}
              onChange={setIndustry}
              options={['Technology & SaaS', 'Financial Services', 'E-commerce & Retail', 'Healthcare & Biotech', 'Other']}
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2.5">
              Deployment Region
            </label>
            <Select
              value={region}
              onChange={setRegion}
              options={['US-East (N. Virginia)', 'US-West (Oregon)', 'EU-Central (Frankfurt)', 'AP-South (Mumbai)', 'AP-East (Tokyo)']}
              className="w-full"
            />
          </div>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !orgName.trim() || !orgSlug.trim()}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Initializing Workspace...' : 'Create & Continue'}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
