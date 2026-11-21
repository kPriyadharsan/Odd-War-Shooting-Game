import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { LoadingArtwork } from './LoadingArtwork.jsx';
import { LoadingBranding } from './LoadingBranding.jsx';
import { LoadingProgress } from './LoadingProgress.jsx';
import { LoadingMessages } from './LoadingMessages.jsx';

/**
 * CinematicLoadingScreen Component
 *
 * Implements:
 * - GTA V cover-art inspired presentation with vertical artwork.
 * - Slow cinematic zoom on artwork.
 * - Single ODD WAR branding.
 * - Rotating cinematic messages.
 * - Milestone-based progress bar.
 * - Graceful retry / error handling (never trap user).
 * - Fade + Zoom exit transition.
 * - Works identically for startup and game-entry contexts.
 */
export const CinematicLoadingScreen = ({
  mode = 'startup',
  progress = 0,
  statusMessage = null,
  error = null,
  onRetry = null,
  onCancel = null,
  isTransitioning = false,
  minDuration = 5
}) => {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] w-screen h-screen h-dvh min-h-dvh overflow-hidden bg-[#07080B] flex flex-col justify-between"
      initial={{ opacity: 1 }}
      animate={{ opacity: isTransitioning ? 0 : 1 }}
      transition={{ duration: 0.75, ease: 'easeInOut' }}
    >
      {/* 1. Full-Screen Vertical Artwork with Slow Cinematic Zoom */}
      <LoadingArtwork isTransitioning={isTransitioning} duration={minDuration} />

      {/* 2. ODD WAR Logo Branding (Top) */}
      <LoadingBranding />

      {/* 3. Error Overlay (Displayed if essential initialization encounters failure) */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-40 my-auto mx-auto w-full max-w-sm px-6 py-6 rounded-2xl bg-black/85 backdrop-blur-xl border border-red-500/30 shadow-2xl text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-sans font-bold text-lg text-white mb-1">
              {mode === 'game' ? 'Game Entry Halted' : 'Initialization Notice'}
            </h3>

            <p className="font-mono text-xs text-slate-300 leading-relaxed mb-6">
              {typeof error === 'string' ? error : error?.message || 'Connection could not be verified.'}
            </p>

            <div className="flex flex-col gap-2.5">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2B68B4] to-[#1A4E8C] hover:from-[#357ACF] hover:to-[#225FA8] text-white font-sans font-semibold text-xs tracking-wide shadow-lg transition active:scale-[0.98]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              )}

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-sans text-xs tracking-wide transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Safety</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Bottom Controls: Cinematic Messages + Animated Progress Bar */}
      <div className="relative z-30 pb-safe-bottom pb-8 sm:pb-12 pt-4 px-4 w-full flex flex-col items-center">
        {!error && (
          <>
            <LoadingMessages mode={mode} activeMessage={statusMessage} />
            <LoadingProgress progress={progress} isReady={progress >= 100} />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CinematicLoadingScreen;
