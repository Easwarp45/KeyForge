import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithOAuth, signUpWithEmail } from '../api';

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation before hitting the server
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      // WHY: Previously this ran a 1.5s timer and navigated to /verify-email
      // without creating any account. Now it calls Supabase's real signUp,
      // which creates the user and sends an email verification link automatically.
      await signUpWithEmail(email, password, name);
      navigate('/verify-email');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      // Map common Supabase errors to user-friendly messages
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('This email is already registered. Try signing in instead.');
      } else if (msg.toLowerCase().includes('password')) {
        setError('Password does not meet requirements. Use at least 8 characters.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0f0d] relative overflow-hidden">
      <div className="dot-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="auth-card rounded-xl overflow-hidden p-8 flex flex-col gap-6 shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>vpn_key</span>
              </div>
              <h1 className="text-white text-2xl font-extrabold tracking-tight">KeyForge</h1>
            </div>
            <div className="text-center">
              <h2 className="text-white text-3xl font-black leading-tight">Create account</h2>
              <p className="text-on-surface-variant text-base mt-2">Start managing your API keys securely</p>
            </div>
          </div>

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

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-outline-variant/30" />
            <span className="flex-shrink mx-4 text-on-surface-variant text-sm">or sign up with email</span>
            <div className="flex-grow border-t border-outline-variant/30" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="floating-label-group">
              <input
                type="text"
                id="name"
                placeholder=" "
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 text-white transition-all focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <label htmlFor="name" className="font-medium">Full Name</label>
            </div>

            <div className="floating-label-group">
              <input
                type="email"
                id="email"
                placeholder=" "
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={error ? 'signup-error' : undefined}
                className="w-full h-14 bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 text-white transition-all focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <label htmlFor="email" className="font-medium">Email Address</label>
            </div>

            <div className="floating-label-group">
              <input
                type="password"
                id="password"
                placeholder=" "
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={error ? 'signup-error' : undefined}
                className="w-full h-14 bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 text-white transition-all focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <label htmlFor="password" className="font-medium">Password (min 8 characters)</label>
            </div>

            {/* Error message — announced immediately to screen readers */}
            {error && (
              <p id="signup-error" role="alert" aria-live="assertive" className="text-error text-xs">
                {error}
              </p>
            )}

            <p className="text-on-surface-variant text-xs mt-1">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full h-12 font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: '#10b981', color: '#00422b' }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          <p className="text-center text-on-surface-variant text-sm">
            Already have an account?{' '}
            <button onClick={() => navigate('/sign-in')} className="text-primary font-bold hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </motion.main>
    </div>
  );
}
