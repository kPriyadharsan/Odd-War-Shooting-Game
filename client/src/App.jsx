import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { ProfileSetupPage } from './pages/ProfileSetupPage.jsx';
import { RoomsDashboard } from './pages/rooms/RoomsDashboard.jsx';
import { PublicRoomsPage } from './pages/rooms/PublicRoomsPage.jsx';
import { CreateRoomPage } from './pages/rooms/CreateRoomPage.jsx';
import { JoinRoomPage } from './pages/rooms/JoinRoomPage.jsx';
import { RoomSummaryPage } from './pages/rooms/RoomSummaryPage.jsx';
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
          {/* Landing Page (Task 03) */}
          <Route index element={<LandingPage />} />

          {/* Player Profile & Character Setup (Task 04) */}
          <Route path="profile-setup" element={<ProfileSetupPage />} />

          {/* Room Management (Task 05) */}
          <Route path="rooms" element={<RoomsDashboard />} />
          <Route path="rooms/public" element={<PublicRoomsPage />} />
          <Route path="rooms/create" element={<CreateRoomPage />} />
          <Route path="rooms/join" element={<JoinRoomPage />} />
          <Route path="rooms/:code" element={<RoomSummaryPage />} />

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
