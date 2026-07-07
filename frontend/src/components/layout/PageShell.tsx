import toast, { Toaster } from "react-hot-toast";
import React, { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "./Navbar";
import { AppBackground } from "./AppBackground";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import {
  type BootstrapStatus,
  type LocalDevRole,
  useStore,
} from "@/store/useStore";
import { type AuthIntent, type GoogleUserInfo } from "@/types";
import { LoginNotification } from "../LoginNotification";
import { ContactModal } from "../ContactModal";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FlaskConical,
  LoaderCircle,
  Mail,
  RefreshCw,
  ServerCrash,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale";
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
  const { text } = useLocale();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthIntent>("login");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showLoginNotification, setShowLoginNotification] = useState(false);
  const [lastLoginInfo, setLastLoginInfo] = useState<{
    name?: string;
    method?: "wallet" | "google" | "local";
  }>({});
  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme());

  const {
    bootstrapError,
    bootstrapStatus,
    currentUser,
    fetchBootstrapData,
    members,
    events,
    projects,
    resources,
    bounties,
    repos,
  } = useStore();
  const navigate = useNavigate();
  const requiresProfileCompletion =
    !!currentUser && currentUser.profile_completed === false;
  const hasPublicData = [
    members,
    events,
    projects,
    resources,
    bounties,
    repos,
  ].some((items) => items.length > 0);

  // Only hard-block the entire UI during the very first load.
  // Once we hit "slow", prefer showing real layout + partial content / skeletons.
  const showInitialDataScreen =
    !hasPublicData &&
    (bootstrapStatus === "idle" || bootstrapStatus === "loading");

  const showInitialDataError = !hasPublicData && bootstrapStatus === "error";

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
        <BackendWakeBanner
          status={bootstrapStatus}
          error={bootstrapError}
          hasPublicData={hasPublicData}
          onRetry={() => void fetchBootstrapData()}
        />

        {/* Route Transition Shell */}
        <AnimatePresence mode="wait">
          <motion.main
            key={
              showInitialDataScreen || showInitialDataError
                ? "initial-data"
                : location.pathname
            }
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col pt-0 relative z-10"
          >
            {showInitialDataScreen || showInitialDataError ? (
              <InitialDataScreen
                status={bootstrapStatus}
                error={bootstrapError}
                onRetry={() => void fetchBootstrapData()}
              />
            ) : (
              <Outlet />
            )}
          </motion.main>
        </AnimatePresence>

        <footer className="mt-auto py-8 bg-surface/50 backdrop-blur text-center text-xs font-mono uppercase tracking-widest text-text-muted relative z-10">
          <p>
            {text("DSUC Labs OS v2.0", "DSUC Labs OS v2.0")} &copy;{" "}
            {new Date().getFullYear()}
          </p>
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

function BackendWakeBanner({
  status,
  error,
  hasPublicData,
  onRetry,
}: {
  status: BootstrapStatus;
  error: string | null;
  hasPublicData: boolean;
  onRetry: () => void;
}) {
  const { text } = useLocale();
  const isError = status === "error";
  // Show banner during slow (waking up) even if we have no data yet.
  // This lets us render partial UI + inform user.
  const isVisible = status === "slow" || isError;

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key="backend-wake-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          role={isError ? "alert" : "status"}
          aria-live="polite"
          className="relative z-30 border-y border-border-main bg-surface/95 px-4 py-3 text-text-main backdrop-blur"
        >
          <div className="container mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center border border-border-main bg-main-bg",
                  isError ? "text-red-500" : "text-primary",
                )}
                aria-hidden="true"
              >
                {isError ? (
                  <ServerCrash className="h-4 w-4" />
                ) : (
                  <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  {isError
                    ? text("Live data refresh failed", "Chưa làm mới được dữ liệu live")
                    : text("Backend is waking up", "Backend đang khởi động")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-main">
                  {isError
                    ? text(
                        "Showing cached content. Try again when the backend is awake.",
                        "Đang hiển thị dữ liệu cache. Thử lại khi backend đã thức.",
                      )
                    : hasPublicData
                      ? text(
                          "Render free tier can take about 15 seconds after sleep. Cached content stays visible.",
                          "Render free tier có thể mất khoảng 15 giây sau khi sleep. Nội dung cache vẫn được giữ lại.",
                        )
                      : text(
                          "Backend is waking up (~15s). Live data will appear shortly.",
                          "Backend đang khởi động (~15s). Dữ liệu live sẽ hiện trong giây lát.",
                        )}
                </p>
                {isError && error && (
                  <p className="mt-1 break-words font-mono text-[10px] uppercase tracking-widest text-text-muted">
                    {error}
                  </p>
                )}
              </div>
            </div>

            {isError && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-border-main bg-main-bg px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-main transition-colors hover:bg-primary hover:text-main-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {text("Retry", "Thử lại")}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InitialDataScreen({
  status,
  error,
  onRetry,
}: {
  status: BootstrapStatus;
  error: string | null;
  onRetry: () => void;
}) {
  const { text } = useLocale();
  const isError = status === "error";
  const isSlow = status === "slow";

  return (
    <div
      className="container mx-auto flex max-w-7xl flex-1 flex-col gap-8 px-4 py-8 md:py-12"
      role={isError ? "alert" : "status"}
      aria-busy={!isError}
      aria-live="polite"
    >
      <section className="border border-border-main bg-surface p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center border border-border-main bg-main-bg",
                isError ? "text-red-500" : "text-primary",
              )}
              aria-hidden="true"
            >
              {isError ? (
                <ServerCrash className="h-5 w-5" />
              ) : (
                <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                {isError
                  ? text("Live data unavailable", "Chưa tải được dữ liệu live")
                  : text("Initializing live data", "Đang khởi tạo dữ liệu live")}
              </p>
              <h1 className="mt-2 font-heading text-3xl font-black uppercase tracking-tight text-text-main md:text-4xl">
                {isError
                  ? text("Could not load DSUC data", "Chưa tải được dữ liệu DSUC")
                  : text("Starting DSUC Labs", "Đang khởi động DSUC Labs")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
                {isError
                  ? text(
                      "The live backend did not respond. Try again in a moment.",
                      "Backend live chưa phản hồi. Thử lại sau một chút.",
                    )
                  : isSlow
                    ? text(
                        "The backend is waking up. This usually takes about 15 seconds after sleep.",
                        "Backend đang thức dậy. Thường mất khoảng 15 giây sau khi sleep.",
                      )
                    : text(
                        "Loading member profiles and public workspace data.",
                        "Đang tải hồ sơ thành viên và dữ liệu public của workspace.",
                      )}
              </p>
              {isError && error && (
                <p className="mt-2 break-words font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  {error}
                </p>
              )}
            </div>
          </div>

          {isError && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-border-main bg-main-bg px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-text-main transition-colors hover:bg-primary hover:text-main-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {text("Retry", "Thử lại")}
            </button>
          )}
        </div>
      </section>

      <section className="space-y-5" aria-hidden="true">
        <div className="flex items-center justify-between gap-4">
          <div className="h-7 w-48 bg-surface motion-safe:animate-pulse" />
          <div className="hidden h-5 w-24 bg-surface motion-safe:animate-pulse sm:block" />
        </div>
        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="min-h-48 border border-border-main bg-surface motion-safe:animate-pulse"
            >
              <div className="h-14 bg-main-bg" />
              <div className="space-y-3 px-4 pb-4 pt-6">
                <div className="h-4 w-3/4 bg-main-bg" />
                <div className="h-3 w-1/2 bg-main-bg" />
                <div className="flex gap-2">
                  <div className="h-6 w-14 bg-main-bg" />
                  <div className="h-6 w-20 bg-main-bg" />
                </div>
                <div className="h-8 bg-main-bg" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
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
  const { text } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [localDevRole, setLocalDevRole] = useState<LocalDevRole>("admin");
  const localDevAuthEnabled = React.useMemo(() => isLocalDevAuthEnabled(), []);
  const localRoleCopy: Record<
    LocalDevRole,
    {
      label: string;
      description: string;
    }
  > = {
    admin: {
      label: text("Admin", "Admin"),
      description: text(
        "President permissions for admin, finance, and academy management.",
        "Quyền President để test admin, tài chính và quản lý academy.",
      ),
    },
    member: {
      label: text("Member", "Member"),
      description: text(
        "Official member access for events, projects, finance, and submissions.",
        "Quyền thành viên chính thức để test events, projects, finance và submit.",
      ),
    },
    community: {
      label: text("Community", "Community"),
      description: text(
        "Community profile with limited club permissions and onboarding checks.",
        "Tài khoản community với quyền CLB giới hạn và luồng onboarding.",
      ),
    },
  };

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
      toast.error(
        text(
          "Google login failed. Please try again.",
          "Đăng nhập Google thất bại. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalAdminLogin = async () => {
    setIsLoading(true);
    try {
      const success = await loginWithLocalAdmin(localDevRole);
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
          ? text("Create Your DSUC Access", "Tạo quyền truy cập DSUC")
          : text("Access Your DSUC Workspace", "Truy cập workspace DSUC")
      }
      label={text("ACCOUNT ACCESS", "TRUY CẬP TÀI KHOẢN")}
      panelClassName="max-w-4xl border border-border-main"
      bodyClassName="p-0"
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border-b border-border-main bg-main-bg px-5 py-6 sm:px-7 sm:py-8 lg:border-r lg:border-b-0">
          <div className="inline-flex min-h-10 items-center gap-2 border border-border-main bg-surface px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-main">
            <Terminal className="h-4 w-4 text-primary" />
            {mode === "signup"
              ? text("New Account Flow", "Luồng tạo tài khoản mới")
              : text("Returning Member Flow", "Luồng thành viên quay lại")}
          </div>

          <div className="mt-6 flex flex-col gap-5">
            <div className="space-y-3">
              <h3 className="max-w-[14ch] font-heading text-3xl font-bold leading-none text-text-main sm:text-4xl">
                {mode === "signup"
                  ? text("Create your DSUC identity.", "Tạo danh tính DSUC của bạn.")
                  : text("Get back into your workspace.", "Quay lại workspace của bạn.")}
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-text-muted sm:text-base">
                {mode === "signup"
                  ? text(
                      "Start with Google, then finish your profile to join the community and unlock the rest of the product cleanly.",
                      "Bắt đầu bằng Google, sau đó hoàn thiện hồ sơ để tham gia cộng đồng và mở khóa đầy đủ các chức năng.",
                    )
                  : text(
                      "Use the Google email already attached to your DSUC account. The modal stays compact on mobile and keeps the action in one place.",
                      "Dùng email Google đã liên kết với tài khoản DSUC của bạn. Modal này được giữ gọn trên mobile để thao tác tập trung hơn.",
                    )}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-border-main bg-surface p-4">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  {text("Step 1", "Bước 1")}
                </p>
                <p className="mt-2 text-sm font-semibold text-text-main">
                  {text("Authenticate with Google.", "Xác thực bằng Google.")}
                </p>
              </div>

              <div className="border border-border-main bg-surface p-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  {text("Step 2", "Bước 2")}
                </p>
                <p className="mt-2 text-sm font-semibold text-text-main">
                  {text(
                    "DSUC matches the right account and permissions.",
                    "DSUC đối chiếu đúng tài khoản và quyền truy cập.",
                  )}
                </p>
              </div>

              <div className="border border-border-main bg-surface p-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  {text("Step 3", "Bước 3")}
                </p>
                <p className="mt-2 text-sm font-semibold text-text-main">
                  {text(
                    "Continue into profile, academy, and club tools.",
                    "Tiếp tục vào hồ sơ, Academy và các công cụ của CLB.",
                  )}
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
                    {text("Account Rule", "Quy tắc tài khoản")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-text-main">
                    {mode === "signup"
                      ? text(
                          "Register creates a community account first. Official member privileges are still granted by DSUC admins after review.",
                          "Đăng ký sẽ tạo tài khoản community trước. Quyền thành viên chính thức vẫn do admin DSUC cấp sau khi xét duyệt.",
                        )
                      : text(
                          "If the email is not already registered, switch to Register first instead of retrying Login.",
                          "Nếu email này chưa được đăng ký, hãy chuyển sang Register thay vì thử đăng nhập lại.",
                        )}
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
              {text("Register", "Đăng ký")}
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
              {text("Log In", "Đăng nhập")}
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
                      ? text("Continue with Google", "Tiếp tục với Google")
                      : text("Sign in with Google", "Đăng nhập bằng Google")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {mode === "signup"
                      ? text(
                          "Use the email you want attached to your DSUC profile. You will land in onboarding if your profile is still incomplete.",
                          "Dùng email mà bạn muốn gắn với hồ sơ DSUC. Nếu hồ sơ chưa đủ thông tin, bạn sẽ được đưa tới bước onboarding.",
                        )
                      : text(
                          "Use the same email already linked to your DSUC account so the backend can restore the correct member record.",
                          "Dùng đúng email đã liên kết với tài khoản DSUC để hệ thống khôi phục đúng hồ sơ thành viên.",
                        )}
                  </p>
                </div>
              </div>

            <div className="mt-5">
              {isLoading ? (
                <div className="flex min-h-12 w-full items-center justify-center border border-border-main bg-main-bg px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-text-muted">
                  {text("Processing...", "Đang xử lý...")}
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() =>
                    toast.error(
                      text(
                        "Google login failed",
                        "Đăng nhập Google thất bại",
                      ),
                    )
                  }
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
                ? text(
                    "Profile setup appears right after your first successful registration.",
                    "Bước thiết lập hồ sơ sẽ hiện ngay sau lần đăng ký thành công đầu tiên.",
                  )
                : text(
                    "If this email has no DSUC account yet, switch to Register above.",
                    "Nếu email này chưa có tài khoản DSUC, hãy chuyển sang Register ở phía trên.",
                  )}
            </p>
          </div>

          {localDevAuthEnabled && (
            <div className="mt-4 border border-dashed border-border-main bg-main-bg p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                {text("Local Testing Only", "Chỉ dành cho test local")}
              </p>
              <div className="mt-3 space-y-2">
                <label
                  htmlFor="local-dev-role"
                  className="block text-sm font-semibold text-text-main"
                >
                  {text("Mock account role", "Role tài khoản mock")}
                </label>
                <select
                  id="local-dev-role"
                  value={localDevRole}
                  onChange={(event) =>
                    setLocalDevRole(event.target.value as LocalDevRole)
                  }
                  disabled={isLoading}
                  className="min-h-11 w-full border border-border-main bg-surface px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(Object.keys(localRoleCopy) as LocalDevRole[]).map((role) => (
                    <option key={role} value={role}>
                      {localRoleCopy[role].label}
                    </option>
                  ))}
                </select>
                <p className="text-sm leading-relaxed text-text-muted">
                  {localRoleCopy[localDevRole].description}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLocalAdminLogin}
                disabled={isLoading}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border border-border-main bg-surface px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-text-main transition-colors hover:bg-primary hover:text-main-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FlaskConical className="h-4 w-4" />
                {isLoading
                  ? text("Signing in...", "Đang đăng nhập...")
                  : text("Use Local Account", "Dùng tài khoản local")}
              </button>
              <p className="mt-3 text-sm leading-relaxed text-text-muted">
                {text(
                  "Starts a mock session against the localhost backend without touching production auth.",
                  "Khởi động phiên giả lập với backend localhost mà không đụng tới luồng xác thực production.",
                )}
              </p>
            </div>
          )}
        </section>
      </div>
    </ModalShell>
  );
}
