import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, UserCheck, AlertTriangle, ArrowRight, Trophy, BookOpen, RefreshCw } from 'lucide-react';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState(null);

  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (isAuthenticated) {
      if (!user?.isProfileComplete) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (errorParam) {
      if (errorParam === 'google_not_configured') {
        setErrorMessage('Google OAuth credentials are not yet configured on this server. Running in guest development mode.');
      } else if (errorParam === 'access_denied') {
        setErrorMessage('Google authorization was cancelled or denied.');
      } else if (errorParam === 'session_expired') {
        setErrorMessage('The login attempt timed out. Please try signing in again.');
      } else {
        setErrorMessage(`Sign-in could not be completed: ${decodeURIComponent(errorParam)}`);
      }
    } else {
      setErrorMessage(null);
    }
  }, [errorParam]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#FAF6EC] border-2 border-[#23252A] rounded-2xl shadow-sketch-lg p-6 sm:p-8 relative overflow-hidden"
      >
        {/* Subtle Notebook Ruling */}
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(to_bottom,transparent_27px,#D5CFC3_28px)] bg-[size:100%_28px]" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#23252A] text-[#F8F4EB] flex items-center justify-center mx-auto shadow-sketch-sm rotate-[-2deg]">
              <ShieldCheck className="w-6 h-6 text-[#FBBF24]" />
            </div>
            <h1 className="font-handwriting font-bold text-3xl text-[#23252A]">
              Notebook Warrior Portal
            </h1>
            <p className="font-mono text-xs text-[#5C6069] max-w-xs mx-auto leading-relaxed">
              Sign in with Google to synchronize your combat records, match victories, and leaderboard honor across all devices.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#F87171] flex items-start gap-2.5 text-xs font-mono text-[#991B1B]"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Authentication Notice</span>
                <span>{errorMessage}</span>
              </div>
            </motion.div>
          )}

          {/* Value Highlights */}
          <div className="p-4 rounded-xl bg-white border border-[#D5CFC3] shadow-sketch-sm space-y-2.5 text-xs font-mono text-[#4B5563]">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>Permanent Global Leaderboard ranking</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Full match history & combat telemetry archive</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Preserves your active guest battle record</span>
            </div>
          </div>

          {/* Sign In Button Action */}
          <div className="space-y-3 pt-2">
            <GoogleSignInButton
              returnTo="/profile"
              text="Continue with Google"
              size="lg"
              className="w-full shadow-sketch-sm"
            />

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#D5CFC3]"></div>
              <span className="flex-shrink mx-3 text-[11px] font-mono text-[#9CA3AF] uppercase">or</span>
              <div className="flex-grow border-t border-[#D5CFC3]"></div>
            </div>

            <Link
              to="/lobby"
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-[#D5CFC3] bg-transparent hover:bg-[#F4EEDB] text-center font-handwriting font-bold text-sm text-[#23252A] transition-colors flex items-center justify-center"
            >
              Play as Guest Warrior
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-center font-mono text-[10px] text-[#9CA3AF]">
            We only request your basic identity (name, email & profile photo). No unwanted permissions or spam.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
