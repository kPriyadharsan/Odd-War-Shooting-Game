import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';

export const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="border-t border-[#1E293B] py-6 text-center text-xs text-slate-500 font-mono">
        ODD WARS &copy; {new Date().getFullYear()} — Server-Authoritative Real-Time Architecture Foundation
      </footer>
    </div>
  );
};
