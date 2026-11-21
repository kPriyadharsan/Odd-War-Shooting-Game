import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { RealisticMagicalBook } from './RealisticMagicalBook.jsx';
import { soundEffects } from '../../services/soundEffects.js';

/**
 * MagicalBookOverlay Component
 *
 * Implements:
 * 1. React Portal overlay directly onto document.body at top-level z-index (z-[9999]).
 * 2. Never clipped by parent containers, stacking contexts, or overflows.
 * 3. Keeps notebook battlefield visible with subtle darkened/blurred backdrop.
 * 4. Not an ordinary rectangular modal: The physical magical notebook itself floats directly
 *    in the center of the viewport with 3D perspective and dynamic ambient shadow.
 * 5. Automatic transition flow:
 *    - Waiting: floats gently.
 *    - Click: opens cover in 3D around spine.
 *    - Flips: individual cascading sheets flip with sound.
 *    - Settles: ONLY the server-generated number appears in vintage ink.
 *    - Auto-dismisses smoothly after revealing the number, returning focus to the battlefield.
 */
export const MagicalBookOverlay = ({
  isOpen = false,
  isFlipping = false,
  outcome = null,
  bookPageCount = 100,
  activePlayerNickname = 'Warrior',
  isCurrentPlayer = false,
  onOpenBook = () => {},
  onClose = () => {},
  autoCloseDelayMs = 2800
}) => {
  const [hasFinishedAnimation, setHasFinishedAnimation] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isFlipping) {
      setHasFinishedAnimation(false);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }
  }, [isFlipping]);

  const handleAnimationComplete = () => {
    setHasFinishedAnimation(true);

    // Auto-dismiss after the player has observed the revealed number
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, autoCloseDelayMs);
  };

  if (!isOpen || !isMounted || typeof document === 'undefined') return null;

  const pageNumber = outcome?.pageNumber ?? null;

  const overlayContent = (
    <AnimatePresence>
      <motion.div
        key="magical-book-overlay-portal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed inset-0 z-[9999] w-screen h-screen h-dvh min-h-dvh flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none overflow-hidden"
      >
        {/* Subtle Ambient Particle & Battlefield Backdrop Lighting */}
        <div className="absolute inset-0 bg-radial from-[#D59926]/10 via-transparent to-black/70 pointer-events-none" />

        {/* Minimalist Close / Dismiss Button (Top Right) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors z-50 cursor-pointer"
          title="Dismiss book"
          aria-label="Dismiss book"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Top Floating Turn Status Label */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-[#D59926]/40 text-white font-mono text-[11px] sm:text-xs font-bold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#D59926]" />
            <span>
              {isCurrentPlayer
                ? 'YOUR TURN: MAGICAL BOOK OF FATE'
                : `${activePlayerNickname.toUpperCase()}'S TURN: MAGICAL BOOK`}
            </span>
          </div>
        </motion.div>

        {/* The 3D Floating Physical Notebook (Center of Viewport) */}
        <motion.div
          initial={{ scale: 0.85, y: 25, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.88, y: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative z-30 max-w-full flex items-center justify-center"
        >
          <RealisticMagicalBook
            isOpen={isOpen}
            isFlipping={isFlipping}
            finalPageNumber={pageNumber}
            maxPages={bookPageCount}
            outcome={outcome}
            isCurrentPlayer={isCurrentPlayer}
            onOpen={onOpenBook}
            onAnimationComplete={handleAnimationComplete}
            autoCloseDelayMs={autoCloseDelayMs}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(overlayContent, document.body);
};

export default MagicalBookOverlay;
