import { useState, useEffect, useCallback, useRef } from 'react';
import { runStartupInitialization, isStartupCompleted, markStartupCompleted } from '../services/appInitialization.js';

const MINIMUM_DURATION_MS = 5000;

/**
 * Custom hook to manage genuine application readiness combined with
 * the minimum 5-second cinematic loading duration requirement.
 */
export const useAppReadiness = ({ minDuration = MINIMUM_DURATION_MS, skipIfAlreadyCompleted = true } = {}) => {
  const [shouldShow, setShouldShow] = useState(() => {
    if (skipIfAlreadyCompleted && isStartupCompleted()) {
      return false;
    }
    return true;
  });

  const [progress, setProgress] = useState(10);
  const [statusMessage, setStatusMessage] = useState('Preparing the battlefield...');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState(null);

  const startTimeRef = useRef(Date.now());
  const isDataReadyRef = useRef(false);
  const dataResultRef = useRef(null);

  const startInitialization = useCallback(() => {
    startTimeRef.current = Date.now();
    isDataReadyRef.current = false;
    setError(null);
    setProgress(15);
    setStatusMessage('Preparing the battlefield...');
    setIsInitializing(true);
    setIsTransitioning(false);

    let progressInterval = null;

    // Smoothly interpolate progress towards milestones
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        const elapsed = Date.now() - startTimeRef.current;
        const timeFraction = Math.min(elapsed / minDuration, 1);

        // Cap at 90% until genuine data readiness is confirmed
        const maxAllowed = isDataReadyRef.current ? 100 : 90;
        const targetBasedOnTime = Math.round(15 + timeFraction * 75);

        if (prev < targetBasedOnTime && prev < maxAllowed) {
          return Math.min(prev + 2, maxAllowed);
        }
        return prev;
      });
    }, 100);

    // Run real startup initialization tasks
    runStartupInitialization(({ progress: milestoneProgress, statusMessage: milestoneMessage }) => {
      setProgress((prev) => Math.max(prev, milestoneProgress));
      if (milestoneMessage) {
        setStatusMessage(milestoneMessage);
      }
    })
      .then((result) => {
        dataResultRef.current = result;
        isDataReadyRef.current = true;

        // Calculate remaining time to satisfy minDuration
        const elapsed = Date.now() - startTimeRef.current;
        const remainingTime = Math.max(0, minDuration - elapsed);

        setTimeout(() => {
          clearInterval(progressInterval);
          setProgress(100);
          setStatusMessage('Entering ODD WAR...');
          setIsTransitioning(true);

          // Allow the 100% state and cinematic zoom-fade transition to execute
          setTimeout(() => {
            markStartupCompleted();
            setIsInitializing(false);
            setShouldShow(false);
          }, 850);
        }, remainingTime);
      })
      .catch((err) => {
        clearInterval(progressInterval);
        console.error('[useAppReadiness] Startup initialization error:', err);
        setError(err.message || 'Failed to initialize ODD WAR application subsystems.');
      });

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [minDuration]);

  useEffect(() => {
    if (!shouldShow) return;
    const cleanup = startInitialization();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [shouldShow, startInitialization]);

  return {
    shouldShow,
    isInitializing,
    isTransitioning,
    progress,
    statusMessage,
    error,
    retry: startInitialization,
    initData: dataResultRef.current
  };
};

export default useAppReadiness;
