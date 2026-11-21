import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';

export const RootLayout = () => {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-[#F8F4EB] text-[#23252A] w-full overflow-x-hidden relative">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
