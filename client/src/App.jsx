import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { DesignSystemPreview } from './pages/DesignSystemPreview.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<RootLayout />}>
          {/* Main Landing Page (Task 03) */}
          <Route index element={<LandingPage />} />
          {/* Design System Preview (Task 02) */}
          <Route path="design-system" element={<DesignSystemPreview />} />
          {/* Server Architecture & Diagnostic Status (Task 01) */}
          <Route path="system" element={<HomePage />} />
          {/* 404 handler */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
