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
import { Terminal, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function PageShell() {
  const location = useLocation();
  const intensity = getIntensityForPath(location.pathname);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthIntent>("login");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showLoginNotification, setShowLoginNotification] = useState(false);
  const [lastLoginInfo, setLastLoginInfo] = useState<{
    name?: string;
    method?: "wallet" | "google";
  }>({});
  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme());

  const { currentUser, authMethod } = useStore();
  const navigate = useNavigate();
  const previousUserIdRef = React.useRef<string | null>(
    currentUser?.id || null,
  );
  const requiresProfileCompletion =
    !!currentUser && currentUser.profile_completed === false;

  useEffect(() => {
    if (currentUser?.id && previousUserIdRef.current !== currentUser.id) {
      setLastLoginInfo({
        name: currentUser?.name || currentUser?.email || "User",
        method: (authMethod as "wallet" | "google") || "google",
      });
      setShowLoginNotification(true);
    }
    previousUserIdRef.current = currentUser?.id || null;
  }, [currentUser?.id, currentUser?.name, currentUser?.email, authMethod]);

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

  const openAuthModal = (mode: AuthIntent) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

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

        <footer className="mt-auto py-8 bg-surface/50 backdrop-blur text-center text-xs font-mono uppercase tracking-widest text-text-muted relative z-10 border-t  border-border-main">
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
}: {
  isOpen: boolean;
  mode: AuthIntent;
  onModeChange: (mode: AuthIntent) => void;
  onClose: () => void;
}) {
  const { loginWithGoogle } = useStore();
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "signup" ? "Register Account" : "Log In To DSUC"}
      label="AUTHENTICATION"
    >
      <div className="space-y-6">
        <div className="mb-6 text-center">
          <div className="bg-primary w-16 h-16 mx-auto mb-4  flex items-center justify-center">
            <Terminal size={32} className="text-main-bg" />
          </div>
          <p className="mt-2 text-sm text-text-muted border-t border-dashed border-border-main pt-2">
            {mode === "signup"
              ? "Create your account with Google first. You will complete your profile before using the app."
              : "Log in with the Google email already attached to your DSUC account."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex bg-main-bg border border-border-main p-1 gap-1">
            <button
              type="button"
              onClick={() => onModeChange("signup")}
              className={cn(
                "flex-1 py-3 text-sm font-bold font-heading uppercase tracking-widest border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                mode === "signup"
                  ? "border-primary bg-primary text-main-bg shadow-[2px_2px_0_0_#1a1b26]"
                  : "border-transparent text-text-muted hover:text-text-main hover:bg-surface",
              )}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className={cn(
                "flex-1 py-3 text-sm font-bold font-heading uppercase tracking-widest border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                mode === "login"
                  ? "border-primary bg-primary text-main-bg shadow-[2px_2px_0_0_#1a1b26]"
                  : "border-transparent text-text-muted hover:text-text-main hover:bg-surface",
              )}
            >
              Log In
            </button>
          </div>

          <div className="flex justify-center border border-border-main p-2 bg-main-bg">
            {isLoading ? (
              <div className="w-full p-4 flex items-center justify-center bg-surface font-mono font-bold">
                <span className="text-text-main animate-pulse">
                  PROCESSING...
                </span>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google login failed")}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  width="100%"
                  text={mode === "signup" ? "signup_with" : "signin_with"}
                  shape="rectangular"
                />
              </div>
            )}
          </div>

          <div className="bg-main-bg border border-border-main border-dashed p-4">
            <p className="text-[10px] text-text-main font-mono text-center leading-relaxed font-bold opacity-80">
              {mode === "signup"
                ? "> REGISTRATION CREATES A DSUC COMMUNITY ACCOUNT. INITIAL MEMBER PERMISSIONS GRANTED BY ADMIN."
                : "> IF THIS EMAIL HAS NO DSUC ACCOUNT YET, SWITCH TO REGISTER FIRST."}
            </p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
