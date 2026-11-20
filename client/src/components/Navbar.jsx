import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Pencil,
  User,
  LayoutGrid,
  Trophy,
  LogOut,
  LogIn,
  ChevronDown,
  X,
  Menu,
  Home,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';

// ─── Color map for avatar fallback ───────────────────────────────────────────
const COLOR_MAP = {
  RED: '#dc2626',
  GREEN: '#16a34a',
  YELLOW: '#ca8a04',
  BLACK: '#1f2937',
  BLUE: '#2563eb',
  PURPLE: '#7c3aed',
  ORANGE: '#ea580c',
  PINK: '#db2777',
  CYAN: '#0891b2',
  WHITE: '#6b7280',
};

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, latency } = useSocket();
  const { user, isAuthenticated, logout } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // ── Close menus on route change
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // ── Close user dropdown on outside click
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isUserMenuOpen]);

  // ── Close mobile menu on outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handler = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobileMenuOpen]);

  // ── Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // ── Active route checks
  const isHome = location.pathname === '/';
  const isLobby =
    location.pathname === '/lobby' || location.pathname.startsWith('/rooms');
  const isLeaderboard = location.pathname === '/leaderboard';
  const isProfile =
    location.pathname === '/profile' ||
    location.pathname === '/profile-setup' ||
    location.pathname === '/stats';
  const isLogin = location.pathname === '/login';

  const avatarBg = COLOR_MAP[user?.primaryColor] || '#2563eb';

  // ── NavLink style helper
  const linkCls = (active) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-sans font-medium transition-all ${
      active
        ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
        : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#FAF6EC]'
    }`;

  return (
    <>
      {/* ════════════════════════════════════════════
          HEADER BAR
      ════════════════════════════════════════════ */}
      <header className="border-b border-[#D5CFC3] bg-[#F8F4EB]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* ── Brand Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-2 group shrink-0"
            aria-label="ODD WAR Home"
          >
            <div className="w-7 h-7 rounded-lg bg-[#23252A] text-[#F8F4EB] flex items-center justify-center shadow-sketch-sm group-hover:bg-[#2B68B4] transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </div>
            <span className="font-handwriting font-bold text-xl tracking-wide text-[#23252A]">
              ODD WAR
            </span>
            <span className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#EFE8DA] border border-[#D5CFC3] text-[#5C6069]">
              Notebook
            </span>
          </Link>

          {/* ── Desktop Navigation (md+) ── */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkCls(isHome)}>
              <Home className="w-3.5 h-3.5" />
              Home
            </Link>
            <Link to="/lobby" className={linkCls(isLobby)}>
              <LayoutGrid className="w-3.5 h-3.5" />
              Lobby
            </Link>
            <Link to="/leaderboard" className={linkCls(isLeaderboard)}>
              <Trophy className="w-3.5 h-3.5" />
              Rankings
            </Link>
            <Link to="/profile" className={linkCls(isProfile)}>
              <User className="w-3.5 h-3.5" />
              Profile
            </Link>
          </nav>

          {/* ── Right side controls ── */}
          <div className="flex items-center gap-2">

            {/* Socket indicator — desktop only */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFDF9] border border-[#D5CFC3] text-[10px] font-mono shrink-0">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-[#2E8557]" />
                  <span className="text-[#2E8557]">
                    {latency !== null ? `${latency}ms` : '30Hz'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-[#CE4242]" />
                  <span className="text-[#CE4242]">OFFLINE</span>
                </>
              )}
            </div>

            {/* ── Auth: User Dropdown (authenticated) ── */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#FAF6EC] shadow-sketch-sm transition-all text-xs font-sans"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.nickname || 'Player'}
                      className="w-6 h-6 rounded-full object-cover border border-black/20"
                    />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {(user.nickname || 'W')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline font-handwriting font-bold text-sm text-[#23252A] max-w-[80px] truncate">
                    {user.nickname}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-[#6B7280] transition-transform duration-150 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#FAF6EC] border-2 border-[#23252A] shadow-sketch-md py-2 z-50">
                    <div className="px-3 py-2 border-b border-[#D5CFC3]">
                      <span className="block font-handwriting font-bold text-sm text-[#23252A] truncate">
                        {user.displayName || user.nickname || 'Player'}
                      </span>
                      <span className="block font-mono text-[10px] text-[#6B7280] truncate">
                        {user.email || user.playerId}
                      </span>
                    </div>
                    <DropLink to="/profile" icon={<User className="w-3.5 h-3.5" />} label="Combat Ledger" close={() => setIsUserMenuOpen(false)} />
                    <DropLink to="/profile-setup" icon={<Pencil className="w-3.5 h-3.5" />} label="Customize Character" close={() => setIsUserMenuOpen(false)} />
                    <DropLink to="/lobby" icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Game Lobby" close={() => setIsUserMenuOpen(false)} />
                    <DropLink to="/leaderboard" icon={<Trophy className="w-3.5 h-3.5" />} label="Rankings" close={() => setIsUserMenuOpen(false)} />
                    <div className="border-t border-[#D5CFC3] mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => { setIsUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#DC2626] hover:bg-[#FEE2E2] transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In button — unauthenticated */
              <Link
                to="/login"
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-sans text-xs font-semibold transition-all shadow-sketch-sm ${
                  isLogin
                    ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A]'
                    : 'bg-white text-[#23252A] border-[#D5CFC3] hover:bg-[#FAF6EC]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-[#2563EB]" />
                Sign In
              </Link>
            )}

            {/* ── Hamburger — mobile only ── */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#FAF6EC] transition-colors shadow-sketch-sm"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-[#23252A]" />
              ) : (
                <Menu className="w-4 h-4 text-[#23252A]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════
          MOBILE SLIDE-DOWN DRAWER
      ════════════════════════════════════════════ */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px]"
            aria-hidden="true"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div
            ref={mobileMenuRef}
            className="md:hidden fixed top-14 left-0 right-0 z-40 bg-[#FAF6EC] border-b-2 border-[#23252A] shadow-sketch-md animate-slideDown"
          >
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">

              {/* Nav links */}
              <MobileNavLink
                to="/"
                icon={<Home className="w-4 h-4" />}
                label="Home"
                active={isHome}
                close={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavLink
                to="/lobby"
                icon={<LayoutGrid className="w-4 h-4" />}
                label="Game Lobby"
                active={isLobby}
                close={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavLink
                to="/leaderboard"
                icon={<Trophy className="w-4 h-4" />}
                label="Rankings"
                active={isLeaderboard}
                close={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavLink
                to="/profile"
                icon={<User className="w-4 h-4" />}
                label="Profile"
                active={isProfile}
                close={() => setIsMobileMenuOpen(false)}
              />

              {/* Divider */}
              <div className="border-t border-[#D5CFC3] my-1" />

              {/* Auth section */}
              {isAuthenticated && user ? (
                <>
                  {/* User identity */}
                  <div className="flex items-center gap-3 px-3 py-2">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.nickname || 'Player'}
                        className="w-9 h-9 rounded-full object-cover border-2 border-[#D5CFC3]"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-[#D5CFC3]"
                        style={{ backgroundColor: avatarBg }}
                      >
                        {(user.nickname || 'W')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-handwriting font-bold text-base text-[#23252A] truncate">
                        {user.nickname || user.displayName}
                      </p>
                      <p className="font-mono text-[10px] text-[#6B7280] truncate">
                        {user.email || user.playerId}
                      </p>
                    </div>
                  </div>

                  {/* Socket status */}
                  <div className="flex items-center gap-2 px-3 py-1">
                    {isConnected ? (
                      <>
                        <Wifi className="w-3.5 h-3.5 text-[#2E8557]" />
                        <span className="font-mono text-[11px] text-[#2E8557]">
                          Connected {latency !== null ? `· ${latency}ms` : '· 30Hz'}
                        </span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3.5 h-3.5 text-[#CE4242]" />
                        <span className="font-mono text-[11px] text-[#CE4242]">Offline</span>
                      </>
                    )}
                  </div>

                  {/* Sign Out */}
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-sans font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#D5CFC3] bg-white text-sm font-sans font-semibold text-[#23252A] hover:bg-[#F4EEDB] transition-colors shadow-sketch-sm"
                >
                  <LogIn className="w-4 h-4 text-[#2563EB]" />
                  Sign In to ODD WAR
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DropLink = ({ to, icon, label, close }) => (
  <Link
    to={to}
    onClick={close}
    className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#23252A] hover:bg-[#F4EEDB] transition-colors"
  >
    {icon}
    {label}
  </Link>
);

const MobileNavLink = ({ to, icon, label, active, close }) => (
  <Link
    to={to}
    onClick={close}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-sans font-medium transition-all ${
      active
        ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A]'
        : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#F4EEDB]'
    }`}
  >
    {icon}
    {label}
  </Link>
);

export default Navbar;
