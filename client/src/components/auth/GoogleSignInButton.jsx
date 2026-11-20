import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const GoogleSignInButton = ({
  returnTo = '/lobby',
  text = 'Sign in with Google',
  className = '',
  size = 'md' // 'sm' | 'md' | 'lg'
}) => {
  const { loginWithGoogle } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  const handleClick = () => {
    setRedirecting(true);
    loginWithGoogle(returnTo);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-2 min-h-[36px]',
    md: 'px-4 py-2.5 text-sm gap-2.5 min-h-[44px]',
    lg: 'px-6 py-3.5 text-base gap-3 min-h-[48px]'
  };

  return (
    <motion.button
      type="button"
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={redirecting}
      className={`inline-flex items-center justify-center font-sans font-medium bg-white text-[#3c4043] border border-[#dadce0] rounded-xl hover:bg-[#f8fafd] hover:border-[#d2e3fc] hover:shadow-sketch-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#4285f4]/30 disabled:opacity-60 disabled:cursor-not-allowed select-none ${sizeClasses[size] || sizeClasses.md} ${className}`}
      aria-label="Sign in with your Google Account"
    >
      {redirecting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[#4285f4]" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          {/* Official Google 'G' Icon */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="font-semibold text-[#1f2937]">{text}</span>
        </>
      )}
    </motion.button>
  );
};
