
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
import { Leaderboard } from './pages/Leaderboard';
import { Meet } from './pages/Meet';
import { Resources } from './pages/Resources';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { AcademyHome } from './pages/AcademyHome';
import { AcademyTrack } from './pages/AcademyTrack';
import { AcademyLesson } from './pages/AcademyLesson';
import { Admin } from './pages/Admin';
import { AcademyLayout } from './components/academy/layout/AcademyLayout';
import { useStore } from './store/useStore';

// Google OAuth Client ID - set in environment variable
const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';

function AnimatedRoutes() {
  const location = useLocation();

  const { currentUser } = useStore();
  const isOfficialMember = currentUser?.memberType === 'member';
  const canAccessAcademy = !!currentUser && currentUser.academyAccess !== false;
  const isAdmin =
    isOfficialMember &&
    ['President', 'Vice-President'].includes(
      currentUser?.role || ''
    );
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
          <Route path="/finance" element={isOfficialMember ? <Finance /> : <Navigate to="/home" replace />} />
          <Route path="/work" element={<Work />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/meet" element={<Meet />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/home" replace />} />
          <Route
            path="/academy"
            element={
              <AcademyLayout>
                {canAccessAcademy ? <AcademyHome /> : <AcademyAccessGate />}
              </AcademyLayout>
            }
          />
          <Route
            path="/academy/track/:track"
            element={
              <AcademyLayout>
                {canAccessAcademy ? <AcademyTrack /> : <AcademyAccessGate />}
              </AcademyLayout>
            }
          />
          <Route
            path="/academy/learn/:track/:lesson"
            element={
              <AcademyLayout>
                {canAccessAcademy ? <AcademyLesson /> : <AcademyAccessGate />}
              </AcademyLayout>
            }
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AcademyAccessGate() {
  return (
    <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
      <div className="text-xs font-mono uppercase tracking-[0.3em] text-cyber-blue">
        DSUC Account Required
      </div>
      <h1 className="text-4xl font-display font-bold text-white">
        Sign in to access DSUC Academy
      </h1>
      <p className="text-white/60 max-w-xl mx-auto">
        Learning progress is now tied to your DSUC account so the academy can
        track who is learning, what they completed, and how they progress over
        time.
      </p>
    </div>
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
  const membersCount = useStore((state) => state.members.length);
  const financeHistoryCount = useStore((state) => state.financeHistory.length);
  const eventsCount = useStore((state) => state.events.length);
  const projectsCount = useStore((state) => state.projects.length);
  const resourcesCount = useStore((state) => state.resources.length);
  const bountiesCount = useStore((state) => state.bounties.length);
  const reposCount = useStore((state) => state.repos.length);

  useEffect(() => {
    console.log('[App] Initializing...');
    warmupBackend();
    checkSession();
  }, [warmupBackend, checkSession]);

  useEffect(() => {
    if (membersCount === 0) fetchMembers();
    if (financeHistoryCount === 0) fetchFinanceHistory();
    if (eventsCount === 0) fetchEvents();
    if (projectsCount === 0) fetchProjects();
    if (resourcesCount === 0) fetchResources();
    if (bountiesCount === 0) fetchBounties();
    if (reposCount === 0) fetchRepos();
  }, [
    fetchMembers,
    fetchFinanceHistory,
    fetchEvents,
    fetchProjects,
    fetchResources,
    fetchBounties,
    fetchRepos,
    membersCount,
    financeHistoryCount,
    eventsCount,
    projectsCount,
    resourcesCount,
    bountiesCount,
    reposCount,
  ]);

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
