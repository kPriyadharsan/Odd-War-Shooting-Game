import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Route protection gatekeeper.
 * Mandatory check for Google-authenticated players:
 * Prevents access to the game lobby, room creation/joining, and battlefield
 * until all three mandatory onboarding fields (nickname, color, and DOB) are saved.
 *
 * Guest players (!isAuthenticated) pass through freely to preserve guest gameplay.
 */
export const ProfileGate = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-[#23252A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-mono text-xs text-[#5C6069]">Checking warrior credentials...</p>
      </div>
    );
  }

  // If player signed in with Google but hasn't completed their mandatory 3-field profile
  if (isAuthenticated && user && !user.isProfileComplete) {
    if (location.pathname !== '/profile-setup') {
      return <Navigate to="/profile-setup" replace state={{ from: location }} />;
    }
  }

  return children;
};
