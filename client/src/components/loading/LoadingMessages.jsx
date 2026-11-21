import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_STARTUP_MESSAGES = [
  'Preparing the battlefield...',
  'Setting up your world...',
  'Getting things ready...',
  'The game is almost ready...',
  'Entering ODD WAR...'
];

const DEFAULT_GAME_MESSAGES = [
  'Securing battlefield authorization...',
  'Establishing authoritative game uplink...',
  'Synchronizing notebook grid & territory stations...',
  'Sharpening pencils & setting pencil combat rules...',
  'Entering ODD WAR battlefield...'
];

/**
 * LoadingMessages Component
 *
 * Implements:
 * - Rotating short cinematic messages with smooth fade transitions.
 * - Dynamic message set based on mode ('startup' vs 'game').
 * - Respects active custom message if provided by the initialization coordinator.
 */
export const LoadingMessages = ({
  mode = 'startup',
  activeMessage = null,
  cycleIntervalMs = 2400
}) => {
  const messagePool = mode === 'game' ? DEFAULT_GAME_MESSAGES : DEFAULT_STARTUP_MESSAGES;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeMessage) return; // Prioritize explicit status message

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messagePool.length);
    }, cycleIntervalMs);

    return () => clearInterval(timer);
  }, [activeMessage, messagePool.length, cycleIntervalMs]);

  const displayMessage = activeMessage || messagePool[currentIndex];

  return (
    <div className="h-7 xs:h-8 flex items-center justify-center overflow-hidden mb-2 select-none">
      <AnimatePresence mode="wait">
        <motion.p
          key={displayMessage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="font-mono text-xs xs:text-sm text-white/90 tracking-wide text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] px-4"
        >
          {displayMessage}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

export default LoadingMessages;
