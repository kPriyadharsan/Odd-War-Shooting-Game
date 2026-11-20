import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi.js';
import { getPlayerSession, syncAuthenticatedPlayer, clearAuthenticatedPlayer } from '../store/playerSession.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        syncAuthenticatedPlayer(currentUser);
      } else {
        clearAuthenticatedPlayer();
      }
    } catch (err) {
      console.warn('[AuthContext] Session verification check:', err.message);
      setUser(null);
      clearAuthenticatedPlayer();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const loginWithGoogle = (returnTo = window.location.pathname) => {
    const currentSession = getPlayerSession();
    const guestPlayerId = currentSession.isAuthenticated ? null : currentSession.playerId;
    const url = authApi.getGoogleLoginUrl(guestPlayerId, returnTo);
    window.location.href = url;
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch (err) {
      console.error('[AuthContext] Logout failed:', err);
    } finally {
      setUser(null);
      clearAuthenticatedPlayer();
      setIsLoading(false);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        error,
        setError,
        loginWithGoogle,
        logout,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
