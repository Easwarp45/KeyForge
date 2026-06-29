import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() !== '123456' && code.trim().toLowerCase() !== 'bypass') {
      setError('Invalid verification code. Enter "123456" to verify mock session.');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    navigate('/create-org');
  };

  const handleResend = async () => {
    alert('A new secure code has been sent to your email.');
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-on-surface flex flex-col items-center justify-center relative overflow-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-primary/10 filter blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[420px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl border-t-2 border-t-primary rounded-xl p-8 shadow-2xl relative z-20"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
          </div>
          <h2 className="font-bold text-headline-md text-on-surface mb-2">Check your mail</h2>
          <p className="text-body-md text-on-surface-variant max-w-xs">
            We have sent a verification code to authorize your email address.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
              Verification Code *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. 123456"
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              className="w-full bg-black/40 border border-outline-variant/50 rounded-lg p-3 text-center text-xl font-mono tracking-widest text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/35"
            />
          </div>

          {error && (
            <p className="text-xs text-error font-semibold flex items-center gap-1.5 justify-center">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || code.length < 3}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify Session'}
          </motion.button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-on-surface-variant">
            Didn't receive the email?{' '}
            <button
              onClick={handleResend}
              className="text-primary hover:underline cursor-pointer font-semibold"
            >
              Resend Code
            </button>
          </p>
          <div>
            <button
              onClick={() => { setCode('123456'); setError(''); }}
              className="text-[10px] font-mono text-on-surface-variant/40 hover:text-primary transition-colors cursor-pointer"
            >
              Auto-Fill Test Code (123456)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
