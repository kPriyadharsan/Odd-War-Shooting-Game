import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gamepad2, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { useSocket } from '../hooks/useSocket.js';

export const Navbar = () => {
  const location = useLocation();
  const { isConnected, latency } = useSocket();

  return (
    <header className="border-b border-[#1E293B] bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] transition-all">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 font-mono">
              ODD WARS
            </span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              v1.0.0-dev
            </span>
          </div>
        </Link>

        {/* Real-time connection badge */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#131A29] border border-[#1E293B] text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                  : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
              }`}
            />
            <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {isConnected ? `SOCKET ONLINE (${latency !== null ? `${latency}ms` : 'synced'})` : 'SOCKET OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
