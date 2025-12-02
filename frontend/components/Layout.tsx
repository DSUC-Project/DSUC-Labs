
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { Home, Users, Calendar, Calculator, Briefcase, Folder, Wallet, Menu, X, Terminal, User, Rocket, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Layout({ children }: { children?: React.ReactNode }) {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans text-white selection:bg-cyber-yellow selection:text-black">
      <Background />
      <Navbar onConnectClick={() => setIsWalletModalOpen(true)} />
      <main className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {children}
      </main>
      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryLinks = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
  ];

  const dropdownLinks = [
    { name: 'Projects', path: '/projects', icon: Rocket },
    { name: 'Finance', path: '/finance', icon: Calculator },
    { name: 'Work', path: '/work', icon: Briefcase },
    { name: 'Resources', path: '/resources', icon: Folder },
  ];

  const isDropdownActive = dropdownLinks.some(link => location.pathname === link.path);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[9000] flex justify-center">
        {/* Cyber Deck Navbar Container */}
        <nav className="relative bg-surface/80 backdrop-blur-md border-b border-l border-r border-cyber-blue/30 px-6 py-4 nav-shape shadow-[0_5px_20px_rgba(41,121,255,0.2)]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-cyber-blue/50" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-cyber-blue shadow-[0_0_10px_#2979FF]" />
          
          <div className="flex items-center gap-8">
            {/* Logo Area - Always Visible */}
            <div className="flex items-center gap-3 text-cyber-blue font-display font-bold tracking-wider">
               <img src="/logo.png" alt="DSUC Logo" className="w-8 h-8 drop-shadow-[0_0_8px_rgba(41,121,255,0.5)]" />
               <span className="hidden sm:inline">DSUC LAB</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {primaryLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      twMerge(
                        "relative px-4 py-1.5 text-xs font-display font-bold uppercase tracking-wide transition-all duration-300 hover:text-cyber-yellow group",
                        isActive ? "text-cyber-blue" : "text-white/60"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="relative z-10 flex items-center gap-2">
                          {link.name}
                        </span>
                        {isActive && (
                          <motion.div
                            layoutId="nav-glow"
                            className="absolute -bottom-1 left-0 right-0 h-[1px] bg-cyber-blue shadow-[0_0_8px_#2979FF]"
                          />
                        )}
                        <div className="absolute inset-0 bg-cyber-blue/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-center -skew-x-12" />
                      </>
                    )}
                  </NavLink>
                );
              })}

              {/* More Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={twMerge(
                    "relative px-4 py-1.5 text-xs font-display font-bold uppercase tracking-wide transition-all duration-300 hover:text-cyber-yellow group flex items-center gap-1",
                    isDropdownActive ? "text-cyber-blue" : "text-white/60"
                  )}
                >
                  <span className="relative z-10">More</span>
                  <ChevronDown size={14} className={twMerge("transition-transform", dropdownOpen && "rotate-180")} />
                  {isDropdownActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute -bottom-1 left-0 right-0 h-[1px] bg-cyber-blue shadow-[0_0_8px_#2979FF]"
                    />
                  )}
                  <div className="absolute inset-0 bg-cyber-blue/5 scale-x-0 group-hover:scale-x-100 transition-transform origin-center -skew-x-12" />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full mt-2 right-0 w-48 bg-surface/95 backdrop-blur-md border border-cyber-blue/30 cyber-clip-top shadow-[0_5px_20px_rgba(41,121,255,0.2)] overflow-hidden z-[10000]"
                    >
                      {dropdownLinks.map((link) => (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          onClick={() => setDropdownOpen(false)}
                          className={({ isActive }) =>
                            twMerge(
                              "flex items-center gap-3 px-4 py-3 text-xs font-display font-bold uppercase tracking-wide transition-all duration-200 border-b border-cyber-blue/10 last:border-b-0",
                              isActive 
                                ? "text-cyber-blue bg-cyber-blue/10" 
                                : "text-white/60 hover:text-cyber-yellow hover:bg-cyber-yellow/5"
                            )
                          }
                        >
                          <link.icon size={16} />
                          {link.name}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Wallet / Profile Button */}
            {isWalletConnected && currentUser ? (
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-cyber-dark border border-cyber-blue cyber-button hover:bg-cyber-blue/10 transition-colors group"
              >
                <div className="w-6 h-6 rounded-full border border-cyber-blue/50 overflow-hidden">
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold font-mono text-cyber-blue group-hover:text-cyber-yellow transition-colors uppercase tracking-wider">
                  {currentUser.name?.split(' ')[0] || 'User'}
                </span>
              </button>
            ) : (
              <button
                onClick={onConnectClick}
                className="cyber-button px-5 py-1.5 text-xs font-bold font-display uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border bg-cyber-yellow text-black border-cyber-yellow hover:bg-white hover:border-white hover:shadow-[0_0_15px_#FFD600]"
              >
                <Wallet size={14} />
                Connect
              </button>
            )}

            {/* Mobile Toggle */}
            <div className="md:hidden flex items-center gap-4 ml-auto">
               <button onClick={() => setMobileMenuOpen(true)} className="text-cyber-blue">
                 <Menu size={24} />
               </button>
            </div>
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
              {primaryLinks.map((link) => (
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
              
              {/* Mobile More Section */}
              <div className="border-t border-cyber-blue/20 pt-6 mt-2">
                <div className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4 pl-1">More</div>
                {dropdownLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      twMerge(
                        "text-xl font-display font-bold uppercase flex items-center gap-4 mb-4",
                        isActive ? "text-cyber-blue translate-x-4" : "text-white/40"
                      )
                    }
                  >
                    <link.icon size={20} />
                    {link.name}
                  </NavLink>
                ))}
              </div>

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
  const { connectWallet } = useStore();

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
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">Initialize Link</h3>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => { connectWallet('Phantom'); onClose(); }}
            className="w-full p-4 border border-white/10 bg-white/5 hover:bg-cyber-blue/10 hover:border-cyber-blue transition-all flex items-center justify-between group cyber-button"
          >
            <span className="font-mono font-bold group-hover:text-cyber-blue transition-colors">Phantom Wallet</span>
            <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_5px_purple]" />
          </button>
          
          <button 
            onClick={() => { connectWallet('Solflare'); onClose(); }}
            className="w-full p-4 border border-white/10 bg-white/5 hover:bg-cyber-yellow/10 hover:border-cyber-yellow transition-all flex items-center justify-between group cyber-button"
          >
            <span className="font-mono font-bold group-hover:text-cyber-yellow transition-colors">Solflare</span>
            <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_5px_orange]" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
