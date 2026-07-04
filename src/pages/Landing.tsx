import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-on-surface flex flex-col relative overflow-hidden font-sans select-none">
      {/* Ambient background orbs */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-primary/10 filter blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-primary/5 filter blur-[100px] pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

      {/* Header bar */}
      <header className="h-20 w-full max-w-7xl mx-auto px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>vpn_key</span>
          </div>
          <div>
            <h1 className="font-bold text-primary leading-none" style={{ fontSize: 20 }}>KeyForge</h1>
            <p className="text-on-surface-variant text-[9px] uppercase tracking-wider font-bold mt-0.5">API Protection</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-on-surface-variant">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#security" className="hover:text-primary transition-colors">Security</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/sign-in')}
            className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            Sign In
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/sign-up')}
            className="btn-primary px-5 py-2 text-sm font-semibold shadow-emerald-sm rounded-lg cursor-pointer"
          >
            Sign Up Free
          </motion.button>
        </div>
      </header>

      {/* Main hero section */}
      <main className="flex-grow max-w-7xl mx-auto px-6 flex flex-col justify-center items-center text-center relative z-20 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Zero-Trust API Key infrastructure
          </div>

          <h2 className="font-extrabold text-on-surface tracking-tight leading-none mb-6" style={{ fontSize: 'clamp(32px, 6vw, 56px)' }}>
            Forge Secure, Lightning Fast <br />
            <span className="text-primary bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">API Key Gates</span>
          </h2>

          <p className="text-on-surface-variant text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            KeyForge empowers developers with dynamic key rotation, IP allowlisting firewalls, real-time traffic tracking, and immutable SHA-256 Hash-on-Write storage.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/sign-up')}
              className="btn-primary px-8 py-3 text-base font-bold shadow-emerald-md w-full sm:w-auto rounded-lg cursor-pointer flex items-center justify-center gap-2"
            >
              Get Started Free
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="#features"
              className="btn-secondary px-8 py-3 text-base font-semibold w-full sm:w-auto rounded-lg cursor-pointer flex items-center justify-center"
            >
              Explore Features
            </motion.a>
          </div>
        </motion.div>

        {/* Feature widgets (Bento Grid) */}
        <section id="features" className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 mb-16 text-left">
          {[
            { icon: 'shield', title: 'SHA-256 Hash-on-Write', desc: 'Raw private keys are salt-hashed on insertion and never exposed. Secure against database breaches.' },
            { icon: 'speed', title: 'Ultra-Low Latency', desc: 'Global caching ensures key validations are resolved in sub-millisecond ranges.' },
            { icon: 'dynamic_feed', title: 'Instant Key Rotation', desc: 'Seamless credential swaps without gateway downtime to protect against leakages.' },
          ].map(f => (
            <div key={f.title} className="bento-card p-6 flex flex-col justify-between border border-outline-variant/30 bg-[#121915]/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined">{f.icon}</span>
              </div>
              <h3 className="font-semibold text-on-surface text-base mb-2">{f.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Security Section */}
        <section id="security" className="w-full p-8 bento-card border border-primary/15 bg-primary/3 flex flex-col md:flex-row justify-between items-center gap-6 text-left mb-16">
          <div className="max-w-xl">
            <div className="inline-block px-2.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] uppercase font-mono tracking-wider font-bold mb-3">Enterprise Grade</div>
            <h3 className="font-bold text-on-surface text-2xl mb-3">Immutable Audit Trailing & WAF Firewalls</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Define allowed IP bounds directly on individual project tokens. Every key mutation, rotation, or deletion triggers a secure audit write to lock credentials down against rogue actions.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} className="p-4 rounded-xl bg-[#0a0f0d] border border-outline-variant/50 flex gap-3 items-center w-full md:w-auto">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>gpp_good</span>
            <div className="text-xs">
              <p className="font-semibold text-on-surface font-mono">100% Protection Rating</p>
              <p className="text-on-surface-variant mt-0.5">Firewall protection active globally.</p>
            </div>
          </motion.div>
        </section>

        {/* Pricing Plan Bento Section - Redesigned to be Completely Free */}
        <section id="pricing" className="w-full text-left mb-16">
          <div className="bento-card p-8 border border-primary/20 bg-primary/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-8 shadow-emerald-sm">
            <div className="max-w-xl">
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">100% Free</span>
              <h3 className="font-bold text-on-surface text-3xl mt-3 mb-2">Completely Free & Open Source</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                KeyForge is dedicated to securing API endpoints for developers everywhere. No hidden charges, no seat limits, and no active key quotas.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: 'hub', label: 'Unlimited Projects' },
                  { icon: 'key', label: 'Unlimited API Keys' },
                  { icon: 'history', label: 'Immutable Logs' },
                  { icon: 'bolt', label: 'Sub-ms Gateways' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs font-mono text-on-surface">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/sign-up')}
                className="w-full md:w-64 bg-primary text-[#002113] py-3.5 px-6 rounded-xl font-bold text-sm hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              >
                Start Protecting APIs →
              </motion.button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer bar */}
      <footer className="h-16 w-full max-w-7xl mx-auto px-6 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant z-20">
        <p>© 2026 KeyForge Inc. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#security" className="hover:text-primary transition-colors">Security Policy</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing Matrix</a>
        </div>
      </footer>
    </div>
  );
}
