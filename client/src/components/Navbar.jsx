import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getPlayerSession } from '../store/playerSession.js';
import { getColorFamily } from '../config/colors.js';
import { soundEffects } from '../services/soundEffects.js';

/**
 * Standardized Primary Navigation Destinations
 * Exactly four items with uniform labels and active detection.
 */
const NAV_ITEMS = [
  {
    label: 'Home',
    to: '/',
    icon: Home,
    isActive: (pathname) => pathname === '/'
  },
  {
    label: 'Lobby',
    to: '/lobby',
    icon: LayoutGrid,
    isActive: (pathname) => pathname === '/lobby' || pathname.startsWith('/rooms')
  },
  {
    label: 'Ranking',
    to: '/leaderboard',
    icon: Trophy,
    isActive: (pathname) => pathname === '/leaderboard'
  },
  {
    label: 'Profile',
    to: '/profile',
    icon: User,
    isActive: (pathname) =>
      pathname === '/profile' || pathname === '/profile-setup' || pathname === '/stats'
  }
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, latency } = useSocket();
  const { user, isAuthenticated, logout } = useAuth();
  const guestSession = getPlayerSession();

  // Navigation menu state (Strictly one active state source per presentation)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const hamburgerBtnRef = useRef(null);

  // ── In-game Route Detection: Hide Navbar on Waiting Room & Battlefield ──
  const isWaitingRoom =
    /^\/rooms\/[^/]+(\/waiting)?$/i.test(location.pathname) &&
    !['/rooms/public', '/rooms/create', '/rooms/join'].includes(location.pathname.toLowerCase());
  const isBattlefield =
    /^\/rooms\/[^/]+\/(battlefield|game)$/i.test(location.pathname) ||
    /^\/game\/[^/]+$/i.test(location.pathname);

  // ── Player Identity Resolution ──
  const activeNickname =
    (isAuthenticated && user?.nickname)
      ? user.nickname
      : (user?.displayName || guestSession.nickname || 'Warrior');
  const activeColorKey =
    (isAuthenticated && user?.primaryColor)
      ? user.primaryColor
      : (guestSession.primaryColor || 'BLUE');
  const squadColor = getColorFamily(activeColorKey);

  // ── Close all menus on route change ──
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // ── Close menus on Escape key press ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          hamburgerBtnRef.current?.focus();
        }
        if (isUserMenuOpen) {
          setIsUserMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, isUserMenuOpen]);

  // ── Close desktop user dropdown on outside click ──
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isUserMenuOpen]);

  // ── Close mobile drawer on outside click ──
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        hamburgerBtnRef.current &&
        !hamburgerBtnRef.current.contains(e.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMobileMenuOpen]);

  // ── Viewport resize synchronization ──
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      } else {
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Lock body scroll when mobile drawer is open ──
  useEffect(() => {
    if (isMobileMenuOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  // Navigation click helper with sound effect
  const handleNavClick = useCallback(
    (to) => {
      soundEffects.playButtonClick();
      setIsMobileMenuOpen(false);
      setIsUserMenuOpen(false);
      navigate(to);
    },
    [navigate]
  );

  // If currently on an in-game screen (Waiting Room or Battlefield), suppress global navbar
  if (isWaitingRoom || isBattlefield) {
    return null;
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          HEADER BAR
          - Desktop: Brand Logo + 4 Horizontal Nav Links + Account Controls
          - Mobile: Brand Logo + Exactly ONE 44px Hamburger Toggle
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="border-b border-[#D5CFC3] bg-[#F8F4EB]/95 backdrop-blur-sm sticky top-0 z-40 select-none">
        <div className="max-w-6xl mx-auto px-3.5 xs:px-4 sm:px-6 h-13 xs:h-14 flex items-center justify-between gap-3">

          {/* ── Brand Logo & Name (Always Left-Aligned) ── */}
          <Link
            to="/"
            onClick={() => soundEffects.playButtonClick()}
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

          {/* ── Desktop Horizontal Navigation (md: 768px+ only) ── */}
          <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive(location.pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => soundEffects.playButtonClick()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg border text-xs font-sans font-semibold transition-all ${
                    active
                      ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
                      : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#FAF6EC] hover:text-[#23252A]'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ── Right-Side Controls ── */}
          <div className="flex items-center gap-2">

            {/* Socket Latency Indicator (Desktop Only) */}
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

            {/* Desktop Account Dropdown (Desktop Only, Authenticated) */}
            {isAuthenticated && user ? (
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2 py-1 min-h-[38px] rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#FAF6EC] shadow-sketch-sm transition-all text-xs font-sans cursor-pointer"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                  aria-label="Account options menu"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={activeNickname}
                      className="w-6 h-6 rounded-full object-cover border border-black/20"
                    />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: squadColor.hex }}
                    >
                      {activeNickname[0]?.toUpperCase() || 'W'}
                    </div>
                  )}
                  <span className="font-handwriting font-bold text-sm text-[#23252A] max-w-[84px] truncate">
                    {activeNickname}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-150 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Desktop Account Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FAF6EC] border-2 border-[#23252A] shadow-sketch-md py-2 z-50 animate-slideDown">
                    <div className="px-3.5 py-2 border-b border-[#D5CFC3]">
                      <span className="block font-handwriting font-bold text-sm text-[#23252A] truncate">
                        {activeNickname}
                      </span>
                      <span className="block font-mono text-[10px] text-[#6B7280] truncate">
                        {user.email || user.playerId}
                      </span>
                    </div>

                    {/* Account Settings / Warrior Setup */}
                    <Link
                      to="/profile"
                      onClick={() => {
                        soundEffects.playButtonClick();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono text-[#23252A] hover:bg-[#F4EEDB] transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#2B68B4]" />
                      <span>Profile Details</span>
                    </Link>

                    <Link
                      to="/profile-setup"
                      onClick={() => {
                        soundEffects.playButtonClick();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono text-[#23252A] hover:bg-[#F4EEDB] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#2E8557]" />
                      <span>Customize Warrior</span>
                    </Link>

                    {/* Sign Out */}
                    <div className="border-t border-[#D5CFC3] mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-mono text-[#CE4242] hover:bg-[#FDF2F2] transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Desktop Sign In Button (Desktop Only, Unauthenticated) */
              <Link
                to="/login"
                onClick={() => soundEffects.playButtonClick()}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-xl border font-sans text-xs font-semibold transition-all shadow-sketch-sm ${
                  location.pathname === '/login'
                    ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A]'
                    : 'bg-white text-[#23252A] border-[#D5CFC3] hover:bg-[#FAF6EC]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-[#2B68B4]" />
                <span>Sign In</span>
              </Link>
            )}

            {/* ── Single Mobile Hamburger Toggle Button (md:hidden) ── */}
            {/* Exactly ONE menu toggle on mobile with minimum 44x44px touch hit area */}
            <button
              ref={hamburgerBtnRef}
              type="button"
              onClick={() => {
                soundEffects.playButtonClick();
                setIsMobileMenuOpen((prev) => !prev);
              }}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-[#D5CFC3] bg-[#FFFDF9] hover:bg-[#FAF6EC] active:scale-95 transition-all shadow-sketch-sm text-[#23252A] cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-[#23252A]" />
                ) : (
                  <Menu className="w-5 h-5 text-[#23252A]" />
                )}
              </motion.div>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          EXPANDED MOBILE NAVIGATION DRAWER
          Full-width slide-down notebook sheet directly beneath the header
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="md:hidden fixed inset-0 z-30 bg-black/35 backdrop-blur-[2px]"
              aria-hidden="true"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-Down Notepaper Drawer Panel */}
            <motion.div
              id="mobile-navigation-drawer"
              ref={mobileMenuRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden fixed top-13 xs:top-14 left-0 right-0 z-40 bg-[#FAF6EC] border-b-2 border-[#23252A] shadow-sketch-md max-h-[calc(100dvh-3.25rem)] xs:max-h-[calc(100dvh-3.5rem)] overflow-y-auto"
            >
              <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col gap-2.5">

                {/* 1. Mobile Player Identity Banner / Sign-in Strip */}
                {isAuthenticated && user ? (
                  <div className="p-2.5 rounded-xl bg-[#FFFDF9] border border-[#D5CFC3] shadow-sketch-sm flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={activeNickname}
                          className="w-9 h-9 rounded-full object-cover border-2 border-[#23252A] shrink-0"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full border-2 border-[#23252A] flex items-center justify-center text-white font-handwriting font-bold text-base shadow-xs shrink-0"
                          style={{ backgroundColor: squadColor.hex }}
                        >
                          {activeNickname[0]?.toUpperCase() || 'W'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-handwriting font-bold text-base text-[#23252A] truncate leading-none">
                            {activeNickname}
                          </p>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 border"
                            style={{
                              backgroundColor: squadColor.lightHex || '#F0F5FB',
                              color: squadColor.hex,
                              borderColor: `${squadColor.hex}40`
                            }}
                          >
                            {squadColor.name}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-[#6B7280] truncate mt-0.5">
                          {user.email || user.playerId}
                        </p>
                      </div>
                    </div>

                    {/* Socket Indicator on Mobile Drawer */}
                    <div className="shrink-0">
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[#2E8557] bg-[#F0F7F3] border border-[#2E8557]/30 px-2 py-0.5 rounded-full">
                          <Wifi className="w-3 h-3" />
                          <span>Online</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[#CE4242] bg-[#FDF2F2] border border-[#CE4242]/30 px-2 py-0.5 rounded-full">
                          <WifiOff className="w-3 h-3" />
                          <span>Offline</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Guest / Unauthenticated Prompt */
                  <Link
                    to="/login"
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-3 rounded-xl bg-[#FFFDF9] border border-[#D5CFC3] hover:border-[#23252A] shadow-sketch-sm flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EBF3FC] border border-[#2B68B4]/30 flex items-center justify-center text-[#2B68B4]">
                        <LogIn className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-handwriting font-bold text-base text-[#23252A] block leading-tight">
                          Sign In to ODD WAR
                        </span>
                        <span className="text-[10px] font-sans text-[#5C6069]">
                          Save match stats and custom call-signs
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#5C6069] group-hover:text-[#23252A] group-hover:translate-x-0.5 transition-all" />
                  </Link>
                )}

                {/* 2. Primary Navigation Links (Exactly the Four Standardized Items) */}
                <div className="flex flex-col gap-1.5 pt-1" role="navigation" aria-label="Mobile Navigation Drawer">
                  {NAV_ITEMS.map((item) => {
                    const active = item.isActive(location.pathname);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => handleNavClick(item.to)}
                        className={`min-h-[48px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-sm font-sans font-medium transition-all active:scale-[0.99] cursor-pointer ${
                          active
                            ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
                            : 'bg-[#FFFDF9] text-[#5C6069] border-[#D5CFC3] hover:text-[#23252A] hover:border-[#9C9486] hover:bg-[#F4EEDB]'
                        }`}
                        aria-current={active ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#F8F4EB]' : 'text-[#23252A]'}`} />
                          <span className={active ? 'font-semibold text-white' : 'font-medium'}>
                            {item.label}
                          </span>
                        </div>
                        {active && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/15 text-[#F8F4EB] font-bold">
                            Active
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* 3. Account Actions / Sign Out at Bottom */}
                {isAuthenticated && (
                  <div className="border-t border-[#D5CFC3] pt-2 mt-1 flex flex-col gap-1.5">
                    <Link
                      to="/profile-setup"
                      onClick={() => {
                        soundEffects.playButtonClick();
                        setIsMobileMenuOpen(false);
                      }}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-mono font-medium text-[#23252A] bg-[#FAF6EC] hover:bg-[#EFE8DA] border border-[#D5CFC3] flex items-center justify-between transition-colors shadow-sketch-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-[#2E8557]" />
                        <span>Customize Warrior Call-Sign</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#5C6069]" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="min-h-[44px] w-full px-3.5 py-2 rounded-xl text-xs font-mono font-semibold text-[#CE4242] hover:bg-[#FDF2F2] border border-transparent hover:border-[#CE4242]/20 flex items-center gap-2 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
