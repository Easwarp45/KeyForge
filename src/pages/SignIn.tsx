import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithOAuth } from '../api';

export default function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => navigate('/dashboard'), 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0f0d] relative overflow-hidden">
      {/* Dot grid */}
      <div className="dot-grid" />
      {/* Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="auth-card rounded-xl overflow-hidden p-8 flex flex-col gap-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>vpn_key</span>
              </div>
              <h1 className="text-white text-2xl font-extrabold tracking-tight">KeyForge</h1>
            </div>
            <div className="text-center">
              <h2 className="text-white text-3xl font-black leading-tight tracking-tight">Welcome back</h2>
              <p className="text-on-surface-variant text-base mt-2">Sign in to your account to continue</p>
            </div>
          </div>

          {/* Social auth */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => signInWithOAuth('github')}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-white font-bold transition-all border border-outline-variant/30 hover:border-primary/30 cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>terminal</span>
              Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => signInWithOAuth('google')}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-white font-bold transition-all border border-outline-variant/30 hover:border-primary/30 cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>account_circle</span>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-outline-variant/30" />
            <span className="flex-shrink mx-4 text-on-surface-variant text-sm">or continue with email</span>
            <div className="flex-grow border-t border-outline-variant/30" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="floating-label-group">
              <input
                type="email"
                id="email"
                placeholder=" "
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 text-white transition-all focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <label htmlFor="email" className="font-medium">Email Address</label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="floating-label-group">
                <input
                  type="password"
                  id="password"
                  placeholder=" "
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 text-white transition-all focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <label htmlFor="password" className="font-medium">Password</label>
              </div>
              <div className="flex justify-between items-center">
                {error && <p className="text-error text-xs">{error}</p>}
                <a href="#" className="text-primary text-sm font-semibold hover:underline ml-auto">Forgot password?</a>
              </div>
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading || success}
              className="w-full h-12 font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: success ? '#22c55e' : '#10b981', color: '#00422b' }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
                  Signing in...
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                  Success!
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="text-center text-on-surface-variant text-sm">
            Don't have an account?{' '}
            <button onClick={() => navigate('/sign-up')} className="text-primary font-bold hover:underline">
              Sign up
            </button>
          </p>
        </div>

        {/* System status */}
        <div className="mt-8 flex justify-center items-center gap-4 text-on-surface-variant/50">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-mono text-xs uppercase tracking-widest">Systems Operational</span>
          </div>
          <div className="w-px h-3 bg-outline-variant/30" />
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">shield_lock</span>
            <span className="font-mono text-xs uppercase tracking-widest">AES-256 Encrypted</span>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
