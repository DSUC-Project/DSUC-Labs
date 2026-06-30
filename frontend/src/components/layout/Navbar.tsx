import React from "react";
import {
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  Users,
  CalendarDays,
  GraduationCap,
  BookOpen,
  FolderKanban,
  Trophy,
  MessagesSquare,
  BriefcaseBusiness,
  Wallet,
  Shield,
  Languages,
  LogIn,
  UserRound,
  LogOut,
} from "lucide-react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/store/useStore";
import { AuthIntent } from "@/types";
import { useLocale } from "@/lib/locale";

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
  const { locale, toggleLocale, text } = useLocale();

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
    { name: text("Members", "Thành viên"), path: "/members", icon: Users },
    { name: text("Events", "Sự kiện"), path: "/events", icon: CalendarDays },
    { name: "Academy", path: "/academy", icon: GraduationCap },
    { name: text("Resources", "Tài nguyên"), path: "/resources", icon: BookOpen },
    { name: text("Projects", "Dự án"), path: "/projects", icon: FolderKanban },
  ];

  const opsLinks = [
    { name: text("Leaderboard", "Bảng xếp hạng"), path: "/leaderboard", icon: Trophy },
    { name: "Meet", path: "/meet", icon: MessagesSquare },
    { name: text("Work", "Công việc"), path: "/work", icon: BriefcaseBusiness },
    { name: "Finance", path: "/finance", icon: Wallet, locked: isGuest },
    ...(isAdmin
      ? [
          { name: "Admin", path: "/admin", icon: Shield },
          { name: text("Academy Admin", "Quản trị Academy"), path: "/academy-admin", icon: GraduationCap },
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
                    "inline-flex h-10 items-center gap-2 whitespace-nowrap hover:text-primary transition-colors",
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-text-muted",
                  )
                }
              >
                <link.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
                  "flex h-10 items-center gap-2 whitespace-nowrap hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  location.pathname.match(
                    /\/(leaderboard|meet|work|finance|admin|academy-admin)/,
                  )
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-muted",
                )}
              >
                <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {text("Operations", "Vận hành")}
                <ChevronDown className="w-4 h-4" />
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
                          className="px-4 py-2 text-text-muted/50 cursor-not-allowed flex items-center justify-between gap-3"
                        >
                          <span className="inline-flex items-center gap-2">
                            <link.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {link.name}
                          </span>
                          <span className="text-[9px]">Locked</span>
                        </div>
                      ) : (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          className={({ isActive }) =>
                            cn(
                              "px-4 py-2 hover:bg-main-bg transition-colors flex items-center gap-2",
                              isActive
                                ? "text-primary font-bold bg-main-bg"
                                : "text-text-main",
                            )
                          }
                        >
                          <link.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
          <div className="hidden md:flex min-w-[260px] items-center justify-end gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLocale}
                className="inline-flex h-10 min-w-[84px] items-center justify-center gap-2 border border-border-main bg-main-bg px-3 py-2 hover:bg-surface transition-colors font-mono text-[10px] font-bold uppercase tracking-[0.18em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={text("Toggle language", "Đổi ngôn ngữ")}
              >
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                {locale}
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 border border-border-main bg-main-bg hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={text("Toggle theme", "Đổi giao diện")}
              >
                {theme === "light" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>

            {isGuest ? (
              <button
                type="button"
                onClick={() => onAuthClick("login")}
                className="inline-flex h-10 w-[152px] items-center justify-center gap-2 bg-primary text-main-bg border-border-main shadow-sm font-bold text-sm uppercase tracking-wider hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--border-main)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
                {text("Login", "Đăng nhập")}
              </button>
            ) : (
              <div className="relative flex w-[152px] items-center justify-end gap-2 group cursor-pointer">
                <Link to="/profile" className="inline-flex h-10 w-full items-center justify-end gap-2">
                  <div
                    className="w-8 h-8 rounded-full border-border-main bg-accent overflow-hidden"
                    title={text("Profile", "Hồ sơ")}
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
                  <span className="max-w-[96px] truncate text-right font-mono text-xs font-bold">
                    {currentUser.name?.split(" ")[0] || "User"}
                  </span>
                </Link>
                <div className="absolute top-full right-0 mt-2 bg-surface border border-border-main shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col min-w-[120px]">
                  <Link
                    to="/profile"
                    className="px-4 py-2 text-xs uppercase hover:bg-main-bg inline-flex items-center gap-2"
                  >
                    <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                    {text("Profile", "Hồ sơ")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => useStore.getState().logout()}
                    className="px-4 py-2 text-xs uppercase hover:bg-main-bg text-left inline-flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    {text("Logout", "Đăng xuất")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? text("Close menu", "Đóng menu") : text("Open menu", "Mở menu")}
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
                        "inline-flex items-center gap-2 p-2",
                        isActive &&
                          "text-primary bg-main-bg border-border-main",
                      )
                    }
                  >
                    <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {link.name}
                  </NavLink>
                ))}
                <div className="h-px bg- w-full" />
                <p className="text-xs text-text-muted p-2">
                  {text("Operations", "Vận hành")}
                </p>
                <div className="grid grid-cols-2 gap-2 pl-2">
                  {opsLinks.map((link) =>
                    link.locked ? (
                      <div
                        key={link.path}
                        className="p-2 text-xs opacity-50 flex items-center justify-between gap-2 pointer-events-none"
                      >
                        <span className="inline-flex items-center gap-2">
                          <link.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {link.name}
                        </span>
                        <span className="text-[9px]">{text("LOCKED", "KHÓA")}</span>
                      </div>
                    ) : (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                          cn(
                            "inline-flex items-center gap-2 p-2 text-xs",
                            isActive &&
                              "text-primary bg-main-bg border-border-main",
                          )
                        }
                      >
                        <link.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {link.name}
                      </NavLink>
                    ),
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 border-dashed pt-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleLocale}
                      className="flex min-w-[84px] items-center justify-center gap-2 px-3 py-2 border border-border-main bg-main-bg font-mono text-[10px] font-bold uppercase tracking-[0.18em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                      {locale}
                    </button>
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="flex items-center gap-2 p-2 border border-border-main bg-main-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {theme === "light" ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}{" "}
                      {text("Theme", "Giao diện")}
                    </button>
                  </div>
                  {isGuest ? (
                    <button
                      type="button"
                      onClick={() => onAuthClick("login")}
                      className="inline-flex min-w-[132px] items-center justify-center gap-2 px-4 py-2 bg-primary text-main-bg border-border-main font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {text("Login", "Đăng nhập")}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/profile"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border-main hover:bg-main-bg"
                      >
                        <UserRound className="h-4 w-4" aria-hidden="true" />
                        {text("Profile", "Hồ sơ")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => useStore.getState().logout()}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border-main hover:bg-main-bg text-white bg-red-600"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        {text("Logout", "Đăng xuất")}
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
