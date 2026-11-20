import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Pencil, User, LayoutGrid, Trophy, LogOut, LogIn, ChevronDown } from 'lucide-react';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';

export const Navbar = () => {
  const location = useLocation();
  const { isConnected, latency } = useSocket();
  const { user, isAuthenticated, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown when route changes
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
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

  const isHome = location.pathname === '/';
  const isProfile =
    location.pathname === '/profile' ||
    location.pathname === '/profile-setup' ||
    location.pathname === '/stats';
  const isLeaderboard = location.pathname === '/leaderboard';
  const isLobby =
    location.pathname === '/lobby' || location.pathname.startsWith('/rooms');
  const isLogin = location.pathname === '/login';

  // Color map for user avatar fallback
  const colorMap = {
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
  const avatarBg = colorMap[user?.primaryColor] || '#2563eb';

  return (
    <header className="border-b border-[#D5CFC3] bg-[#F8F4EB]/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between">

        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center space-x-2 sm:space-x-2.5 group shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#23252A] text-[#F8F4EB] flex items-center justify-center shadow-sketch-sm group-hover:bg-[#2B68B4] transition-colors shrink-0">
            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex items-center">
            <span className="font-handwriting font-bold text-xl sm:text-2xl tracking-wide text-[#23252A]">
              ODD WAR
            </span>
            <span className="hidden md:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#EFE8DA] border border-[#D5CFC3] text-[#5C6069]">
              Notebook
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          <nav className="flex items-center space-x-0.5 sm:space-x-1 text-xs font-sans font-medium">

            {/* Home */}
            <Link
              to="/"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border transition-all ${
                isHome
                  ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
                  : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#FAF6EC]'
              }`}
            >
              Home
            </Link>

            {/* Lobby */}
            <Link
              to="/lobby"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                isLobby
                  ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
                  : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#FAF6EC]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Lobby</span>
            </Link>

            {/* Rankings / Leaderboard */}
            <Link
              to="/leaderboard"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                isLeaderboard
                  ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
                  : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#FAF6EC]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Rankings</span>
            </Link>

            {/* Profile — visible to all, but ProfileGate handles auth */}
            <Link
              to="/profile"
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                isProfile
                  ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
                  : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#FAF6EC]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Profile</span>
            </Link>
          </nav>

          {/* Auth Button or User Dropdown */}
          <div className="relative" ref={userMenuRef}>
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#FAF6EC] shadow-sketch-sm transition-all text-xs font-sans"
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
                  <span className="hidden sm:inline font-handwriting font-bold text-sm text-[#23252A] max-w-[90px] truncate">
                    {user.nickname}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-[#6B7280] transition-transform duration-150 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#FAF6EC] border-2 border-[#23252A] shadow-sketch-md py-2 z-50">
                    {/* User identity */}
                    <div className="px-3 py-2 border-b border-[#D5CFC3]">
                      <span className="block font-handwriting font-bold text-sm text-[#23252A] truncate">
                        {user.displayName || user.nickname || 'Player'}
                      </span>
                      <span className="block font-mono text-[10px] text-[#6B7280] truncate">
                        {user.email || user.playerId}
                      </span>
                    </div>

                    {/* Combat Ledger → /profile */}
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#23252A] hover:bg-[#F4EEDB] transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Combat Ledger</span>
                    </Link>

                    {/* Customize Character → /profile-setup */}
                    <Link
                      to="/profile-setup"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#23252A] hover:bg-[#F4EEDB] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Customize Character</span>
                    </Link>

                    {/* Leaderboard */}
                    <Link
                      to="/leaderboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#23252A] hover:bg-[#F4EEDB] transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Rankings</span>
                    </Link>

                    {/* Sign Out */}
                    <div className="border-t border-[#D5CFC3] mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#DC2626] hover:bg-[#FEE2E2] transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In button — only shown to unauthenticated users */
              <Link
                to="/login"
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border font-sans text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sketch-sm ${
                  isLogin
                    ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A]'
                    : 'bg-white text-[#23252A] border-[#D5CFC3] hover:bg-[#FAF6EC]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="hidden xs:inline">Sign In</span>
              </Link>
            )}
          </div>

          {/* Real-time Socket Indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#FFFDF9] border border-[#D5CFC3] text-xs font-mono shrink-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConnected ? 'bg-[#2E8557]' : 'bg-[#CE4242]'
              }`}
            />
            <span className={isConnected ? 'text-[#2E8557]' : 'text-[#CE4242]'}>
              {isConnected
                ? latency !== null
                  ? `${latency}ms`
                  : '30Hz'
                : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
