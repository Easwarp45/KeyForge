import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import KeyManager from './pages/KeyManager';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import ProjectDetails from './pages/ProjectDetails';
import Landing from './pages/Landing';
import VerifyEmail from './pages/VerifyEmail';
import CreateOrg from './pages/CreateOrg';

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Marketing / Auth pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/create-org" element={<CreateOrg />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* App pages */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/keys" element={<KeyManager />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
