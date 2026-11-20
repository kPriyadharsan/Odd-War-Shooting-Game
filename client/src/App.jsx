import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
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

            {/* 3. Player Profile, Stats & Character Setup */}
            <Route path="profile" element={<PlayerProfilePage />} />
            <Route path="stats" element={<PlayerProfilePage />} />
            <Route path="profile-setup" element={<ProfileSetupPage />} />

            {/* 4. Global Leaderboard & Standings */}
            <Route path="leaderboard" element={<LeaderboardPage />} />

            {/* 5. Game Lobby & Room Management */}
            <Route path="lobby" element={<RoomsDashboard />} />
            <Route path="rooms" element={<RoomsDashboard />} />
            <Route path="rooms/public" element={<PublicRoomsPage />} />
            <Route path="rooms/create" element={<CreateRoomPage />} />
            <Route path="rooms/join" element={<JoinRoomPage />} />

            {/* 6. Multiplayer Waiting Room */}
            <Route path="rooms/:code" element={<WaitingRoomPage />} />
            <Route path="rooms/:code/waiting" element={<WaitingRoomPage />} />

            {/* 7. Notebook Battlefield Gameplay Arena */}
            <Route path="rooms/:code/battlefield" element={<BattlefieldPage />} />
            <Route path="rooms/:code/game" element={<BattlefieldPage />} />
            <Route path="game/:code" element={<BattlefieldPage />} />

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
