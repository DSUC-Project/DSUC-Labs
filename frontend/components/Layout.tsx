import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { Home, Users, Calendar, Calculator, Briefcase, Folder, Menu, X, Terminal, User, Rocket, HelpCircle, GraduationCap, Trophy, Video } from 'lucide-react';
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

export function Layout({ children }: { children?: React.ReactNode }) {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthIntent>('login');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showLoginNotification, setShowLoginNotification] = useState(false);
  const [lastLoginInfo, setLastLoginInfo] = useState<{ name?: string; method?: 'wallet' | 'google' }>({});
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

  const openAuthModal = (mode: AuthIntent) => {
    setAuthMode(mode);
    setIsWalletModalOpen(true);
  };

  return (
    <ContactModalContext.Provider value={{ openContactModal: () => setIsContactModalOpen(true) }}>
      <div className="min-h-screen font-sans text-white selection:bg-cyber-yellow selection:text-black">
        <Background />
        <Navbar onAuthClick={openAuthModal} />
        <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
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
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-background">
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] opacity-20" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020408_100%)]" />

      {/* Blue Glow Top Center */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60vw] h-[30vh] bg-cyber-blue/20 blur-[100px] rounded-full mix-blend-screen" />

      {/* Scan Line */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-blue/5 to-transparent h-[20%] animate-scan opacity-30" />
    </div>
  );
}

type NavItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  locked?: boolean;
};

function Navbar({ onAuthClick }: { onAuthClick: (mode: AuthIntent) => void }) {
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
    { name: 'Academy', path: '/academy', icon: GraduationCap },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Projects', path: '/projects', icon: Rocket },
    { name: 'Resources', path: '/resources', icon: Folder },
  ];

  const workspaceLinks: NavItem[] = [
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Meet', path: '/meet', icon: Video },
    { name: 'Work', path: '/work', icon: Briefcase },
    { name: 'Finance', path: '/finance', icon: Calculator, locked: !isOfficialMember },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: HelpCircle }] : []),
  ];

  const allLinks = [...standardLinks, ...workspaceLinks];
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  return (
    <>
      {/* Navbar Container with improved spacing - Compact */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 pt-3">
        <nav className="relative w-full max-w-6xl bg-surface/90 backdrop-blur-xl border border-cyber-blue/30 rounded-lg px-4 md:px-5 py-2 md:py-3 shadow-[0_8px_32px_rgba(41,121,255,0.15)] transition-all duration-300">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-blue to-transparent opacity-60" />

          {/* Bottom glow */}


          <div className="flex items-center justify-between gap-4">
            {/* Logo Area - Better balanced & Compact */}
            <div className="flex items-center gap-2.5 text-cyber-blue font-display font-bold tracking-wider shrink-0">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="DSUC Logo"
                  className="w-7 h-7 md:w-8 md:h-8 object-contain drop-shadow-[0_0_10px_rgba(41,121,255,0.6)] transition-transform hover:scale-110 duration-300"
                />
                <div className="absolute inset-0 bg-cyber-blue/20 blur-xl rounded-full -z-10" />
              </div>
              <span className="hidden sm:inline text-xs md:text-sm whitespace-nowrap bg-gradient-to-r from-cyber-blue to-white bg-clip-text text-transparent">
                DSUC LAB
              </span>
            </div>

            {/* Desktop Nav - Improved spacing and sizing */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-3xl relative">
              {standardLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    twMerge(
                      "relative px-3 py-2 text-xs font-display font-bold uppercase tracking-wider transition-all duration-300 hover:text-cyber-yellow group rounded-md",
                      isActive ? "text-cyber-blue" : "text-white/70 hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10 flex items-center gap-2">
                        <link.icon size={14} className={isActive ? "text-cyber-blue" : "text-white/50 group-hover:text-cyber-yellow"} />
                        {link.name}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-glow"
                          className="absolute -bottom-1 left-2 right-2 h-[2px] bg-cyber-blue shadow-[0_0_10px_#2979FF]"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <div className="absolute inset-0 bg-cyber-blue/5 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 rounded-md pointer-events-none" />
                    </>
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
                    "relative px-3 py-2 text-xs font-display font-bold uppercase tracking-wider transition-all duration-300 hover:text-cyber-yellow group rounded-md cursor-pointer",
                    workspaceLinks.some((link) => location.pathname.startsWith(link.path))
                      ? "text-cyber-blue"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Terminal
                      size={14}
                      className={
                        workspaceLinks.some((link) => location.pathname.startsWith(link.path))
                          ? "text-cyber-blue"
                          : "text-white/50 group-hover:text-cyber-yellow"
                      }
                    />
                    Operations
                  </span>
                  {workspaceLinks.some((link) => location.pathname.startsWith(link.path)) && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute -bottom-1 left-2 right-2 h-[2px] bg-cyber-blue shadow-[0_0_10px_#2979FF]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className="absolute inset-0 bg-cyber-blue/5 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 rounded-md pointer-events-none" />
                </div>

                <AnimatePresence>
                  {workspaceOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-52 bg-surface/98 backdrop-blur-xl border border-cyber-blue/30 rounded-lg p-2 shadow-[0_8px_32px_rgba(41,121,255,0.15)] flex flex-col gap-1 z-50 overflow-hidden"
                    >
                      {workspaceLinks.map((link) => (
                        link.locked ? (
                          <div
                            key={link.path}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-display font-bold uppercase tracking-wider text-white/40 cursor-not-allowed rounded-md relative"
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
                                "flex items-center gap-2 px-3 py-2 text-xs font-display font-bold uppercase tracking-wider transition-all duration-300 hover:text-cyber-yellow hover:bg-cyber-blue/10 rounded-md relative group",
                                isActive ? "text-cyber-blue bg-cyber-blue/5" : "text-white/70 hover:text-white"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <link.icon size={14} className={isActive ? "text-cyber-blue" : "text-white/50 group-hover:text-cyber-yellow"} />
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

            {/* Right side actions - Better alignment */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Mobile menu button - moved to right side */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-cyber-blue hover:text-cyber-yellow transition-colors p-2 hover:bg-cyber-blue/10 rounded-md"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>

              {/* Wallet / Profile Button */}
              {isAuthenticated && currentUser ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2.5 pl-2 pr-4 py-2 bg-cyber-dark/50 border border-cyber-blue/50 rounded-lg hover:bg-cyber-blue/10 hover:border-cyber-blue transition-all duration-300 group"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-cyber-blue/50 overflow-hidden ring-2 ring-cyber-blue/20 group-hover:ring-cyber-blue/40 transition-all">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold font-mono text-cyber-blue group-hover:text-cyber-yellow transition-colors uppercase tracking-wider hidden md:inline">
                    {currentUser.name?.split(' ')[0] || 'User'}
                  </span>
                </button>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <button
                    onClick={() => onAuthClick('login')}
                    className="px-4 py-2 text-xs font-bold font-display uppercase tracking-widest transition-all duration-300 border border-cyber-blue/50 text-white hover:border-cyber-blue hover:bg-cyber-blue/10 rounded-lg"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => onAuthClick('signup')}
                    className="px-4 py-2 text-xs font-bold font-display uppercase tracking-widest transition-all duration-300 border border-cyber-yellow/60 bg-cyber-yellow text-black hover:bg-white hover:border-white rounded-lg"
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
              className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-[200] w-[85vw] max-w-sm bg-surface/98 backdrop-blur-xl lg:hidden flex flex-col border-l border-cyber-blue/30 shadow-[-8px_0_32px_rgba(41,121,255,0.2)]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-cyber-blue/20">
                <span className="font-display font-bold text-cyber-blue text-xl flex items-center gap-3">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(41,121,255,0.6)]" />
                  DSUC LAB
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/60 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-all"
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
                      className="text-lg font-display font-bold uppercase flex items-center gap-4 p-4 rounded-lg opacity-40 cursor-not-allowed border border-transparent"
                    >
                      <link.icon size={22} className="text-white/40" />
                      <span className="flex-1">{link.name}</span>
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">Locked</span>
                    </div>
                  ) : (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        twMerge(
                          "text-lg font-display font-bold uppercase flex items-center gap-4 p-4 rounded-lg transition-all duration-300",
                          isActive
                            ? "text-cyber-blue bg-cyber-blue/10 border border-cyber-blue/30 translate-x-2"
                            : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <link.icon size={22} className={isActive ? "text-cyber-blue" : "text-white/40"} />
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
                        "text-lg font-display font-bold uppercase flex items-center gap-4 p-4 rounded-lg transition-all duration-300",
                        isActive
                          ? "text-cyber-blue bg-cyber-blue/10 border border-cyber-blue/30 translate-x-2"
                          : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <User size={22} className={isActive ? "text-cyber-blue" : "text-white/40"} />
                        <span className="flex-1">MY PROFILE</span>
                      </>
                    )}
                  </NavLink>
                )}
              </div>

              {/* Footer - Sign In Button for mobile */}
              {!isAuthenticated && (
                <div className="p-6 border-t border-cyber-blue/20">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onAuthClick('login');
                    }}
                    className="w-full px-5 py-3.5 text-sm font-bold font-display uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 border border-cyber-blue/50 text-white hover:border-cyber-blue hover:bg-cyber-blue/10 rounded-lg shadow-[0_4px_16px_rgba(41,121,255,0.2)]"
                  >
                    <span>Log In</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onAuthClick('signup');
                    }}
                    className="w-full mt-3 px-5 py-3.5 text-sm font-bold font-display uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 border border-cyber-yellow/60 bg-cyber-yellow text-black hover:bg-white hover:border-white rounded-lg"
                  >
                    <span>Register</span>
                  </button>
                  <p className="text-[11px] text-white/40 text-center mt-3 leading-relaxed">
                    Use your Google email to join or access DSUC.<br />
                    <span className="text-cyber-yellow">New accounts must complete profile setup on first entry</span>
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
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface border border-cyber-blue/50 p-8 w-full max-w-sm cyber-clip-top shadow-[0_0_50px_rgba(41,121,255,0.15)]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X size={20} />
        </button>
        <div className="mb-6 text-center">
          <Terminal size={40} className="mx-auto text-cyber-blue mb-2" />
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
            {mode === 'signup' ? 'Register DSUC Account' : 'Log In To DSUC'}
          </h3>
          <p className="mt-2 text-xs text-white/50">
            {mode === 'signup'
              ? 'Create your account with Google first. You will complete your profile before using the app.'
              : 'Log in with the Google email already attached to your DSUC account.'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onModeChange('signup')}
              className={`py-2 text-xs font-bold font-display uppercase tracking-widest border rounded ${
                mode === 'signup'
                  ? 'border-cyber-yellow bg-cyber-yellow text-black'
                  : 'border-white/10 text-white/60 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => onModeChange('login')}
              className={`py-2 text-xs font-bold font-display uppercase tracking-widest border rounded ${
                mode === 'login'
                  ? 'border-cyber-blue bg-cyber-blue text-white'
                  : 'border-white/10 text-white/60 hover:text-white'
              }`}
            >
              Log In
            </button>
          </div>
          {/* Google Login Button */}
          <div className="flex justify-center">
            {isLoading ? (
              <div className="w-full p-4 border border-white/10 bg-white/5 flex items-center justify-center">
                <span className="text-white/60">Processing...</span>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="filled_black"
                  size="large"
                  width="100%"
                  text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                  shape="rectangular"
                />
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded p-4">
            <p className="text-xs text-white/60 font-mono text-center leading-relaxed">
              {mode === 'signup'
                ? 'Registration creates a DSUC community account first. Official member permissions are still granted by admin.'
                : 'If this email has no DSUC account yet, switch to Register first.'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
