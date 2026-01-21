import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { Home, Users, Calendar, Calculator, Briefcase, Folder, Wallet, Menu, X, Terminal, User, Rocket, Mail, HelpCircle, ExternalLink } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useStore } from '../store/useStore';
import { GoogleUserInfo } from '../types';
import { LoginNotification } from './LoginNotification';

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
  const [showLoginNotification, setShowLoginNotification] = useState(false);
  const [lastLoginInfo, setLastLoginInfo] = useState<{ name?: string; method?: 'wallet' | 'google' }>({});
  const { isWalletConnected, currentUser, authMethod } = useStore();
  const previousConnectionRef = React.useRef(isWalletConnected);

  // Show notification when user logs in
  useEffect(() => {
    if (isWalletConnected && !previousConnectionRef.current) {
      setLastLoginInfo({
        name: currentUser?.name || currentUser?.email || 'User',
        method: (authMethod as 'wallet' | 'google') || 'wallet'
      });
      setShowLoginNotification(true);
    }
    previousConnectionRef.current = isWalletConnected;
  }, [isWalletConnected, currentUser?.name, currentUser?.email, authMethod]);

  return (
    <div className="min-h-screen font-sans text-white selection:bg-cyber-yellow selection:text-black">
      <Background />
      <Navbar onConnectClick={() => setIsWalletModalOpen(true)} />
      <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {children}
      </main>
      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
      <LoginNotification
        isVisible={showLoginNotification}
        userName={lastLoginInfo.name}
        authMethod={lastLoginInfo.method}
        onDismiss={() => setShowLoginNotification(false)}
      />
    </div>
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

function Navbar({ onConnectClick }: { onConnectClick: () => void }) {
  const { isWalletConnected, disconnectWallet, currentUser } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // All navigation links (visible in navbar)
  const allLinks = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Projects', path: '/projects', icon: Rocket },
    { name: 'Finance', path: '/finance', icon: Calculator, locked: !currentUser },
    { name: 'Work', path: '/work', icon: Briefcase, locked: !currentUser },
    { name: 'Resources', path: '/resources', icon: Folder },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[9000] flex justify-center px-2 md:px-4">
        {/* Cyber Deck Navbar Container - Compact */}
        <nav className="relative w-full max-w-5xl bg-surface/80 backdrop-blur-md border-b border-l border-r border-cyber-blue/30 px-3 md:px-6 py-2.5 md:py-3 nav-shape shadow-[0_5px_20px_rgba(41,121,255,0.2)]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-cyber-blue/50" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-cyber-blue shadow-[0_0_10px_#2979FF]" />

          <div className="flex items-center justify-between gap-4">
            {/* Logo Area - Compact */}
            <div className="flex items-center gap-2 text-cyber-blue font-display font-bold tracking-wider shrink-0 ml-4 md:ml-6">
              <img src="/logo.png" alt="DSUC Logo" className="w-7 h-7 md:w-8 md:h-8 object-contain drop-shadow-[0_0_8px_rgba(41,121,255,0.5)]" />
              <span className="hidden sm:inline text-xs md:text-sm whitespace-nowrap">DSUC LAB</span>
            </div>

            {/* Desktop Nav - All Links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {allLinks.map((link) => (
                link.locked ? (
                  <div
                    key={link.path}
                    className={twMerge(
                      "relative px-2.5 py-2 text-[11px] font-display font-bold uppercase tracking-wide transition-all duration-300 group cursor-not-allowed opacity-40",
                      "hover:text-white/60"
                    )}
                    title="Login to access"
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {link.name}
                    </span>
                  </div>
                ) : (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      twMerge(
                        "relative px-2.5 py-2 text-[11px] font-display font-bold uppercase tracking-wide transition-all duration-300 hover:text-cyber-yellow group",
                        isActive ? "text-cyber-blue" : "text-white/60"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10 flex items-center gap-1.5">
                          {link.name}
                        </span>
                        {isActive && (
                          <motion.div
                            layoutId="nav-glow"
                            className="absolute -bottom-0.5 left-0 right-0 h-[1px] bg-cyber-blue shadow-[0_0_8px_#2979FF]"
                          />
                        )}
                        <div className="absolute inset-0 bg-cyber-blue/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-center pointer-events-none" />
                      </>
                    )}
                  </NavLink>
                )
              ))}
            </div>

            {/* Mobile Toggle - Bên trái trên mobile */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(true)} className="text-cyber-blue">
                <Menu size={24} />
              </button>
            </div>

            {/* Wallet / Profile Button - Bên phải */}
            {isWalletConnected && currentUser ? (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-cyber-dark border border-cyber-blue cyber-button hover:bg-cyber-blue/10 transition-colors group shrink-0 ml-auto md:ml-0"
              >
                <div className="w-6 h-6 rounded-full border border-cyber-blue/50 overflow-hidden">
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold font-mono text-cyber-blue group-hover:text-cyber-yellow transition-colors uppercase tracking-wider hidden md:inline">
                  {currentUser.name?.split(' ')[0] || 'User'}
                </span>
              </button>
            ) : (
              <div className="relative group">
                <button
                  onClick={onConnectClick}
                  className="cyber-button px-4 py-1.5 text-xs font-bold font-display uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border border-white/30 text-white hover:border-cyber-blue hover:bg-cyber-blue/10 shrink-0 ml-auto md:ml-0"
                  title="Members: Sign in to access team features. Interested in collaboration? See Contact in the menu."
                >
                  <Wallet size={14} />
                  <span className="hidden md:inline">Sign In</span>
                </button>
                {/* Tooltip for desktop */}
                <div className="hidden md:block absolute right-0 top-full mt-2 bg-surface/95 border border-cyber-blue/50 rounded px-3 py-2 text-xs text-white/80 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="font-bold text-cyber-blue mb-1">For Team Members</div>
                  <div>Interested in collaboration?</div>
                  <div className="text-cyber-yellow mt-1">Contact us in the menu</div>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[9100] bg-background/95 backdrop-blur-xl md:hidden flex flex-col p-6 border-l border-cyber-blue/30"
          >
            <div className="flex justify-between items-center mb-12 border-b border-cyber-blue/20 pb-4">
              <span className="font-display font-bold text-cyber-blue text-xl flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-6 h-6" />
                DSUC LAB
              </span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-6">
              {allLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    twMerge(
                      "text-2xl font-display font-bold uppercase flex items-center gap-4",
                      isActive ? "text-cyber-blue translate-x-4" : "text-white/40"
                    )
                  }
                >
                  <link.icon size={24} />
                  {link.name}
                </NavLink>
              ))}

              {isWalletConnected && (
                <NavLink
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    twMerge(
                      "text-2xl font-display font-bold uppercase flex items-center gap-4",
                      isActive ? "text-cyber-blue translate-x-4" : "text-white/40"
                    )
                  }
                >
                  <User size={24} />
                  MY PROFILE
                </NavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function WalletModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { connectWallet, loginWithGoogle } = useStore();
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

      const success = await loginWithGoogle(googleUserInfo);
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
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">Member Sign In</h3>
          <p className="text-white/40 text-xs mt-1">Registered members only. Not a member? Contact us for collaboration opportunities.</p>
        </div>

        <div className="space-y-3">
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
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span className="text-white/30 text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>

          {/* Wallet Buttons with better labels */}
          <div className="bg-white/5 border border-white/10 rounded p-3 mb-3">
            <p className="text-xs text-white/60 mb-3 font-mono">
              Sign in with your Solana wallet:
            </p>
            <button
              onClick={() => { connectWallet('Phantom'); onClose(); }}
              className="w-full p-3 border border-white/10 bg-white/5 hover:bg-cyber-blue/10 hover:border-cyber-blue transition-all flex items-center justify-between group cyber-button mb-2"
            >
              <span className="font-mono font-bold group-hover:text-cyber-blue transition-colors text-sm">Phantom Wallet</span>
              <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_5px_purple]" />
            </button>

            <button
              onClick={() => { connectWallet('Solflare'); onClose(); }}
              className="w-full p-3 border border-white/10 bg-white/5 hover:bg-cyber-yellow/10 hover:border-cyber-yellow transition-all flex items-center justify-between group cyber-button"
            >
              <span className="font-mono font-bold group-hover:text-cyber-yellow transition-colors text-sm">Solflare</span>
              <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_5px_orange]" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
