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
import { WaitingRoomPage } from './pages/rooms/WaitingRoomPage.jsx';
import { BattlefieldPage } from './pages/rooms/BattlefieldPage.jsx';
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
          {/* 1. Landing Page */}
          <Route index element={<LandingPage />} />

          {/* 2. Player Profile & Character Setup */}
          <Route path="profile-setup" element={<ProfileSetupPage />} />

          {/* 3. Game Lobby & Room Management */}
          <Route path="lobby" element={<RoomsDashboard />} />
          <Route path="rooms" element={<RoomsDashboard />} />
          <Route path="rooms/public" element={<PublicRoomsPage />} />
          <Route path="rooms/create" element={<CreateRoomPage />} />
          <Route path="rooms/join" element={<JoinRoomPage />} />

          {/* 4. Multiplayer Waiting Room */}
          <Route path="rooms/:code" element={<WaitingRoomPage />} />
          <Route path="rooms/:code/waiting" element={<WaitingRoomPage />} />

          {/* 5. Notebook Battlefield Gameplay Arena */}
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
  );
}

export default App;
