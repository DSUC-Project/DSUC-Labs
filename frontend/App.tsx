
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Layout, useUiPreview } from './components/Layout';
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
import { AcademyPath } from './pages/AcademyPath';
import { AcademyCourse } from './pages/AcademyCourse';
import { AcademyUnit } from './pages/AcademyUnit';
import { AcademyTrack } from './pages/AcademyTrack';
import { AcademyLesson } from './pages/AcademyLesson';
import { Admin } from './pages/Admin';
import { AcademyAdmin } from './pages/AcademyAdmin';
import { useStore } from './store/useStore';

// Google OAuth Client ID - set in environment variable
const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';

function AnimatedRoutes() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const uiPreview = useUiPreview();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
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
          <Route path="/finance" element={uiPreview.canAccessFinance ? <Finance /> : <Navigate to="/home" replace />} />
          <Route path="/work" element={<Work />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/meet" element={<Meet />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/admin" element={uiPreview.canAccessAdmin ? <Admin /> : <Navigate to="/home" replace />} />
          <Route path="/academy-admin" element={uiPreview.canAccessAcademyAdmin ? <AcademyAdmin /> : <Navigate to="/home" replace />} />
          <Route path="/academy" element={<AcademyHome />} />
          <Route path="/academy/path/:pathId" element={<AcademyPath />} />
          <Route path="/academy/course/:courseId" element={<AcademyCourse />} />
          <Route path="/academy/unit/:courseId/:unitId" element={<AcademyUnit />} />
          <Route path="/academy/community/:track" element={<AcademyTrack />} />
          <Route path="/academy/community/:track/:lesson" element={<AcademyLesson />} />
          <Route path="/academy/track/:track" element={<LegacyCommunityTrackRedirect />} />
          <Route path="/academy/learn/:track/:lesson" element={<LegacyCommunityLessonRedirect />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function LegacyCommunityTrackRedirect() {
  const { track = '' } = useParams<{ track: string }>();
  return <Navigate to={`/academy/community/${track}`} replace />;
}

function LegacyCommunityLessonRedirect() {
  const { track = '', lesson = '' } = useParams<{ track: string; lesson: string }>();
  return <Navigate to={`/academy/community/${track}/${lesson}`} replace />;
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
