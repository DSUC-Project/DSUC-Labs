
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { MemberDetail } from './pages/MemberDetail';
import { MyProfile } from './pages/MyProfile';
import { Events } from './pages/Events';
import { Finance } from './pages/Finance';
import { Work } from './pages/Work';
import { Resources } from './pages/Resources';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { useStore } from './store/useStore';

// Google OAuth Client ID - set in environment variable
const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';

function AnimatedRoutes() {
  const location = useLocation();

  const { currentUser } = useStore();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/member/:id" element={<MemberDetail />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/events" element={<Events />} />
          <Route path="/finance" element={currentUser ? <Finance /> : <Navigate to="/home" replace />} />
          <Route path="/work" element={currentUser ? <Work /> : <Navigate to="/home" replace />} />
          <Route path="/resources" element={<Resources />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const warmupBackend = useStore((state) => state.warmupBackend);
  const fetchMembers = useStore((state) => state.fetchMembers);
  const fetchFinanceHistory = useStore((state) => state.fetchFinanceHistory);
  const fetchEvents = useStore((state) => state.fetchEvents);
  const fetchProjects = useStore((state) => state.fetchProjects);
  const fetchResources = useStore((state) => state.fetchResources);
  const fetchBounties = useStore((state) => state.fetchBounties);
  const fetchRepos = useStore((state) => state.fetchRepos);
  const checkSession = useStore((state) => state.checkSession);

  // Fetch data when app loads
  useEffect(() => {
    console.log('[App] Initializing...');
    // Warmup backend FIRST - this starts the wake-up process
    warmupBackend();
    // Check for existing session
    checkSession();
    // Fetch data
    fetchMembers();
    fetchFinanceHistory();
    fetchEvents();
    fetchProjects();
    fetchResources();
    fetchBounties();
    fetchRepos();
  }, [warmupBackend, fetchMembers, fetchFinanceHistory, fetchEvents, fetchProjects, fetchResources, fetchBounties, fetchRepos, checkSession]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
