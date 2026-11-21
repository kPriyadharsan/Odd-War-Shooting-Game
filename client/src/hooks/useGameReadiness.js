import { useState, useEffect, useRef, useCallback } from 'react';

const MINIMUM_GAME_DURATION_MS = 5000;

/**
 * Custom hook to coordinate game-entry readiness and the minimum 5-second
 * cinematic loading screen before revealing the Battlefield Arena.
 */
export const useGameReadiness = ({
  minDuration = MINIMUM_GAME_DURATION_MS,
  onComplete = () => {}
} = {}) => {
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState('Securing battlefield clearance...');
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(null);

  const startTimeRef = useRef(Date.now());
  const isGameReadyRef = useRef(false);
  const timerRef = useRef(null);

  const resetGameReadiness = useCallback(() => {
    startTimeRef.current = Date.now();
    isGameReadyRef.current = false;
    setError(null);
    setProgress(15);
    setStatusMessage('Securing battlefield clearance...');
    setIsLoading(true);
    setIsTransitioning(false);
  }, []);

  // Update progress milestone from caller
  const reportMilestone = useCallback((percentage, message) => {
    setProgress((prev) => Math.max(prev, percentage));
    if (message) {
      setStatusMessage(message);
    }
  }, []);

  // Mark room data / socket as authorized and ready
  const markGameReady = useCallback(() => {
    isGameReadyRef.current = true;
    const elapsed = Date.now() - startTimeRef.current;
    const remainingTime = Math.max(0, minDuration - elapsed);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setProgress(100);
      setStatusMessage('Entering ODD WAR battlefield...');
      setIsTransitioning(true);

      setTimeout(() => {
        setIsLoading(false);
        onComplete();
      }, 750);
    }, remainingTime);
  }, [minDuration, onComplete]);

  const reportError = useCallback((err) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setError(err?.message || err || 'Unable to authorize entry into battlefield.');
  }, []);

  useEffect(() => {
    // Smooth progress interpolation towards 90%
    const interval = setInterval(() => {
      setProgress((prev) => {
        const elapsed = Date.now() - startTimeRef.current;
        const timeFraction = Math.min(elapsed / minDuration, 1);
        const maxAllowed = isGameReadyRef.current ? 100 : 90;
        const targetBasedOnTime = Math.round(15 + timeFraction * 75);

        if (prev < targetBasedOnTime && prev < maxAllowed) {
          return Math.min(prev + 2, maxAllowed);
        }
        return prev;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [minDuration]);

  return {
    isLoading,
    isTransitioning,
    progress,
    statusMessage,
    error,
    reportMilestone,
    markGameReady,
    reportError,
    resetGameReadiness
  };
};

export default useGameReadiness;
