import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Select from '../components/Select';

type Step = 1 | 2 | 3 | 4;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1 State: Project
  const [projectName, setProjectName] = useState('');
  const [environment, setEnvironment] = useState<'Dev' | 'Staging' | 'Prod'>('Dev');

  // Step 2 State: Key
  const [keyLabel, setKeyLabel] = useState('');
  const [scopes, setScopes] = useState<Record<string, boolean>>({
    read: true,
    write: true,
    admin: true,
    webhooks: true,
    analytics: true,
  });
  const [expiry, setExpiry] = useState<'30d' | '90d' | '1y' | 'Never'>('30d');

  // Step 3 State: Team
  const [emails, setEmails] = useState<{ id: number; email: string; role: string }[]>([
    { id: 1, email: '', role: 'Admin' },
    { id: 2, email: '', role: 'Developer' },
  ]);

  const handleScopeChange = (scope: string) => {
    setScopes(prev => ({ ...prev, [scope]: !prev[scope] }));
  };

  const handleAddEmail = () => {
    setEmails(prev => [...prev, { id: Date.now(), email: '', role: 'Developer' }]);
  };

  const handleRemoveEmail = (id: number) => {
    if (emails.length <= 1) return;
    setEmails(prev => prev.filter(item => item.id !== id));
  };

  const handleEmailChange = (id: number, val: string) => {
    setEmails(prev => prev.map(item => item.id === id ? { ...item, email: val } : item));
  };

  const handleRoleChange = (id: number, val: string) => {
    setEmails(prev => prev.map(item => item.id === id ? { ...item, role: val } : item));
  };

  const handleCompleteSetup = () => {
    setStep(4);
  };

  const activeScopes = Object.entries(scopes)
    .filter(([_, active]) => active)
    .map(([name]) => name);

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-on-surface flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background grain and orbs */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-primary/10 filter blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-primary/5 filter blur-[120px] pointer-events-none" />

      {/* Top Fixed Progress Bar */}
      <header className="fixed top-0 left-0 right-0 h-24 z-50 flex flex-col justify-end pb-4 bg-[#0a0f0d]/50 backdrop-blur-md border-b border-outline-variant/10">
        <div className="max-w-3xl mx-auto w-full px-6">
          <div className="flex justify-between relative mb-2 items-center">
            {/* Connector Background */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-outline-variant/30 -translate-y-1/2 z-0" />
            {/* Connector Active Progress */}
            <motion.div
              className="absolute top-1/2 left-0 h-[2px] bg-primary z-0"
              initial={{ width: '0%' }}
              animate={{
                width: step === 1 ? '0%' : step === 2 ? '33.3%' : step === 3 ? '66.6%' : '100%',
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />

            {/* Step Markers */}
            {[
              { num: 1, label: 'Create Project' },
              { num: 2, label: 'Generate Key' },
              { num: 3, label: 'Invite Team' },
              { num: 4, label: 'You\'re Ready!' },
            ].map(s => {
              const active = step >= s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: step === s.num ? 1.1 : 1,
                      backgroundColor: active ? '#4edea3' : '#3c4a42',
                    }}
                    className={`w-4 h-4 rounded-full border-4 border-[#0a0f0d] ${
                      active ? 'shadow-[0_0_10px_rgba(16,185,129,0.4)]' : ''
                    }`}
                  />
                  <span
                    className={`mt-2 font-mono text-[10px] uppercase tracking-wider transition-colors duration-300 ${
                      active ? 'text-primary font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center pt-28 pb-12 px-6 w-full max-w-[540px] z-20">
        <div className="w-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl border-t-2 border-t-primary rounded-2xl p-8 relative shadow-2xl min-h-[460px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* Step 1: Create Project */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
                      <span className="material-symbols-outlined text-3xl">folder</span>
                    </div>
                    <h1 className="font-bold text-headline-md text-on-surface mb-2">Name your first project</h1>
                    <p className="text-body-md text-on-surface-variant">Projects help you organize API keys by environment or microservice.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Project Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Core Banking API"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        className="w-full bg-black/40 border border-outline-variant/50 rounded-lg p-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Environment</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['Dev', 'Staging', 'Prod'] as const).map(env => (
                          <label key={env} className="cursor-pointer">
                            <input
                              type="radio"
                              name="env"
                              checked={environment === env}
                              onChange={() => setEnvironment(env)}
                              className="hidden"
                            />
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`border p-3 rounded-lg text-center transition-all ${
                                environment === env
                                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                                  : 'border-outline-variant bg-black/20 text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              <span className="font-mono text-xs uppercase">{env}</span>
                            </motion.div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!projectName.trim()}
                    onClick={() => setStep(2)}
                    className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-headline-md hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Continue
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Generate Key */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
                      <span className="material-symbols-outlined text-3xl">vpn_key</span>
                    </div>
                    <h1 className="font-bold text-headline-md text-on-surface mb-2">Create an API key</h1>
                    <p className="text-body-md text-on-surface-variant">This key will grant access to your project resources.</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Key Label *</label>
                      <input
                        type="text"
                        required
                        placeholder="Development Access Key"
                        value={keyLabel}
                        onChange={e => setKeyLabel(e.target.value)}
                        className="w-full bg-black/40 border border-outline-variant/50 rounded-lg p-3 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2.5">Scopes</label>
                      <div className="flex flex-wrap gap-2">
                        {['read', 'write', 'admin', 'webhooks', 'analytics'].map(scope => (
                          <label key={scope} className="cursor-pointer">
                            <input
                              type="checkbox"
                              checked={scopes[scope]}
                              onChange={() => handleScopeChange(scope)}
                              className="hidden"
                            />
                            <motion.div
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className={`px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
                                scopes[scope]
                                  ? 'bg-primary/20 border-primary text-primary font-semibold'
                                  : 'border-outline-variant bg-black/20 text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              {scope}
                            </motion.div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Expiry</label>
                      <div className="flex w-full bg-black/40 p-1 rounded-lg border border-outline-variant/50">
                        {(['30d', '90d', '1y', 'Never'] as const).map(item => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setExpiry(item)}
                            className={`flex-1 text-center py-1.5 font-mono text-xs rounded-md cursor-pointer transition-colors ${
                              expiry === item ? 'bg-primary text-[#002113] font-bold' : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(1)}
                    className="flex-1 border border-outline-variant/50 hover:bg-white/5 py-3 rounded-lg font-bold cursor-pointer"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!keyLabel.trim()}
                    onClick={() => setStep(3)}
                    className="flex-[2] bg-primary text-on-primary py-3 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Next
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Team */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
                      <span className="material-symbols-outlined text-3xl">group</span>
                    </div>
                    <h1 className="font-bold text-headline-md text-on-surface mb-2">Bring in your team</h1>
                    <p className="text-body-md text-on-surface-variant">Secure access is better shared. Invite collaborators now.</p>
                  </div>

                  <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
                    {emails.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <input
                          type="email"
                          placeholder="dev-lead@company.com"
                          value={item.email}
                          onChange={e => handleEmailChange(item.id, e.target.value)}
                          className="flex-grow bg-black/40 border border-outline-variant/50 rounded-lg p-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40"
                        />
                        <div className="w-28 flex-shrink-0">
                          <Select
                            value={item.role}
                            onChange={val => handleRoleChange(item.id, val)}
                            options={['Admin', 'Developer', 'Viewer']}
                            className="w-full"
                          />
                        </div>
                        {emails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(item.id)}
                            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-lg">close</span>
                          </button>
                        )}
                      </div>
                    ))}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={handleAddEmail}
                      className="text-primary font-mono text-xs flex items-center gap-1 mt-2 hover:underline cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span> Add another email
                    </motion.button>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(2)}
                    className="flex-1 border border-outline-variant/50 hover:bg-white/5 py-3 rounded-lg font-bold cursor-pointer"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCompleteSetup}
                    className="flex-[2] bg-primary text-on-primary py-3 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                  >
                    Complete Setup
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div className="relative z-10 flex flex-col items-center text-center">
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-[#002113] mb-6 shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                  >
                    <span className="material-symbols-outlined text-5xl font-bold">check_circle</span>
                  </motion.div>
                  <h1 className="font-bold text-display-lg text-on-surface mb-2">You're all set, Dev!</h1>
                  <p className="text-body-md text-on-surface-variant mb-6 max-w-sm">Your high-security gateway is initialized and ready for deployment.</p>

                  <div className="w-full bg-black/40 rounded-xl p-4 border border-outline-variant/30 text-left mb-6 font-mono text-xs space-y-2">
                    <h3 className="text-primary font-bold uppercase tracking-wider mb-2">Setup Summary</h3>
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1.5">
                      <span className="text-on-surface-variant">Project</span>
                      <span className="text-on-surface font-semibold">{projectName} ({environment})</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1.5">
                      <span className="text-on-surface-variant">Scopes</span>
                      <span className="text-primary font-semibold">{activeScopes.join(', ') || 'none'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Collaborators</span>
                      <span className="text-on-surface font-semibold">
                        {emails.filter(e => e.email.trim()).length} Invited
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-primary text-[#002113] py-3 rounded-lg font-bold text-headline-md hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                  >
                    Go to Dashboard
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
