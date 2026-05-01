import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  Calendar,
  ChevronDown,
  Folder,
  GraduationCap,
  Home,
  Menu,
  Moon,
  Settings2,
  Sun,
  Terminal,
  Trophy,
  User,
  Users,
  Video,
  Wallet,
  X,
} from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

import { AppBackground } from '@/components/layout/AppBackground';
import { ActionButton, StatusBadge } from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { AuthIntent, GoogleUserInfo, Member } from '@/types';

import { ContactModal } from './ContactModal';
import { LoginNotification } from './LoginNotification';

type AppTheme = 'light' | 'dark';
type PreviewRole = 'guest' | 'community' | 'official' | 'core' | 'admin' | null;

type UiPermissionState = {
  previewRole: PreviewRole;
  previewLabel: string | null;
  previewOnly: boolean;
  canAccessFinance: boolean;
  canAccessAdmin: boolean;
  canAccessAcademyAdmin: boolean;
  canManageProjects: boolean;
  canManageEvents: boolean;
  canManageWork: boolean;
  canManageResources: boolean;
};

type ContactModalActions = {
  openContactModal: () => void;
};

type ShellActions = ContactModalActions & {
  openAuthModal: (mode?: AuthIntent) => void;
};

const ContactModalContext = createContext<ContactModalActions>({
  openContactModal: () => {},
});
const ShellActionsContext = createContext<ShellActions>({
  openContactModal: () => {},
  openAuthModal: () => {},
});
const UiPreviewContext = createContext<UiPermissionState>({
  previewRole: null,
  previewLabel: null,
  previewOnly: false,
  canAccessFinance: false,
  canAccessAdmin: false,
  canAccessAcademyAdmin: false,
  canManageProjects: false,
  canManageEvents: false,
  canManageWork: false,
  canManageResources: false,
});

export const useContactModal = () => useContext(ContactModalContext);
export const useShellActions = () => useContext(ShellActionsContext);
export const useUiPreview = () => useContext(UiPreviewContext);

interface GoogleJWTPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.localStorage.getItem('dsuc-theme') === 'dark' ? 'dark' : 'light';
}

function readPreviewRole(): PreviewRole {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem('dsuc-dev-role-preview');
  if (
    value === 'guest' ||
    value === 'community' ||
    value === 'official' ||
    value === 'core' ||
    value === 'admin'
  ) {
    return value;
  }
  return null;
}

function resolveUiPermissions(currentUser: Member | null, previewRole: PreviewRole): UiPermissionState {
  const baseIsOfficialMember = currentUser?.memberType === 'member';
  const baseIsAdmin =
    baseIsOfficialMember &&
    ['President', 'Vice-President'].includes(currentUser?.role || '');

  if (!previewRole) {
    return {
      previewRole: null,
      previewLabel: null,
      previewOnly: false,
      canAccessFinance: baseIsOfficialMember,
      canAccessAdmin: baseIsAdmin,
      canAccessAcademyAdmin: baseIsAdmin,
      canManageProjects: baseIsOfficialMember,
      canManageEvents: baseIsOfficialMember,
      canManageWork: baseIsOfficialMember,
      canManageResources: baseIsOfficialMember,
    };
  }

  if (previewRole === 'guest') {
    return {
      previewRole,
      previewLabel: 'Guest',
      previewOnly: !!currentUser,
      canAccessFinance: false,
      canAccessAdmin: false,
      canAccessAcademyAdmin: false,
      canManageProjects: false,
      canManageEvents: false,
      canManageWork: false,
      canManageResources: false,
    };
  }

  if (previewRole === 'community') {
    return {
      previewRole,
      previewLabel: 'Community Member',
      previewOnly: true,
      canAccessFinance: false,
      canAccessAdmin: false,
      canAccessAcademyAdmin: false,
      canManageProjects: false,
      canManageEvents: false,
      canManageWork: false,
      canManageResources: false,
    };
  }

  if (previewRole === 'official') {
    return {
      previewRole,
      previewLabel: 'Official Member',
      previewOnly: true,
      canAccessFinance: true,
      canAccessAdmin: false,
      canAccessAcademyAdmin: false,
      canManageProjects: true,
      canManageEvents: true,
      canManageWork: true,
      canManageResources: true,
    };
  }

  if (previewRole === 'core') {
    return {
      previewRole,
      previewLabel: 'Core Member',
      previewOnly: true,
      canAccessFinance: true,
      canAccessAdmin: false,
      canAccessAcademyAdmin: false,
      canManageProjects: true,
      canManageEvents: true,
      canManageWork: true,
      canManageResources: true,
    };
  }

  return {
    previewRole,
    previewLabel: 'President/Admin',
    previewOnly: true,
    canAccessFinance: true,
    canAccessAdmin: true,
    canAccessAcademyAdmin: true,
    canManageProjects: true,
    canManageEvents: true,
    canManageWork: true,
    canManageResources: true,
  };
}

function backgroundIntensity(pathname: string): 'low' | 'medium' | 'high' {
  if (pathname === '/home' || pathname === '/academy' || pathname === '/projects') {
    return 'high';
  }
  if (pathname.startsWith('/academy/unit') || pathname.startsWith('/finance') || pathname.startsWith('/admin')) {
    return 'low';
  }
  return 'medium';
}

export function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    authMethod,
    loginWithGoogle,
    addToast,
    removeToast,
    toasts,
  } = useStore();

  const [authMode, setAuthMode] = useState<AuthIntent>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showLoginNotification, setShowLoginNotification] = useState(false);
  const [lastLoginInfo, setLastLoginInfo] = useState<{ name?: string; method?: 'wallet' | 'google' }>({});
  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme());
  const [previewRole, setPreviewRole] = useState<PreviewRole>(() => readPreviewRole());

  const previousUserIdRef = React.useRef<string | null>(currentUser?.id || null);
  const requiresProfileCompletion =
    !!currentUser && currentUser.profile_completed === false;

  const uiPreview = useMemo(
    () => resolveUiPermissions(currentUser, previewRole),
    [currentUser, previewRole]
  );

  useEffect(() => {
    if (currentUser?.id && previousUserIdRef.current !== currentUser.id) {
      setLastLoginInfo({
        name: currentUser.name || currentUser.email || 'User',
        method: (authMethod as 'wallet' | 'google') || 'google',
      });
      setShowLoginNotification(true);
    }
    previousUserIdRef.current = currentUser?.id || null;
  }, [authMethod, currentUser?.email, currentUser?.id, currentUser?.name]);

  useEffect(() => {
    if (requiresProfileCompletion && location.pathname !== '/profile') {
      navigate('/profile?onboarding=1', { replace: true });
    }
  }, [location.pathname, navigate, requiresProfileCompletion]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('dsuc-theme', theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme !== 'dark');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme !== 'dark');
  }, [theme]);

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') {
      return;
    }

    if (previewRole) {
      window.localStorage.setItem('dsuc-dev-role-preview', previewRole);
      return;
    }

    window.localStorage.removeItem('dsuc-dev-role-preview');
  }, [previewRole]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const previousAlert = window.alert;
    window.alert = (message?: unknown) => {
      const content = typeof message === 'string' ? message : 'Action completed.';
      useStore.getState().addToast(content, content.includes('❌') ? 'error' : 'info');
    };

    return () => {
      window.alert = previousAlert;
    };
  }, []);

  const openAuthModal = (mode: AuthIntent = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <UiPreviewContext.Provider value={uiPreview}>
      <ShellActionsContext.Provider
        value={{
          openContactModal: () => setIsContactModalOpen(true),
          openAuthModal,
        }}
      >
        <ContactModalContext.Provider
          value={{
            openContactModal: () => setIsContactModalOpen(true),
          }}
        >
          <div className="relative min-h-screen bg-main-bg font-sans text-text-main selection:bg-primary selection:text-main-bg">
            <AppBackground intensity={backgroundIntensity(location.pathname)} />
            <SiteHeader
              onAuthClick={openAuthModal}
              onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
              theme={theme}
              uiPreview={uiPreview}
            />
            <main className="relative z-10 min-h-[calc(100vh-5rem)] px-4 pb-20 pt-24 md:px-6 lg:px-8">
              {children}
            </main>
            <footer className="relative z-10 border-t border-border-main bg-surface/70 px-4 py-6 text-center text-xs uppercase tracking-[0.22em] text-text-muted backdrop-blur md:px-6">
              DSUC Labs • Builder Operating System
            </footer>
            <AuthModal
              isOpen={isAuthModalOpen}
              mode={authMode}
              onClose={() => setIsAuthModalOpen(false)}
              onModeChange={setAuthMode}
              onSubmit={loginWithGoogle}
              onError={(message) => addToast(message, 'error')}
            />
            <ContactModal
              isOpen={isContactModalOpen}
              onClose={() => setIsContactModalOpen(false)}
            />
            <GlobalToasts toasts={toasts} onDismiss={removeToast} />
            <LoginNotification
              isVisible={showLoginNotification}
              userName={lastLoginInfo.name}
              authMethod={lastLoginInfo.method}
              onDismiss={() => setShowLoginNotification(false)}
            />
            {import.meta.env.DEV ? (
              <DevRolePreview
                previewRole={previewRole}
                previewLabel={uiPreview.previewLabel}
                onSelectRole={setPreviewRole}
              />
            ) : null}
          </div>
        </ContactModalContext.Provider>
      </ShellActionsContext.Provider>
    </UiPreviewContext.Provider>
  );
}

function SiteHeader({
  onAuthClick,
  onToggleTheme,
  theme,
  uiPreview,
}: {
  onAuthClick: (mode?: AuthIntent) => void;
  onToggleTheme: () => void;
  theme: AppTheme;
  uiPreview: UiPermissionState;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const primaryLinks = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Academy', path: '/academy', icon: GraduationCap },
    { name: 'Resources', path: '/resources', icon: Folder },
    { name: 'Projects', path: '/projects', icon: Folder },
  ];

  const operationsLinks = [
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy, locked: false },
    { name: 'Meet', path: '/meet', icon: Video, locked: false },
    { name: 'Work', path: '/work', icon: Briefcase, locked: false },
    { name: 'Finance', path: '/finance', icon: Wallet, locked: !uiPreview.canAccessFinance },
    { name: 'Admin', path: '/admin', icon: Settings2, locked: !uiPreview.canAccessAdmin },
    {
      name: 'Academy Admin',
      path: '/academy-admin',
      icon: GraduationCap,
      locked: !uiPreview.canAccessAcademyAdmin,
    },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border-main bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-main bg-primary text-main-bg shadow-soft-sm">
            <img src="/logo.png" alt="DSUC Labs" className="h-8 w-8 object-contain" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="font-heading text-lg font-semibold uppercase tracking-tight text-text-main">
              DSUC Labs
            </p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-text-muted">
              Learn • Build • Ship
            </p>
          </div>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {primaryLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                cn(
                  'nav-link',
                  isActive && 'nav-link-active'
                )
              }
            >
              <link.icon className="h-4 w-4" aria-hidden="true" />
              {link.name}
            </NavLink>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setOpsOpen(true)}
            onMouseLeave={() => setOpsOpen(false)}
          >
            <button
              type="button"
              className={cn(
                'nav-link',
                location.pathname.match(/\/(leaderboard|meet|work|finance|admin|academy-admin)/) &&
                  'nav-link-active'
              )}
            >
              <Terminal className="h-4 w-4" aria-hidden="true" />
              Operations
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>

            <AnimatePresence>
              {opsOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-3xl border border-border-main bg-surface-elevated p-2 shadow-soft-xl"
                >
                  {operationsLinks.map((link) =>
                    link.locked ? (
                      <div key={link.path} className="nav-link-disabled">
                        <div className="flex items-center gap-3">
                          <link.icon className="h-4 w-4" aria-hidden="true" />
                          <span>{link.name}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.22em] text-text-muted">
                          Locked
                        </span>
                      </div>
                    ) : (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                          cn('nav-link nav-link-ops', isActive && 'nav-link-active')
                        }
                      >
                        <link.icon className="h-4 w-4" aria-hidden="true" />
                        {link.name}
                      </NavLink>
                    )
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {uiPreview.previewLabel ? (
            <StatusBadge tone="warning">{uiPreview.previewLabel}</StatusBadge>
          ) : null}
          <button
            type="button"
            onClick={onToggleTheme}
            className="icon-button"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          {currentUser ? (
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="profile-chip"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border-main bg-primary/10">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-text-main">
                  {currentUser.name || 'User'}
                </p>
                <p className="truncate text-[11px] uppercase tracking-[0.2em] text-text-muted">
                  {currentUser.role || 'Member'}
                </p>
              </div>
            </button>
          ) : (
            <>
              <ActionButton variant="secondary" onClick={() => onAuthClick('login')}>
                Login
              </ActionButton>
              <ActionButton onClick={() => onAuthClick('signup')}>Register</ActionButton>
            </>
          )}
        </div>

        <button
          type="button"
          className="icon-button lg:hidden"
          onClick={() => setMobileMenuOpen((value) => !value)}
          aria-label="Open navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="border-t border-border-main bg-surface-elevated lg:hidden"
          >
            <div className="space-y-5 px-4 py-5">
              <div className="grid gap-2">
                {primaryLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) => cn('mobile-nav-link', isActive && 'mobile-nav-link-active')}
                  >
                    <link.icon className="h-4 w-4" aria-hidden="true" />
                    {link.name}
                  </NavLink>
                ))}
              </div>

              <div className="space-y-2">
                <p className="px-1 text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  Operations
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {operationsLinks.map((link) =>
                    link.locked ? (
                      <div key={link.path} className="mobile-nav-link mobile-nav-link-disabled">
                        <link.icon className="h-4 w-4" aria-hidden="true" />
                        {link.name}
                      </div>
                    ) : (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                          cn('mobile-nav-link', isActive && 'mobile-nav-link-active')
                        }
                      >
                        <link.icon className="h-4 w-4" aria-hidden="true" />
                        {link.name}
                      </NavLink>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-border-main pt-4">
                <button type="button" onClick={onToggleTheme} className="icon-button">
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
                {uiPreview.previewLabel ? <StatusBadge tone="warning">{uiPreview.previewLabel}</StatusBadge> : null}
                <div className="ml-auto flex items-center gap-2">
                  {currentUser ? (
                    <>
                      <ActionButton variant="secondary" onClick={() => navigate('/profile')}>
                        Profile
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={logout}>
                        Logout
                      </ActionButton>
                    </>
                  ) : (
                    <>
                      <ActionButton variant="secondary" onClick={() => onAuthClick('login')}>
                        Login
                      </ActionButton>
                      <ActionButton onClick={() => onAuthClick('signup')}>Register</ActionButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function AuthModal({
  isOpen,
  mode,
  onModeChange,
  onClose,
  onSubmit,
  onError,
}: {
  isOpen: boolean;
  mode: AuthIntent;
  onModeChange: (mode: AuthIntent) => void;
  onClose: () => void;
  onSubmit: (googleUserInfo: GoogleUserInfo, intent?: AuthIntent) => Promise<boolean>;
  onError: (message: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      return;
    }

    setIsLoading(true);
    try {
      const decoded = jwtDecode<GoogleJWTPayload>(credentialResponse.credential);
      const googleUserInfo: GoogleUserInfo = {
        email: decoded.email,
        google_id: decoded.sub,
        name: decoded.name,
        avatar: decoded.picture,
      };
      const success = await onSubmit(googleUserInfo, mode);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('[GoogleLogin] Error:', error);
      onError('Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-border-main bg-surface-elevated p-8 shadow-soft-xl"
      >
        <button type="button" onClick={onClose} className="icon-button absolute right-5 top-5">
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-5">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border-main bg-primary text-main-bg shadow-soft-sm">
            <Terminal className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="section-eyebrow">{mode === 'signup' ? 'Create Account' : 'Access DSUC'}</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold uppercase tracking-tight text-text-main">
              {mode === 'signup' ? 'Join The Builder Network' : 'Sign In To Continue'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              {mode === 'signup'
                ? 'Create your DSUC account with Google, then complete your profile on first access.'
                : 'Use the Google email already attached to your DSUC account.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border-main bg-main-bg p-1">
            <button
              type="button"
              onClick={() => onModeChange('signup')}
              className={cn('auth-mode-button', mode === 'signup' && 'auth-mode-button-active')}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className={cn('auth-mode-button', mode === 'login' && 'auth-mode-button-active')}
            >
              Login
            </button>
          </div>

          <div className="rounded-2xl border border-border-main bg-main-bg p-4">
            {isLoading ? (
              <div className="flex h-12 items-center justify-center text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">
                Processing…
              </div>
            ) : (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => onError('Google login failed. Please try again.')}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  width="100%"
                  text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                  shape="rectangular"
                />
              </div>
            )}
          </div>

          <p className="rounded-2xl border border-border-main bg-surface px-4 py-3 text-xs uppercase tracking-[0.18em] text-text-muted">
            {mode === 'signup'
              ? 'New accounts start as community members until permissions are granted by the club.'
              : 'If this email is not registered yet, switch to Register first.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function GlobalToasts({
  toasts,
  onDismiss,
}: {
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[10000] flex max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={cn(
              'pointer-events-auto toast-card',
              toast.type === 'error' && 'toast-error',
              toast.type === 'success' && 'toast-success',
              toast.type === 'info' && 'toast-info'
            )}
          >
            <p className="flex-1 whitespace-pre-wrap text-sm leading-6">{toast.message}</p>
            <button type="button" onClick={() => onDismiss(toast.id)} className="icon-button toast-close">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function DevRolePreview({
  previewRole,
  previewLabel,
  onSelectRole,
}: {
  previewRole: PreviewRole;
  previewLabel: string | null;
  onSelectRole: (value: PreviewRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: Array<{ label: string; value: PreviewRole }> = [
    { label: 'Guest', value: 'guest' },
    { label: 'Community Member', value: 'community' },
    { label: 'Official Member', value: 'official' },
    { label: 'Core Member', value: 'core' },
    { label: 'President/Admin', value: 'admin' },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-[10000]">
      {open ? (
        <div className="w-72 rounded-[28px] border border-border-main bg-surface-elevated p-4 shadow-soft-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="section-eyebrow">Dev Role Preview</p>
              <p className="mt-1 text-sm text-text-muted">
                {previewLabel ? `Previewing ${previewLabel}` : 'Using real auth state'}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="icon-button">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onSelectRole(null)}
              className={cn('dev-role-button', previewRole === null && 'dev-role-button-active')}
            >
              Real Auth State
            </button>
            {options.map((option) => (
              <button
                type="button"
                key={option.label}
                onClick={() => onSelectRole(option.value)}
                className={cn(
                  'dev-role-button',
                  previewRole === option.value && 'dev-role-button-active'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="dev-role-chip">
          Dev Role Preview
        </button>
      )}
    </div>
  );
}
