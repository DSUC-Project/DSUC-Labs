import React from "react";
import { Moon, Sun, Menu, X, ChevronDown } from "lucide-react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/store/useStore";
import { AuthIntent } from "@/types";

export function Navbar({
  onAuthClick,
  theme,
  onToggleTheme,
}: {
  onAuthClick: (mode: AuthIntent) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [opsOpen, setOpsOpen] = React.useState(false);

  const location = useLocation();
  React.useEffect(() => setMobileMenuOpen(false), [location]); // Close menu on route change

  // Real auth state
  const currentUser = useStore((state) => state.currentUser);
  const isGuest = !currentUser;

  const isOfficialMember = currentUser?.memberType === "member";
  const isAdmin =
    isOfficialMember &&
    ["President", "Vice-President"].includes(currentUser?.role || "");

  const navLinks = [
    { name: "Members", path: "/members" },
    { name: "Events", path: "/events" },
    { name: "Academy", path: "/academy" },
    { name: "Resources", path: "/resources" },
    { name: "Projects", path: "/projects" },
  ];

  const opsLinks = [
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "Meet", path: "/meet" },
    { name: "Work", path: "/work" },
    { name: "Finance", path: "/finance", locked: !isOfficialMember },
    ...(isAdmin
      ? [
          { name: "Admin", path: "/admin" },
          { name: "Academy Admin", path: "/academy-admin" },
        ]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-[80] w-full bg-surface/90 backdrop-blur transition-colors">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/home"
            className="relative z-[90] flex items-center gap-2 font-display font-bold text-xl uppercase tracking-tighter"
          >
            <div className="relative z-[90] w-10 h-10 bg-primary  shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/logo.png"
                alt="DSUC"
                className="relative z-10 w-7 h-7 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.innerHTML =
                    '<span class="font-display font-black text-main-bg text-sm leading-none">DS</span>';
                }}
              />
            </div>
            DSUC Labs
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium uppercase tracking-wider">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  cn(
                    "hover:text-primary transition-colors",
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-text-muted",
                  )
                }
              >
                {link.name}
              </NavLink>
            ))}

            {/* Operations Dropdown */}
            <div
              className="relative h-16 flex items-center"
              onMouseEnter={() => setOpsOpen(true)}
              onMouseLeave={() => setOpsOpen(false)}
            >
              <button
                type="button"
                aria-expanded={opsOpen}
                className={cn(
                  "flex items-center gap-1 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  location.pathname.match(
                    /\/(leaderboard|meet|work|finance|admin|academy-admin)/,
                  )
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-muted",
                )}
              >
                Operations <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {opsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 w-48 bg-surface border-border-main shadow-md py-2 flex flex-col z-50 uppercase text-xs"
                  >
                    {opsLinks.map((link) =>
                      link.locked ? (
                        <div
                          key={link.path}
                          className="px-4 py-2 text-text-muted/50 cursor-not-allowed flex justify-between"
                        >
                          <span>{link.name}</span>
                          <span className="text-[9px]">Locked</span>
                        </div>
                      ) : (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          className={({ isActive }) =>
                            cn(
                              "px-4 py-2 hover:bg-main-bg transition-colors block",
                              isActive
                                ? "text-primary font-bold bg-main-bg"
                                : "text-text-main",
                            )
                          }
                        >
                          {link.name}
                        </NavLink>
                      ),
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 border-border-main bg-main-bg hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {isGuest ? (
              <button
                type="button"
                onClick={() => onAuthClick("login")}
                className="px-4 py-2 bg-primary text-main-bg border-border-main shadow-sm font-bold text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--border-main)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Login
              </button>
            ) : (
              <div className="flex items-center gap-2 relative group cursor-pointer">
                <Link to="/profile" className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full border-border-main bg-accent overflow-hidden"
                    title="Profile"
                  >
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-main-bg bg-primary text-xs">
                        {(currentUser?.name || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold">
                    {currentUser.name?.split(" ")[0] || "User"}
                  </span>
                </Link>
                <div className="absolute top-full right-0 mt-2 bg-surface border border-border-main shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col min-w-[120px]">
                  <Link
                    to="/profile"
                    className="px-4 py-2 text-xs uppercase hover:bg-main-bg"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => useStore.getState().logout()}
                    className="px-4 py-2 text-xs uppercase hover:bg-main-bg text-left "
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden p-2 border-border-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border-main bg-surface truncate overflow-y-auto max-h-[80vh]"
            >
              <div className="flex flex-col p-4 gap-4 uppercase font-bold text-sm">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      cn(
                        "p-2",
                        isActive &&
                          "text-primary bg-main-bg border-border-main",
                      )
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
                <div className="h-px bg- w-full" />
                <p className="text-xs text-text-muted p-2">Operations</p>
                <div className="grid grid-cols-2 gap-2 pl-2">
                  {opsLinks.map((link) =>
                    link.locked ? (
                      <div
                        key={link.path}
                        className="p-2 text-xs opacity-50 flex items-center justify-between pointer-events-none"
                      >
                        {link.name} <span className="text-[9px]">LOCKED</span>
                      </div>
                    ) : (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                          cn(
                            "p-2 text-xs",
                            isActive &&
                              "text-primary bg-main-bg border-border-main",
                          )
                        }
                      >
                        {link.name}
                      </NavLink>
                    ),
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 border-dashed pt-4">
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="flex items-center gap-2 p-2 border-border-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {theme === "light" ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}{" "}
                    Theme
                  </button>
                  {isGuest ? (
                    <button
                      type="button"
                      onClick={() => onAuthClick("login")}
                      className="px-4 py-2 bg-primary text-main-bg border-border-main font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      Login
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/profile"
                        className="px-4 py-2 border border-border-main hover:bg-main-bg"
                      >
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => useStore.getState().logout()}
                        className="px-4 py-2 border border-border-main hover:bg-main-bg text-white bg-red-600"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
