import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
