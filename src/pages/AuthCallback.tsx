import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase puts the tokens in the URL hash after OAuth redirect.
    // The Supabase client detects the hash automatically via onAuthStateChange.
    if (!supabaseClient) {
      // No Supabase — just go to dashboard in dev mode
      navigate('/dashboard', { replace: true });
      return;
    }

    // Listen for the session to be set from the OAuth hash
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        navigate('/dashboard', { replace: true });
      } else if (event === 'SIGNED_OUT') {
        setError('Authentication failed. Please try again.');
      }
    });

    // Safety fallback: if no auth event fires within 5s, re-check session
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Authentication timed out. Please try signing in again.');
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background, #0f0f13)',
        gap: '20px',
      }}
    >
      {error ? (
        <>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <p style={{ color: '#ef4444', fontSize: 16, fontFamily: 'Inter, sans-serif', textAlign: 'center', maxWidth: 380 }}>
            {error}
          </p>
          <a
            href="/sign-in"
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              textDecoration: 'none',
            }}
          >
            Back to Sign In
          </a>
        </>
      ) : (
        <>
          {/* Animated spinner */}
          <div
            style={{
              width: 48,
              height: 48,
              border: '3px solid rgba(139,92,246,0.2)',
              borderTop: '3px solid #8b5cf6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
            Completing sign in…
          </p>
        </>
      )}
    </div>
  );
}
