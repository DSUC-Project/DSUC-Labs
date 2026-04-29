import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { Home, Users, Calendar, Calculator, Briefcase, Folder, Menu, X, Terminal, User, Rocket, HelpCircle, GraduationCap, Trophy, Video, Moon, Sun } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useStore } from '../store/useStore';
import { AuthIntent, GoogleUserInfo } from '../types';
import { LoginNotification } from './LoginNotification';
import { ContactModal } from './ContactModal';

// Context for contact modal
const ContactModalContext = createContext<{ openContactModal: () => void }>({ openContactModal: () => { } });
export const useContactModal = () => useContext(ContactModalContext);

// Interface for decoded Google JWT
interface GoogleJWTPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

type AppTheme = 'light' | 'dark';

function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.localStorage.getItem('dsuc-theme') === 'dark' ? 'dark' : 'light';
}

export function Layout({ children }: { children?: React.ReactNode }) {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthIntent>('login');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showLoginNotification, setShowLoginNotification] = useState(false);
  const [lastLoginInfo, setLastLoginInfo] = useState<{ name?: string; method?: 'wallet' | 'google' }>({});
  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme());
  const { currentUser, authMethod } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const previousUserIdRef = React.useRef<string | null>(currentUser?.id || null);
  const isAuthenticated = !!currentUser;
  const requiresProfileCompletion =
    !!currentUser && currentUser.profile_completed === false;

  // Show notification when user logs in
  useEffect(() => {
    if (currentUser?.id && previousUserIdRef.current !== currentUser.id) {
      setLastLoginInfo({
        name: currentUser?.name || currentUser?.email || 'User',
        method: (authMethod as 'wallet' | 'google') || 'google'
      });
      setShowLoginNotification(true);
    }
    previousUserIdRef.current = currentUser?.id || null;
  }, [currentUser?.id, currentUser?.name, currentUser?.email, authMethod]);

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
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme !== 'dark');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme !== 'dark');
  }, [theme]);

  const openAuthModal = (mode: AuthIntent) => {
    setAuthMode(mode);
    setIsWalletModalOpen(true);
  };

  return (
    <ContactModalContext.Provider value={{ openContactModal: () => setIsContactModalOpen(true) }}>
      <div className={`min-h-screen bg-brutal-bg text-brutal-black font-sans selection:bg-brutal-pink selection:text-white ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <Background />
        <Navbar onAuthClick={openAuthModal} theme={theme} onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))} />
        <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
          {children}
        </main>
        <WalletModal
          isOpen={isWalletModalOpen}
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setIsWalletModalOpen(false)}
        />
        <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
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

function Background() {
  return (
    <div className="dsuc-dot-grid fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-20"></div>
  );
}

type NavItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  locked?: boolean;
};

function Navbar({
  onAuthClick,
  onToggleTheme,
  theme,
}: {
  onAuthClick: (mode: AuthIntent) => void;
  onToggleTheme: () => void;
  theme: AppTheme;
}) {
  const { currentUser } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = !!currentUser;
  const isOfficialMember = currentUser?.memberType === 'member';
  const isAdmin =
    isOfficialMember &&
    ['President', 'Vice-President'].includes(
      currentUser?.role || ''
    );

  const standardLinks: NavItem[] = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Academy', path: '/academy', icon: GraduationCap },
    { name: 'Resources', path: '/resources', icon: Folder },
    { name: 'Projects', path: '/projects', icon: Rocket },
  ];

  const workspaceLinks: NavItem[] = [
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Meet', path: '/meet', icon: Video },
    { name: 'Work', path: '/work', icon: Briefcase },
    { name: 'Finance', path: '/finance', icon: Calculator, locked: !isOfficialMember },
    ...(isAdmin ? [
      { name: 'Admin', path: '/admin', icon: HelpCircle },
      { name: 'Academy Admin', path: '/academy-admin', icon: GraduationCap },
    ] : []),
  ];

  const allLinks = [...standardLinks, ...workspaceLinks];
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pt-3 pointer-events-none">
        <nav className="relative w-full max-w-7xl bg-white border-4 border-brutal-black shadow-neo-lg px-4 md:px-6 py-2 md:py-3 transition-all duration-300 pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-brutal-black shrink-0">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="DSUC Logo"
                  className="w-8 h-8 md:w-10 md:h-10 object-contain transition-transform hover:rotate-6 hover:scale-110 duration-300"
                />
              </div>
              <span className="hidden sm:inline text-lg md:text-xl font-display font-black tracking-tighter uppercase">
                DSUC LAB
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-3xl relative">
              {standardLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    twMerge(
                      "relative px-3 py-2 text-xs font-display font-bold uppercase tracking-wider transition-all duration-300 group rounded-none border-2 border-transparent",
                      isActive ? "bg-brutal-yellow border-brutal-black shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]" : "text-gray-600 hover:text-brutal-black hover:bg-gray-100"
                    )
                  }
                >
                  {({ isActive }) => (
                    <span className="relative z-10 flex items-center gap-2">
                      <link.icon size={14} className={isActive ? "text-brutal-black" : "text-gray-500 group-hover:text-brutal-black"} />
                      {link.name}
                    </span>
                  )}
                </NavLink>
              ))}

              <div
                className="relative group"
                onMouseEnter={() => setWorkspaceOpen(true)}
                onMouseLeave={() => setWorkspaceOpen(false)}
              >
                <div
                  className={twMerge(
                    "relative px-3 py-2 text-xs font-display font-bold uppercase tracking-wider transition-all duration-300 group rounded-none cursor-pointer border-2 border-transparent",
                    workspaceLinks.some((link) => location.pathname.startsWith(link.path))
                      ? "bg-brutal-blue text-white border-brutal-black shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]"
                      : "text-gray-600 hover:text-brutal-black hover:bg-gray-100"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Terminal
                      size={14}
                      className={
                        workspaceLinks.some((link) => location.pathname.startsWith(link.path))
                          ? "text-white"
                          : "text-gray-500 group-hover:text-brutal-black"
                      }
                    />
                    Operations
                  </span>
                </div>

                <AnimatePresence>
                  {workspaceOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-52 bg-white brutal-card p-2 flex flex-col gap-1 z-50 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={onToggleTheme}
                        className="mb-1 flex items-center gap-2 border-2 border-brutal-black bg-white px-3 py-2 text-xs font-display font-bold uppercase tracking-wider text-brutal-black transition-all hover:bg-brutal-yellow"
                      >
                        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                      </button>
                      {workspaceLinks.map((link) => (
                        link.locked ? (
                          <div
                            key={link.path}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-display font-bold uppercase tracking-wider text-gray-400 cursor-not-allowed relative"
                            title="Member account required"
                          >
                            <link.icon size={14} className="opacity-60" />
                            {link.name} (Locked)
                          </div>
                        ) : (
                          <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                              twMerge(
                                "flex items-center gap-2 px-3 py-2 text-xs font-display font-bold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 group border-2 border-transparent",
                                isActive ? "bg-brutal-yellow border-brutal-black shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]" : "text-gray-600 hover:text-brutal-black"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <link.icon size={14} className={isActive ? "text-brutal-black" : "text-gray-500 group-hover:text-brutal-black"} />
                                {link.name}
                              </>
                            )}
                          </NavLink>
                        )
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-brutal-black hover:bg-brutal-yellow border-2 border-transparent hover:border-brutal-black hover:shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] transition-all p-2"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>

              {isAuthenticated && currentUser ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2.5 border-4 border-brutal-black bg-white pl-2 pr-4 py-2 shadow-brutal-sm transition-all duration-100 group hover:-translate-y-0.5 hover:bg-brutal-yellow hover:shadow-brutal-hover active:translate-y-0.5"
                >
                  <div className="w-8 h-8 border-2 border-brutal-black overflow-hidden bg-gray-100">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <span className="text-xs font-bold font-mono text-brutal-black uppercase tracking-wider hidden md:inline">
                    {currentUser.name?.split(' ')[0] || 'User'}
                  </span>
                </button>
              ) : (
                <div className="hidden lg:flex items-center gap-3">
                  <button
                    onClick={() => onAuthClick('login')}
                    className="px-5 py-2.5 text-sm font-black font-display uppercase tracking-widest transition-all duration-200 border-4 border-brutal-black bg-brutal-pink text-brutal-black hover:bg-white shadow-neo hover:-translate-y-1 hover:shadow-neo-lg active:translate-y-0 active:shadow-neo whitespace-nowrap"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => onAuthClick('signup')}
                    className="px-5 py-2.5 text-sm font-black font-display uppercase tracking-widest transition-all duration-200 border-4 border-brutal-black bg-brutal-yellow text-brutal-black hover:bg-white shadow-neo hover:-translate-y-1 hover:shadow-neo-lg active:translate-y-0 active:shadow-neo whitespace-nowrap"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay - Improved */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-[200] w-[85vw] max-w-sm bg-white border-l-4 border-brutal-black lg:hidden flex flex-col shadow-[-8px_0_0_0_rgba(17,24,39,1)]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b-4 border-brutal-black bg-brutal-yellow">
                <span className="font-display font-black text-brutal-black text-xl flex items-center gap-3 uppercase tracking-tighter">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                  DSUC LAB
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-brutal-black hover:bg-white border-2 border-transparent hover:border-brutal-black p-2 transition-all shadow-[2px_2px_0px_0px_transparent] hover:shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-2 p-6 flex-1 overflow-y-auto">
                {allLinks.map((link) => (
                  link.locked ? (
                    <div
                      key={link.path}
                      className="text-lg font-display font-bold uppercase flex items-center gap-4 p-4 opacity-40 cursor-not-allowed border-4 border-gray-200 bg-gray-100 text-gray-500"
                    >
                      <link.icon size={22} className="text-gray-400" />
                      <span className="flex-1">{link.name}</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">Locked</span>
                    </div>
                  ) : (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        twMerge(
                          "text-lg font-display font-bold uppercase flex items-center gap-4 p-4 transition-all duration-100 border-4",
                          isActive
                            ? "text-brutal-black bg-brutal-pink border-brutal-black shadow-brutal translate-x-1"
                            : "text-gray-700 hover:text-brutal-black hover:bg-brutal-yellow border-transparent hover:border-brutal-black hover:shadow-brutal hover:-translate-y-1"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <link.icon size={22} className={isActive ? "text-brutal-black" : "text-gray-500"} />
                          <span className="flex-1">{link.name}</span>
                        </>
                      )}
                    </NavLink>
                  )
                ))}

                {isAuthenticated && currentUser && (
                  <NavLink
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      twMerge(
                        "text-lg font-display font-bold uppercase flex items-center gap-4 p-4 transition-all duration-100 border-4",
                        isActive
                          ? "text-brutal-black bg-brutal-pink border-brutal-black shadow-brutal translate-x-1"
                          : "text-gray-700 hover:text-brutal-black hover:bg-brutal-yellow border-transparent hover:border-brutal-black hover:shadow-brutal hover:-translate-y-1"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <User size={22} className={isActive ? "text-brutal-black" : "text-gray-500"} />
                        <span className="flex-1">MY PROFILE</span>
                      </>
                    )}
                  </NavLink>
                )}

                <div className="mt-4 border-t-4 border-brutal-black pt-4">
                  <div className="mb-2 text-[11px] font-black uppercase tracking-widest text-gray-500">
                    Operations
                  </div>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="flex min-h-12 w-full items-center gap-4 border-4 border-brutal-black bg-white p-4 text-left text-lg font-display font-bold uppercase transition-all hover:-translate-y-1 hover:bg-brutal-yellow hover:shadow-brutal"
                  >
                    {theme === 'dark' ? <Sun size={22} className="text-brutal-black" /> : <Moon size={22} className="text-brutal-black" />}
                    <span className="flex-1 text-brutal-black">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                  </button>
                </div>
              </div>

              {/* Footer - Sign In Button for mobile */}
              {!isAuthenticated && (
                <div className="p-6 border-t-4 border-brutal-black bg-gray-50">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onAuthClick('login');
                    }}
                    className="w-full px-5 py-3.5 text-sm font-bold font-display uppercase tracking-widest transition-all duration-100 flex items-center justify-center gap-3 text-brutal-black bg-white border-4 border-brutal-black shadow-brutal hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-1 active:shadow-brutal-active"
                  >
                    <span>Log In</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onAuthClick('signup');
                    }}
                    className="w-full mt-4 px-5 py-3.5 text-sm font-bold font-display uppercase tracking-widest transition-all duration-100 flex items-center justify-center gap-3 text-brutal-black bg-brutal-yellow border-4 border-brutal-black shadow-brutal hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-1 active:shadow-brutal-active"
                  >
                    <span>Register</span>
                  </button>
                  <p className="text-[11px] text-gray-500 font-mono text-center mt-4 leading-relaxed">
                    Use your Google email to join or access DSUC.<br />
                    <span className="text-brutal-red font-bold">New accounts must complete profile setup on first entry</span>
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function WalletModal({
  isOpen,
  mode,
  onModeChange,
  onClose,
}: {
  isOpen: boolean,
  mode: AuthIntent,
  onModeChange: (mode: AuthIntent) => void,
  onClose: () => void,
}) {
  const { loginWithGoogle } = useStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      console.error('No credential received from Google');
      return;
    }

    setIsLoading(true);
    try {
      // Decode the JWT to get user info
      const decoded = jwtDecode<GoogleJWTPayload>(credentialResponse.credential);
      console.log('[GoogleLogin] Decoded token:', decoded);

      const googleUserInfo: GoogleUserInfo = {
        email: decoded.email,
        google_id: decoded.sub,
        name: decoded.name,
        avatar: decoded.picture,
      };

      const success = await loginWithGoogle(googleUserInfo, mode);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('[GoogleLogin] Error:', error);
      alert('Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('[GoogleLogin] Google login failed');
    alert('Google login failed. Please try again.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white border-4 border-brutal-black p-8 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(17,24,39,1)]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-black border-2 border-transparent hover:border-black hover:bg-gray-100 p-1">
          <X size={20} />
        </button>
        <div className="mb-6 text-center">
          <div className="bg-brutal-blue w-16 h-16 mx-auto mb-4 border-4 border-brutal-black flex items-center justify-center shadow-brutal">
            <Terminal size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-display font-black text-brutal-black uppercase tracking-tighter">
            {mode === 'signup' ? 'Register Account' : 'Log In To DSUC'}
          </h3>
          <p className="mt-2 text-sm text-gray-600 font-sans border-t-2 border-dashed border-gray-300 pt-2">
            {mode === 'signup'
              ? 'Create your account with Google first. You will complete your profile before using the app.'
              : 'Log in with the Google email already attached to your DSUC account.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex bg-gray-100 border-4 border-brutal-black p-1 gap-1">
            <button
              onClick={() => onModeChange('signup')}
              className={`flex-1 py-3 text-sm font-bold font-display uppercase tracking-widest border-2 transition-all ${
                mode === 'signup'
                  ? 'border-brutal-black bg-brutal-yellow text-black shadow-brutal-sm'
                  : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-200'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => onModeChange('login')}
              className={`flex-1 py-3 text-sm font-bold font-display uppercase tracking-widest border-2 transition-all ${
                mode === 'login'
                  ? 'border-brutal-black bg-brutal-blue text-white shadow-brutal-sm'
                  : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-200'
              }`}
            >
              Log In
            </button>
          </div>
          {/* Google Login Button */}
          <div className="flex justify-center border-4 border-brutal-black p-2 bg-gray-50 shadow-brutal">
            {isLoading ? (
              <div className="w-full p-4 flex items-center justify-center bg-gray-200 font-mono font-bold">
                <span className="text-brutal-black animate-pulse">PROCESSING...</span>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
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

          <div className="bg-gray-50 border-4 border-brutal-black p-4 shadow-brutal-sm">
            <p className="text-xs text-brutal-black font-mono text-center leading-relaxed">
              {mode === 'signup'
                ? '> REGISTRATION CREATES A DSUC COMMUNITY ACCOUNT INITIAL MEMBER PERMISSIONS ARE GRANTED BY ADMIN.'
                : '> IF THIS EMAIL HAS NO DSUC ACCOUNT YET, SWITCH TO REGISTER FIRST.'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
