import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';

export const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4EB] text-[#23252A]">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
