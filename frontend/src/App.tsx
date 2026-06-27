/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { PageShell } from "./components/layout/PageShell";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { Home } from "./pages/Home";
import { Members } from "./pages/Members";
import { MemberDetail } from "./pages/MemberDetail";
import { Events } from "./pages/Events";
import { Finance } from "./pages/Finance";
import { AcademyHome } from "./pages/AcademyHome";
import { AcademyPath } from "./pages/AcademyPath";
import { AcademyCourse } from "./pages/AcademyCourse";
import { AcademyUnit } from "./pages/AcademyUnit";
import { AcademyTrack } from "./pages/AcademyTrack";
import { AcademyLesson } from "./pages/AcademyLesson";
import { Resources } from "./pages/Resources";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Leaderboard } from "./pages/Leaderboard";
import { Meet } from "./pages/Meet";
import { Work } from "./pages/Work";
import { Admin } from "./pages/Admin";
import { AcademyAdmin } from "./pages/AcademyAdmin";
import { MyProfile } from "./pages/MyProfile";
import { useStore } from "./store/useStore";
import { LocaleProvider } from "./lib/locale";
import { LoadingScreen } from "./components/ui/LoadingScreen";

const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "";
const BACKEND_KEEPALIVE_INTERVAL_MS = 1000 * 60 * 13;

function OfficialMemberRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useStore((state) => state.currentUser);
  return currentUser?.memberType === "member" ? (
    <>{children}</>
  ) : (
    <Navigate to="/home" replace />
  );
}

function ExecutiveAdminRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useStore((state) => state.currentUser);
  const isExecutiveAdmin =
    currentUser?.memberType === "member" &&
    ["President", "Vice-President"].includes(currentUser?.role || "");

  return isExecutiveAdmin ? <>{children}</> : <Navigate to="/home" replace />;
}

function LegacyCommunityTrackRedirect() {
  const { track = "" } = useParams<{ track: string }>();
  return <Navigate to={`/academy/community/${track}`} replace />;
}

function LegacyCommunityLessonRedirect() {
  const { track = "", lesson = "" } = useParams<{
    track: string;
    lesson: string;
  }>();
  return <Navigate to={`/academy/community/${track}/${lesson}`} replace />;
}

export default function App() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const warmupBackend = useStore((state) => state.warmupBackend);
  const backendStatus = useStore((state) => state.backendStatus);
  const fetchMembers = useStore((state) => state.fetchMembers);
  const fetchFinanceHistory = useStore((state) => state.fetchFinanceHistory);
  const fetchEvents = useStore((state) => state.fetchEvents);
  const fetchProjects = useStore((state) => state.fetchProjects);
  const fetchResources = useStore((state) => state.fetchResources);
  const fetchBounties = useStore((state) => state.fetchBounties);
  const fetchRepos = useStore((state) => state.fetchRepos);
  const checkSession = useStore((state) => state.checkSession);

  useEffect(() => {
    if (isBootstrapping || backendStatus !== "online") {
      return;
    }

    const base = (import.meta as any).env.VITE_API_BASE_URL || "";
    let cancelled = false;

    const pingBackend = async () => {
      try {
        await fetch(`${base}/api/health`, {
          method: "GET",
          cache: "no-store",
        });
      } catch {
        // Keepalive is best-effort. If it misses, the next user request can wake it again.
      }
    };

    const timerId = window.setInterval(() => {
      if (!cancelled) {
        void pingBackend();
      }
    }, BACKEND_KEEPALIVE_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, [backendStatus, isBootstrapping]);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrapFromBackend() {
      await warmupBackend();

      if (isCancelled) {
        return;
      }

      await checkSession();

      if (isCancelled) {
        return;
      }

      await Promise.all([
        fetchMembers(),
        fetchFinanceHistory(),
        fetchEvents(),
        fetchProjects(),
        fetchResources(),
        fetchBounties(),
        fetchRepos(),
      ]);

      if (!isCancelled) {
        setIsBootstrapping(false);
      }
    }

    void bootstrapFromBackend();

    return () => {
      isCancelled = true;
    };
  }, [
    warmupBackend,
    checkSession,
    fetchMembers,
    fetchFinanceHistory,
    fetchEvents,
    fetchProjects,
    fetchResources,
    fetchBounties,
    fetchRepos,
  ]);

  if (isBootstrapping) {
    return (
      <LoadingScreen
        message={
          backendStatus === "offline"
            ? "Backend is waking up. Retrying..."
            : backendStatus === "online"
              ? "Loading live data..."
              : "Connecting to live data..."
        }
      />
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LocaleProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<PageShell />}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/members" element={<Members />} />
              <Route path="/members/:id" element={<MemberDetail />} />
              <Route path="/member/:id" element={<MemberDetail />} />
              <Route path="/events" element={<Events />} />
              <Route
                path="/finance"
                element={
                  <OfficialMemberRoute>
                    <Finance />
                  </OfficialMemberRoute>
                }
              />
              <Route path="/academy" element={<AcademyHome />} />
              <Route path="/academy/path/:pathId" element={<AcademyPath />} />
              <Route
                path="/academy/course/:courseId"
                element={<AcademyCourse />}
              />
              <Route
                path="/academy/course/:courseId/:unitId"
                element={<AcademyUnit />}
              />
              <Route
                path="/academy/unit/:courseId/:unitId"
                element={<AcademyUnit />}
              />
              <Route
                path="/academy/community/:track"
                element={<AcademyTrack />}
              />
              <Route
                path="/academy/community/:track/:lesson"
                element={<AcademyLesson />}
              />
              <Route
                path="/academy/track/:track"
                element={<LegacyCommunityTrackRedirect />}
              />
              <Route
                path="/academy/learn/:track/:lesson"
                element={<LegacyCommunityLessonRedirect />}
              />
              <Route path="/academy/:track" element={<AcademyTrack />} />
              <Route path="/academy/:track/:lesson" element={<AcademyLesson />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/meet" element={<Meet />} />
              <Route path="/work" element={<Work />} />
              <Route
                path="/admin"
                element={
                  <ExecutiveAdminRoute>
                    <Admin />
                  </ExecutiveAdminRoute>
                }
              />
              <Route
                path="/academy-admin"
                element={
                  <ExecutiveAdminRoute>
                    <AcademyAdmin />
                  </ExecutiveAdminRoute>
                }
              />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LocaleProvider>
    </GoogleOAuthProvider>
  );
}
