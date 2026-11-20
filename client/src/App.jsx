import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProfileGate } from './components/auth/ProfileGate.jsx';
import { RootLayout } from './layouts/RootLayout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ProfileSetupPage } from './pages/ProfileSetupPage.jsx';
import { PlayerProfilePage } from './pages/PlayerProfilePage.jsx';
import { LeaderboardPage } from './pages/LeaderboardPage.jsx';
import { RoomsDashboard } from './pages/rooms/RoomsDashboard.jsx';
import { PublicRoomsPage } from './pages/rooms/PublicRoomsPage.jsx';
import { CreateRoomPage } from './pages/rooms/CreateRoomPage.jsx';
import { JoinRoomPage } from './pages/rooms/JoinRoomPage.jsx';
import { RoomSummaryPage } from './pages/rooms/RoomSummaryPage.jsx';
import { WaitingRoomPage } from './pages/rooms/WaitingRoomPage.jsx';
import { BattlefieldPage } from './pages/rooms/BattlefieldPage.jsx';
import { DesignSystemPreview } from './pages/DesignSystemPreview.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<RootLayout />}>
            {/* 1. Landing Page */}
            <Route index element={<LandingPage />} />

            {/* 2. Authentication */}
            <Route path="login" element={<LoginPage />} />

            {/* 3. Mandatory Onboarding & Identity Setup */}
            <Route path="profile-setup" element={<ProfileSetupPage />} />

            {/* 4. Protected Game Areas (Mandatory Profile Gate for Google users) */}
            <Route
              path="profile"
              element={
                <ProfileGate>
                  <PlayerProfilePage />
                </ProfileGate>
              }
            />
            <Route
              path="stats"
              element={
                <ProfileGate>
                  <PlayerProfilePage />
                </ProfileGate>
              }
            />
            <Route
              path="leaderboard"
              element={
                <ProfileGate>
                  <LeaderboardPage />
                </ProfileGate>
              }
            />
            <Route
              path="lobby"
              element={
                <ProfileGate>
                  <RoomsDashboard />
                </ProfileGate>
              }
            />
            <Route
              path="rooms"
              element={
                <ProfileGate>
                  <RoomsDashboard />
                </ProfileGate>
              }
            />
            <Route
              path="rooms/public"
              element={
                <ProfileGate>
                  <PublicRoomsPage />
                </ProfileGate>
              }
            />
            <Route
              path="rooms/create"
              element={
                <ProfileGate>
                  <CreateRoomPage />
                </ProfileGate>
              }
            />
            <Route
              path="rooms/join"
              element={
                <ProfileGate>
                  <JoinRoomPage />
                </ProfileGate>
              }
            />
            <Route
              path="rooms/:code"
              element={
                <ProfileGate>
                  <WaitingRoomPage />
                </ProfileGate>
              }
            />
            <Route
              path="rooms/:code/waiting"
              element={
                <ProfileGate>
                  <WaitingRoomPage />
                </ProfileGate>
              }
            />
            <Route
              path="rooms/:code/battlefield"
              element={
                <ProfileGate>
                  <BattlefieldPage />
                </ProfileGate>
              }
            />
            <Route
              path="rooms/:code/game"
              element={
                <ProfileGate>
                  <BattlefieldPage />
                </ProfileGate>
              }
            />
            <Route
              path="game/:code"
              element={
                <ProfileGate>
                  <BattlefieldPage />
                </ProfileGate>
              }
            />

            {/* Development & Internal Diagnostic Views (Isolated to dev mode) */}
            {import.meta.env.DEV && (
              <>
                <Route path="dev/design-system" element={<DesignSystemPreview />} />
                <Route path="dev/system" element={<HomePage />} />
              </>
            )}

            {/* 404 handler */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
