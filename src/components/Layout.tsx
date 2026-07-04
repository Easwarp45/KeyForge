import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import TopBar from './TopBar';
import Footer from './Footer';
import { supabaseClient } from '../api';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/projects', icon: 'folder', label: 'Projects' },
  { to: '/keys', icon: 'vpn_key', label: 'Keys' },
  { to: '/analytics', icon: 'leaderboard', label: 'Analytics' },
  { to: '/reports', icon: 'description', label: 'Reports' },
  { to: '/alerts', icon: 'notifications', label: 'Alerts' },
  { to: '/audits', icon: 'receipt_long', label: 'Audit Logs' },
  { to: '/team', icon: 'group', label: 'Team' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showSupportToast, setShowSupportToast] = useState(false);

  useEffect(() => {
    if (supabaseClient) {
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          navigate('/sign-in');
        }
      });

      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
          navigate('/sign-in');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [navigate]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
  };

  const handleSupport = () => {
    setShowSupportToast(true);
    setTimeout(() => setShowSupportToast(false), 3000);
  };

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden">
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col h-full py-6 px-4 bg-surface/80 backdrop-blur-xl border-r border-outline-variant/30 shadow-xl w-64 fixed left-0 top-0 z-50">
        {/* Logo — clicking goes to dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 px-2 mb-8 group"
        >
          <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container group-hover:shadow-emerald-sm transition-shadow">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>vpn_key</span>
          </div>
          <div className="text-left">
            <h1 className="font-bold text-primary leading-none group-hover:text-primary-fixed transition-colors" style={{ fontSize: 20 }}>KeyForge</h1>
            <p className="text-on-surface-variant mt-0.5" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>API Management</p>
          </div>
        </button>

        {/* New Key button */}
        <button
          onClick={() => navigate('/keys')}
          className="btn-primary w-full py-2 px-4 rounded-lg text-sm font-semibold mb-6 flex items-center justify-center gap-2 shadow-emerald-md"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          New Key
        </button>

        {/* Nav links */}
        <ul className="flex flex-col gap-0.5 flex-1">
          {navItems.map(({ to, icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="material-symbols-outlined transition-transform duration-200"
                      style={{ fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {icon}
                    </span>
                    <span>{label}</span>
                    {label === 'Alerts' && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-error animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Bottom links */}
        <div className="mt-auto border-t border-outline-variant/30 pt-4 flex flex-col gap-0.5">
          <button onClick={handleSupport} className="nav-item w-full text-left">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>help</span>
            Support
          </button>
          <button onClick={toggleTheme} className="nav-item w-full text-left">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>

      {/* Main area */}
      <div className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen overflow-y-auto">
        <TopBar />
        <main className="flex-1 p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>

      {/* Support toast */}
      <AnimatePresence>
        {showSupportToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-container-high border border-outline-variant/40 shadow-2xl"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>support_agent</span>
            <p className="text-on-surface text-sm font-medium">Opening support portal... <span className="text-primary">support@keyforge.dev</span></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
