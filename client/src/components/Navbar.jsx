import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Pencil, User } from 'lucide-react';
import { useSocket } from '../hooks/useSocket.js';

export const Navbar = () => {
  const location = useLocation();
  const { isConnected, latency } = useSocket();

  const isHome = location.pathname === '/';
  const isProfile = location.pathname === '/profile-setup';
  const isDesignSystem = location.pathname === '/design-system';

  const handleHowToPlay = (e) => {
    if (isHome) {
      e.preventDefault();
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="border-b border-[#D5CFC3] bg-[#F8F4EB]/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#23252A] text-[#F8F4EB] flex items-center justify-center shadow-sketch-sm group-hover:bg-[#2B68B4] transition-colors">
            <Pencil className="w-4 h-4" />
          </div>
          <div className="flex items-center">
            <span className="font-handwriting font-bold text-2xl tracking-wide text-[#23252A]">
              ODD WARS
            </span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#EFE8DA] border border-[#D5CFC3] text-[#5C6069]">
              Notebook
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <nav className="flex items-center space-x-1 sm:space-x-1.5 text-xs font-sans font-medium">
            <Link
              to="/"
              className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                isHome
                  ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
                  : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#FAF6EC]'
              }`}
            >
              Home
            </Link>

            <Link
              to="/profile-setup"
              className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                isProfile
                  ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
                  : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#FAF6EC]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>

            {isHome ? (
              <a
                href="#how-it-works"
                onClick={handleHowToPlay}
                className="hidden sm:inline-block px-2.5 py-1.5 rounded-lg border border-transparent text-[#5C6069] hover:border-[#D5CFC3] hover:bg-[#FAF6EC] transition-all"
              >
                How It Works
              </a>
            ) : (
              <Link
                to="/#how-it-works"
                className="hidden sm:inline-block px-2.5 py-1.5 rounded-lg border border-transparent text-[#5C6069] hover:border-[#D5CFC3] hover:bg-[#FAF6EC] transition-all"
              >
                How It Works
              </Link>
            )}

            <Link
              to="/design-system"
              className={`hidden md:inline-block px-2.5 py-1.5 rounded-lg border transition-all ${
                isDesignSystem
                  ? 'bg-[#23252A] text-[#F8F4EB] border-[#23252A] shadow-sketch-sm'
                  : 'text-[#5C6069] border-transparent hover:border-[#D5CFC3] hover:bg-[#FAF6EC]'
              }`}
            >
              Design System
            </Link>
          </nav>

          {/* Real-time Socket Indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#FFFDF9] border border-[#D5CFC3] text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#2E8557]' : 'bg-[#CE4242]'
              }`}
            />
            <span className={isConnected ? 'text-[#2E8557]' : 'text-[#CE4242]'}>
              {isConnected ? `${latency !== null ? `${latency}ms` : '30Hz'}` : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
