import toast, { Toaster } from "react-hot-toast";
import React, { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "./Navbar";
import { AppBackground } from "./AppBackground";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useStore } from "@/store/useStore";
import { AuthIntent, GoogleUserInfo } from "@/types";
import { LoginNotification } from "../LoginNotification";
import { ContactModal } from "../ContactModal";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FlaskConical,
  Mail,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  consumePendingAuthAnnouncement,
  registerLoginModalListener,
} from "@/lib/authUi";

// Context for contact modal
export const ContactModalContext = createContext<{
  openContactModal: () => void;
}>({ openContactModal: () => {} });
export const useContactModal = () => useContext(ContactModalContext);

interface GoogleJWTPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

const getIntensityForPath = (path: string): "low" | "medium" | "high" => {
  if (
    path === "/" ||
    path.startsWith("/home") ||
    path.startsWith("/projects") ||
    path === "/academy"
  )
    return "high";
  if (
    path.startsWith("/academy/unit") ||
    path.startsWith("/finance") ||
    path.startsWith("/admin")
  )
    return "low";
  return "medium";
};

type AppTheme = "light" | "dark";

function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.localStorage.getItem("dsuc-theme") === "dark"
    ? "dark"
    : "light";
}

function isLocalHostname(hostname: string) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

function isLocalDevAuthEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  const env = (import.meta as any).env;
  const uiHost = window.location.hostname;
  const apiBase = env.VITE_API_BASE_URL || window.location.origin;

  try {
    const apiHost = new URL(apiBase, window.location.origin).hostname;
    return (
      env.VITE_ENABLE_LOCAL_AUTH === "true" ||
      (isLocalHostname(uiHost) && isLocalHostname(apiHost))
    );
  } catch {
    return false;
  }
}

export function PageShell() {
  const location = useLocation();
  const intensity = getIntensityForPath(location.pathname);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthIntent>("login");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showLoginNotification, setShowLoginNotification] = useState(false);
  const [lastLoginInfo, setLastLoginInfo] = useState<{
    name?: string;
    method?: "wallet" | "google" | "local";
  }>({});
  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme());

  const { currentUser } = useStore();
  const navigate = useNavigate();
  const requiresProfileCompletion =
    !!currentUser && currentUser.profile_completed === false;

  const openAuthModal = React.useCallback((mode: AuthIntent) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    const pendingMethod = consumePendingAuthAnnouncement();
    if (pendingMethod) {
      setLastLoginInfo({
        name: currentUser?.name || currentUser?.email || "User",
        method: pendingMethod,
      });
      setShowLoginNotification(true);
    }
  }, [currentUser?.email, currentUser?.id, currentUser?.name]);

  useEffect(() => registerLoginModalListener(openAuthModal), [openAuthModal]);

  useEffect(() => {
    if (requiresProfileCompletion && location.pathname !== "/profile") {
      navigate("/profile?onboarding=1", { replace: true });
    }
  }, [location.pathname, navigate, requiresProfileCompletion]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("dsuc-theme", theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme !== "dark");
  }, [theme]);

  return (
    <ContactModalContext.Provider
      value={{ openContactModal: () => setIsContactModalOpen(true) }}
    >
      <div className="relative min-h-screen flex flex-col font-sans text-text-main selection:bg-primary selection:text-main-bg">
        <AppBackground intensity={intensity} />

        <Navbar
          onAuthClick={openAuthModal}
          theme={theme}
          onToggleTheme={() =>
            setTheme((value) => (value === "dark" ? "light" : "dark"))
          }
        />

        {/* Route Transition Shell */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col pt-0 relative z-10"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        <footer className="mt-auto py-8 bg-surface/50 backdrop-blur text-center text-xs font-mono uppercase tracking-widest text-text-muted relative z-10">
          <p>DSUC Labs OS v2.0 &copy; {new Date().getFullYear()}</p>
        </footer>

        <Toaster
          position="bottom-right"
          toastOptions={{
            className:
              "border border-border-main bg-surface text-text-main shadow-sm font-mono text-sm",
            duration: 4000,
          }}
        />

        <RealAuthModal
          isOpen={isAuthModalOpen}
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setIsAuthModalOpen(false)}
          theme={theme}
        />
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
        <LoginNotification
          isVisible={showLoginNotification}
          userName={lastLoginInfo.name}
          authMethod={lastLoginInfo.method}
          onDismiss={() => setShowLoginNotification(false)}
        />
      </div>
    </ContactModalContext.Provider>
  );
}

function RealAuthModal({
  isOpen,
  mode,
  onModeChange,
  onClose,
  theme,
}: {
  isOpen: boolean;
  mode: AuthIntent;
  onModeChange: (mode: AuthIntent) => void;
  onClose: () => void;
  theme: AppTheme;
}) {
  const { loginWithGoogle, loginWithLocalAdmin } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const localDevAuthEnabled = React.useMemo(() => isLocalDevAuthEnabled(), []);

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (!credentialResponse.credential) return;
    setIsLoading(true);
    try {
      const decoded = jwtDecode<GoogleJWTPayload>(
        credentialResponse.credential,
      );
      const googleUserInfo: GoogleUserInfo = {
        email: decoded.email,
        google_id: decoded.sub,
        name: decoded.name,
        avatar: decoded.picture,
      };
      const success = await loginWithGoogle(googleUserInfo, mode);
      if (success) onClose();
    } catch (error) {
      console.error("[GoogleLogin] Error:", error);
      toast.error("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalAdminLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginWithLocalAdmin();
      if (success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "signup"
          ? "Create Your DSUC Access"
          : "Access Your DSUC Workspace"
      }
      label="ACCOUNT ACCESS"
      panelClassName="max-w-4xl border border-border-main"
      bodyClassName="p-0"
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border-b border-border-main bg-main-bg px-5 py-6 sm:px-7 sm:py-8 lg:border-r lg:border-b-0">
          <div className="inline-flex min-h-10 items-center gap-2 border border-border-main bg-surface px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-main">
            <Terminal className="h-4 w-4 text-primary" />
            {mode === "signup" ? "New Account Flow" : "Returning Member Flow"}
          </div>

          <div className="mt-6 flex flex-col gap-5">
            <div className="space-y-3">
              <h3 className="max-w-[14ch] font-heading text-3xl font-bold leading-none text-text-main sm:text-4xl">
                {mode === "signup"
                  ? "Create your DSUC identity."
                  : "Get back into your workspace."}
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-text-muted sm:text-base">
                {mode === "signup"
                  ? "Start with Google, then finish your profile to join the community and unlock the rest of the product cleanly."
                  : "Use the Google email already attached to your DSUC account. The modal stays compact on mobile and keeps the action in one place."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-border-main bg-surface p-4">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Step 1
                </p>
                <p className="mt-2 text-sm font-semibold text-text-main">
                  Authenticate with Google.
                </p>
              </div>

              <div className="border border-border-main bg-surface p-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Step 2
                </p>
                <p className="mt-2 text-sm font-semibold text-text-main">
                  DSUC matches the right account and permissions.
                </p>
              </div>

              <div className="border border-border-main bg-surface p-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Step 3
                </p>
                <p className="mt-2 text-sm font-semibold text-text-main">
                  Continue into profile, academy, and club tools.
                </p>
              </div>
            </div>

            <div className="border border-border-main bg-surface p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-border-main bg-primary/10 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    Account Rule
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-text-main">
                    {mode === "signup"
                      ? "Register creates a community account first. Official member privileges are still granted by DSUC admins after review."
                      : "If the email is not already registered, switch to Register first instead of retrying Login."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex gap-1 border border-border-main bg-main-bg p-1">
            <button
              type="button"
              onClick={() => onModeChange("signup")}
              className={cn(
                "flex min-h-11 flex-1 items-center justify-center px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                mode === "signup"
                  ? "bg-primary text-main-bg"
                  : "bg-transparent text-text-muted hover:bg-surface hover:text-text-main",
              )}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className={cn(
                "flex min-h-11 flex-1 items-center justify-center px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                mode === "login"
                  ? "bg-primary text-main-bg"
                  : "bg-transparent text-text-muted hover:bg-surface hover:text-text-main",
              )}
            >
              Log In
            </button>
          </div>

          <div className="mt-5 border border-border-main bg-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-border-main bg-main-bg text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-heading text-xl font-bold text-text-main">
                  {mode === "signup"
                    ? "Continue with Google"
                    : "Sign in with Google"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {mode === "signup"
                    ? "Use the email you want attached to your DSUC profile. You will land in onboarding if your profile is still incomplete."
                    : "Use the same email already linked to your DSUC account so the backend can restore the correct member record."}
                </p>
              </div>
            </div>

            <div className="mt-5">
              {isLoading ? (
                <div className="flex min-h-12 w-full items-center justify-center border border-border-main bg-main-bg px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-text-muted">
                  Processing...
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google login failed")}
                  useOneTap={false}
                  theme={theme === "dark" ? "filled_black" : "outline"}
                  size="large"
                  width="100%"
                  text={mode === "signup" ? "signup_with" : "signin_with"}
                  shape="rectangular"
                  logo_alignment="left"
                  containerProps={{
                    className:
                      "w-full flex justify-center [&>div]:!w-full [&>div]:!max-w-none [&>div]:min-h-12",
                  }}
                />
              )}
            </div>

            <p className="mt-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
              {mode === "signup"
                ? "Profile setup appears right after your first successful registration."
                : "If this email has no DSUC account yet, switch to Register above."}
            </p>
          </div>

          {localDevAuthEnabled && (
            <div className="mt-4 border border-dashed border-border-main bg-main-bg p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Local Testing Only
              </p>
              <button
                type="button"
                onClick={handleLocalAdminLogin}
                disabled={isLoading}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border border-border-main bg-surface px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-text-main transition-colors hover:bg-primary hover:text-main-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FlaskConical className="h-4 w-4" />
                Use Local Admin
              </button>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                Starts a mock admin session against the localhost backend without touching production auth.
              </p>
            </div>
          )}
        </section>
      </div>
    </ModalShell>
  );
}
