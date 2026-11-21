import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects.js';

/**
 * RealisticMagicalBook Component
 *
 * Implements:
 * 1. Physical vintage notebook aesthetics (deep leather texture, gold foil accents, spine ribs, stacked paper edges).
 * 2. 3D CSS perspective & transform-style: preserve-3d.
 * 3. Physical book opening animation: cover rotates around spine axis (0deg -> -180deg).
 * 4. Realistic individual 3D page turns:
 *    - Each page lifts and flexes with dynamic 3D curvature and lighting.
 *    - Front and back surfaces rendered with proper double-sided visibility.
 *    - Staged sequence: Initial -> Rapid flurry -> Slowdown -> Final page settling.
 * 5. Number reveal: STRICTLY ONLY THE NUMBER displayed in bold classic game-ink typography.
 * 6. Procedural audio synchronization via soundEffects.js.
 * 7. Mobile-first responsive dimensions & prefers-reduced-motion support.
 */

// Animation States
export const BOOK_STATES = {
  HIDDEN: 'HIDDEN',
  APPEARING: 'APPEARING',
  IDLE_CLOSED: 'IDLE_CLOSED',
  OPENING: 'OPENING',
  FLIPPING: 'FLIPPING',
  SLOWING_DOWN: 'SLOWING_DOWN',
  REVEALING: 'REVEALING',
  RESULT_VISIBLE: 'RESULT_VISIBLE',
  CLOSING: 'CLOSING'
};

export const RealisticMagicalBook = ({
  isOpen = true,
  isFlipping = false,
  finalPageNumber = null,
  maxPages = 100,
  outcome = null,
  isCurrentPlayer = true,
  onOpen = () => {},
  onAnimationComplete = () => {},
  autoCloseDelayMs = 2800
}) => {
  // State Machine
  const [animState, setAnimState] = useState(BOOK_STATES.IDLE_CLOSED);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Staggered leaf rotation angles for individual 3D turning sheets
  // We simulate 6 sequential animated leaves that turn over the spine
  const [turningLeaves, setTurningLeaves] = useState([]);
  const [activeRevealedNumber, setActiveRevealedNumber] = useState(null);
  const [isPressed, setIsPressed] = useState(false);

  // References for unmount/timer cleanups
  const timersRef = useRef([]);
  const animFrameRef = useRef(null);
  const isMountedRef = useRef(true);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const addTimer = useCallback((fn, delay) => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) fn();
    }, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);

  // Detect accessibility prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);

      const handler = (e) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Entrance sound on appearance
  useEffect(() => {
    if (isOpen) {
      soundEffects.playBookEntrance();
    }
  }, [isOpen]);

  // Core Orchestrated 3D Page Turning Sequence
  const runPageTurnSequence = useCallback(
    (targetNumber) => {
      clearAllTimers();
      setAnimState(BOOK_STATES.FLIPPING);

      // In reduced motion mode, skip continuous flipping
      if (prefersReducedMotion) {
        setActiveRevealedNumber(targetNumber || finalPageNumber || 1);
        setAnimState(BOOK_STATES.RESULT_VISIBLE);
        soundEffects.playMagicShimmer();
        soundEffects.playResultChime(((targetNumber || finalPageNumber || 1) % 10) % 2 !== 0);
        onAnimationComplete();
        return;
      }

      // Configure multi-sheet flipping choreography
      // Total 7 individual cascading sheets with progressive timing
      const TOTAL_PAGES = 7;
      let currentTurnIndex = 0;

      // Stage A (Initial controlled flip): ~180ms
      // Stage B (Rapid flipping): ~70ms per flip
      // Stage C (Decelerating slowdown): ~140ms -> 220ms -> 340ms
      // Stage D (Final settle & reveal): settle on last page
      const delays = [80, 240, 310, 380, 480, 640, 880];

      setTurningLeaves([]);

      delays.forEach((delay, idx) => {
        addTimer(() => {
          if (!isMountedRef.current) return;

          // Sound effect proportional to flipping speed
          const speedFactor = idx <= 1 ? 1.0 : idx <= 4 ? 2.0 : 1.2;
          soundEffects.playPageFlip(speedFactor);

          // Add newly flipping page with active rotation
          setTurningLeaves((prev) => [
            ...prev,
            {
              id: `leaf_${idx}_${Date.now()}`,
              index: idx,
              isFinal: idx === TOTAL_PAGES - 1,
              rotation: -180,
              duration: idx === TOTAL_PAGES - 1 ? 0.65 : 0.35 + idx * 0.03
            }
          ]);

          if (idx === 4) {
            setAnimState(BOOK_STATES.SLOWING_DOWN);
          }

          if (idx === TOTAL_PAGES - 1) {
            // Stage D: Final page settlement
            addTimer(() => {
              if (!isMountedRef.current) return;
              const authoritativeNum = targetNumber ?? finalPageNumber ?? outcome?.pageNumber ?? 7;
              setActiveRevealedNumber(authoritativeNum);
              setAnimState(BOOK_STATES.REVEALING);

              soundEffects.playMagicShimmer();
              const isOdd = ((authoritativeNum % 10) % 2) !== 0;
              soundEffects.playResultChime(isOdd);

              addTimer(() => {
                if (!isMountedRef.current) return;
                setAnimState(BOOK_STATES.RESULT_VISIBLE);
                onAnimationComplete();
              }, 400);
            }, 550);
          }
        }, delay);
      });
    },
    [clearAllTimers, prefersReducedMotion, finalPageNumber, outcome, onAnimationComplete, addTimer]
  );

  // Trigger from user click or multiplayer broadcast
  const handleBookClick = () => {
    // Prevent duplicate clicks or non-active interactions
    if (animState !== BOOK_STATES.IDLE_CLOSED || !isCurrentPlayer) return;

    setIsPressed(true);
    soundEffects.playButtonClick();

    // 1. Physical press down
    addTimer(() => {
      setIsPressed(false);
      setAnimState(BOOK_STATES.OPENING);
      soundEffects.playBookOpen();

      // Notify parent to emit socket event / call REST
      onOpen();

      // 2. Cover completes opening at ~650ms, then start flipping
      addTimer(() => {
        runPageTurnSequence(finalPageNumber || outcome?.pageNumber);
      }, 650);
    }, 120);
  };

  // Synchronize when multiplayer event triggers flipping externally
  useEffect(() => {
    if (isFlipping && animState === BOOK_STATES.IDLE_CLOSED) {
      setAnimState(BOOK_STATES.OPENING);
      soundEffects.playBookOpen();

      addTimer(() => {
        runPageTurnSequence(finalPageNumber || outcome?.pageNumber);
      }, 600);
    }
  }, [isFlipping, animState, finalPageNumber, outcome, runPageTurnSequence, addTimer]);

  // Synchronize when outcome arrives after animation already started
  useEffect(() => {
    if (finalPageNumber !== null && animState === BOOK_STATES.RESULT_VISIBLE && activeRevealedNumber === null) {
      setActiveRevealedNumber(finalPageNumber);
    }
  }, [finalPageNumber, animState, activeRevealedNumber]);

  const isCoverOpen = animState !== BOOK_STATES.IDLE_CLOSED;

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none py-6 sm:py-10">
      {/* 3D Perspective Scene Container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          perspective: '1500px',
          perspectiveOrigin: 'center center'
        }}
      >
        {/* Dynamic Cast Ambient Shadow on Table/Battlefield beneath the floating book */}
        <motion.div
          className="absolute -bottom-10 sm:-bottom-14 left-1/2 -translate-x-1/2 w-[240px] xs:w-[280px] sm:w-[380px] md:w-[460px] h-10 sm:h-14 rounded-full bg-black/45 blur-xl pointer-events-none"
          animate={
            isPressed
              ? { scale: 0.9, opacity: 0.65 }
              : isCoverOpen
              ? { scaleX: 1.35, scaleY: 1.1, opacity: 0.45, y: -4 }
              : { scaleX: [1, 1.06, 1], opacity: [0.35, 0.48, 0.35], y: [0, -6, 0] }
          }
          transition={{ duration: 3.2, repeat: isCoverOpen ? 0 : Infinity, ease: 'easeInOut' }}
        />

        {/* Floating 3D Book Assembly */}
        <motion.div
          className="relative flex items-center justify-center cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          animate={
            isPressed
              ? { scale: 0.96, y: 8 }
              : isCoverOpen
              ? {
                  y: 0,
                  rotateX: 12,
                  rotateY: 0,
                  rotateZ: 0
                }
              : {
                  y: [0, -10, 0],
                  rotateX: [14, 18, 14],
                  rotateY: [-3, 3, -3],
                  rotateZ: [-1, 1, -1]
                }
          }
          transition={
            isCoverOpen
              ? { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
              : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
          }
          onClick={handleBookClick}
        >
          {/* =========================================================================
              THE BOOK FOUNDATION (Left Stack + Right Stack + Spine)
              ========================================================================= */}
          <div
            className={`relative transition-all duration-700 ease-out ${
              isCoverOpen
                ? 'w-[320px] xs:w-[380px] sm:w-[500px] md:w-[560px] h-[210px] xs:h-[250px] sm:h-[320px] md:h-[360px]'
                : 'w-[160px] xs:w-[190px] sm:w-[250px] md:w-[280px] h-[210px] xs:h-[250px] sm:h-[320px] md:h-[360px]'
            }`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Ambient Back Cover Base */}
            <div
              className="absolute inset-0 rounded-2xl bg-[#18191E] shadow-[0_20px_50px_rgba(0,0,0,0.65)] border-2 border-[#D59926]/30"
              style={{
                transform: 'translateZ(-16px)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.85), inset 0 0 40px rgba(0,0,0,0.6)'
              }}
            />

            {/* Realistic Stacked Paper Edge Striations (Right side thickness) */}
            <div
              className="absolute right-0 top-1 bottom-1 w-4 xs:w-5 sm:w-6 bg-gradient-to-r from-[#DFD7C5] via-[#EDE6D6] to-[#C9BFAC] rounded-r-md border-r border-[#242730]/40 pointer-events-none"
              style={{
                transform: 'rotateY(90deg) translateZ(-2px)',
                transformOrigin: 'right center',
                backgroundImage:
                  'repeating-linear-gradient(to bottom, #EDE6D6 0px, #DFD7C5 2px, #C9BFAC 3px, #EDE6D6 4px)'
              }}
            />

            {/* Realistic Stacked Paper Edge Striations (Left side thickness when open) */}
            {isCoverOpen && (
              <div
                className="absolute left-0 top-1 bottom-1 w-4 xs:w-5 sm:w-6 bg-gradient-to-l from-[#DFD7C5] via-[#EDE6D6] to-[#C9BFAC] rounded-l-md border-l border-[#242730]/40 pointer-events-none"
                style={{
                  transform: 'rotateY(-90deg) translateZ(-2px)',
                  transformOrigin: 'left center',
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, #EDE6D6 0px, #DFD7C5 2px, #C9BFAC 3px, #EDE6D6 4px)'
                }}
              />
            )}

            {/* =========================================================================
                THE OPEN BOOK INTERIOR SPREAD
                ========================================================================= */}
            {isCoverOpen && (
              <div
                className="absolute inset-0 w-full h-full flex rounded-xl overflow-hidden border border-[#242730] shadow-inner"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* -------------------------------------------------------------------
                    LEFT SPREAD: Aged Parchment Pages & Turn History
                    ------------------------------------------------------------------- */}
                <div
                  className="relative w-1/2 h-full bg-[#F4EFE2] border-r border-[#242730]/30 p-3 sm:p-5 flex flex-col justify-between overflow-hidden"
                  style={{
                    boxShadow: 'inset -15px 0 25px rgba(0,0,0,0.12), inset 1px 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  {/* Authentic Exercise Notebook Blue Ruling Lines */}
                  <div className="absolute inset-0 pointer-events-none opacity-30 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_23px,rgba(43,104,180,0.35)_24px)]" />

                  {/* Red Notebook Vertical Margin Line */}
                  <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-[#D75050]/40 pointer-events-none" />

                  {/* Left Page Header: Minimal Notebook Page Marker */}
                  <div className="relative z-10 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-[#8C929D] border-b border-[#242730]/15 pb-1 pl-3 sm:pl-4">
                    <span>ODD WAR ARCHIVES</span>
                    <span>FOLIO IX</span>
                  </div>

                  {/* Left Page Body: Atmospheric Notebook Inscriptions */}
                  <div className="relative z-10 my-auto pl-3 sm:pl-4 space-y-2 text-[#4A4F5B] opacity-75">
                    <p className="font-handwriting text-xs sm:text-sm font-bold text-[#23252A]">
                      The Book of Sacred Fate
                    </p>
                    <p className="font-handwriting text-[10px] sm:text-xs leading-relaxed text-[#5C6069]">
                      Turn the leaves of ruled parchment.
                      The final digit commands the battlefield.
                    </p>
                  </div>

                  {/* Left Page Footer */}
                  <div className="relative z-10 pl-3 sm:pl-4 text-[8px] sm:text-[9px] font-mono text-[#8C929D]">
                    Page 42 • Left Margin
                  </div>
                </div>

                {/* -------------------------------------------------------------------
                    CENTRAL BOOK BINDING & SHADOW CREASE
                    ------------------------------------------------------------------- */}
                <div
                  className="absolute left-1/2 top-0 bottom-0 w-6 -translate-x-1/2 z-30 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(36,39,48,0.45) 48%, rgba(20,22,28,0.6) 50%, rgba(36,39,48,0.45) 52%, rgba(0,0,0,0.25) 100%)'
                  }}
                />

                {/* -------------------------------------------------------------------
                    RIGHT SPREAD: Destination Page for Turning Sheets & Final Result
                    ------------------------------------------------------------------- */}
                <div
                  className="relative w-1/2 h-full bg-[#FAF6EC] p-3 sm:p-5 flex flex-col justify-between overflow-hidden"
                  style={{
                    boxShadow: 'inset 15px 0 25px rgba(0,0,0,0.1), inset -1px 1px 0 rgba(255,255,255,0.6)'
                  }}
                >
                  {/* Authentic Exercise Notebook Blue Ruling Lines */}
                  <div className="absolute inset-0 pointer-events-none opacity-30 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_23px,rgba(43,104,180,0.35)_24px)]" />

                  {/* -----------------------------------------------------------------
                      STRICT REQUIREMENT 6: ONLY THE NUMBER IS SHOWN ON THE FINAL PAGE
                      No headings, no labels, no descriptions, no decorative titles.
                      ----------------------------------------------------------------- */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    {activeRevealedNumber !== null ? (
                      <motion.div
                        key={activeRevealedNumber}
                        initial={{ scale: 1.4, opacity: 0, filter: 'blur(3px)' }}
                        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        transition={{
                          type: 'spring',
                          stiffness: 450,
                          damping: 24,
                          duration: 0.45
                        }}
                        className="relative flex items-center justify-center select-none"
                      >
                        {/* The Large, Bold, Classic Game-Style Number */}
                        <span
                          className="font-display font-black text-6xl xs:text-7xl sm:text-8xl md:text-9xl text-[#1E222B] tracking-tight leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                          style={{
                            fontFamily: '"Patrick Hand", cursive, sans-serif'
                          }}
                        >
                          {activeRevealedNumber}
                        </span>

                        {/* Subtle Aged Ink Stamp Splatter Accent */}
                        <div className="absolute -inset-2 bg-radial from-[#242730]/10 to-transparent rounded-full blur-md -z-10 pointer-events-none" />
                      </motion.div>
                    ) : (
                      /* Placeholder while pages are rapidly turning */
                      <div className="opacity-0">0</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                INDIVIDUAL 3D TURNING LEAVES (CASCADING PAGE FLIP SEQUENCE)
                ========================================================================= */}
            {isCoverOpen && (
              <div
                className="absolute right-0 top-0 w-1/2 h-full pointer-events-none z-20"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {turningLeaves.map((leaf) => (
                  <motion.div
                    key={leaf.id}
                    className="absolute inset-0 w-full h-full"
                    style={{
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                      zIndex: 30 + leaf.index
                    }}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: leaf.rotation }}
                    transition={{
                      duration: leaf.duration,
                      ease: leaf.isFinal ? [0.22, 1, 0.36, 1] : [0.38, 0.05, 0.22, 1]
                    }}
                  >
                    {/* Front Face of Turning Leaf (Ruled Paper with Dynamic Curvature Gradient) */}
                    <div
                      className="absolute inset-0 w-full h-full bg-[#FAF6EC] border-r border-[#242730]/20 rounded-r-md overflow-hidden"
                      style={{
                        backfaceVisibility: 'hidden',
                        boxShadow: 'inset 8px 0 16px rgba(0,0,0,0.15), 4px 0 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Notebook Ruling Lines on Turning Sheet */}
                      <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_23px,rgba(43,104,180,0.35)_24px)]" />

                      {/* Dynamic Paper Curl Ridge Highlight */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-white/50 to-black/10 opacity-70 pointer-events-none" />
                    </div>

                    {/* Back Face of Turning Leaf (Visible when rotated past -90deg) */}
                    <div
                      className="absolute inset-0 w-full h-full bg-[#F4EFE2] border-l border-[#242730]/20 rounded-l-md overflow-hidden"
                      style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        boxShadow: 'inset -8px 0 16px rgba(0,0,0,0.15), -4px 0 10px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Notebook Ruling Lines on Back Face */}
                      <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_23px,rgba(43,104,180,0.35)_24px)]" />

                      {/* Red Notebook Margin on Reverse */}
                      <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-[#D75050]/30 pointer-events-none" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* =========================================================================
                THE 3D HARDCOVER (Front Cover that Rotates from 0deg to -180deg)
                ========================================================================= */}
            <motion.div
              className={`absolute top-0 w-[160px] xs:w-[190px] sm:w-[250px] md:w-[280px] h-full rounded-r-2xl rounded-l-sm bg-gradient-to-r from-[#1B1C22] via-[#242630] to-[#1E2028] border-2 border-[#D59926]/50 shadow-2xl p-4 sm:p-6 flex flex-col justify-between cursor-pointer group ${
                isCoverOpen ? 'pointer-events-none' : ''
              }`}
              style={{
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                right: isCoverOpen ? 'auto' : 0,
                left: isCoverOpen ? '50%' : 'auto',
                boxShadow:
                  '-8px 15px 35px rgba(0,0,0,0.85), inset 0 0 30px rgba(0,0,0,0.6), 0 0 15px rgba(213,153,38,0.25)'
              }}
              animate={
                isCoverOpen
                  ? {
                      rotateY: -180,
                      transition: {
                        duration: prefersReducedMotion ? 0.3 : 0.65,
                        ease: [0.25, 1, 0.5, 1]
                      }
                    }
                  : {
                      rotateY: 0
                    }
              }
            >
              {/* Spine Joint Texture & Metal Hinges on Left */}
              <div
                className="absolute left-0 top-0 bottom-0 w-5 xs:w-6 bg-gradient-to-r from-[#0E0F12] via-[#1A1B22] to-transparent border-r border-[#D59926]/40 rounded-l-sm flex flex-col justify-between py-5 items-center z-20 pointer-events-none"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="w-2.5 h-4 rounded-xs border-t-2 border-b-2 border-[#D59926]/60 bg-[#D59926]/20 shadow-xs" />
                <div className="w-2.5 h-4 rounded-xs border-t-2 border-b-2 border-[#D59926]/60 bg-[#D59926]/20 shadow-xs" />
                <div className="w-2.5 h-4 rounded-xs border-t-2 border-b-2 border-[#D59926]/60 bg-[#D59926]/20 shadow-xs" />
              </div>

              {/* Gold Embossed Corner Ornaments */}
              <div
                className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-[#D59926] rounded-tr pointer-events-none"
                style={{ backfaceVisibility: 'hidden' }}
              />
              <div
                className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-[#D59926] rounded-br pointer-events-none"
                style={{ backfaceVisibility: 'hidden' }}
              />

              {/* Front Cover Header: Embossed Title */}
              <div
                className="text-center pt-2 relative z-10"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="font-mono text-[8px] xs:text-[9px] tracking-[0.25em] text-[#D59926] uppercase font-bold drop-shadow">
                  NOTEBOOK ARCHIVES
                </span>
              </div>

              {/* Central Seal & ODD WAR Brand Medallion */}
              <div
                className="flex flex-col items-center justify-center my-auto text-center relative z-10"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[#D59926] bg-[#D59926]/10 flex items-center justify-center mb-2.5 shadow-[inset_0_0_15px_rgba(213,153,38,0.3)] group-hover:scale-105 group-hover:bg-[#D59926]/20 transition-all">
                  <BookOpen className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-[#D59926] drop-shadow-[0_2px_8px_rgba(213,153,38,0.5)]" />
                </div>
                <h3 className="font-display text-lg xs:text-xl sm:text-2xl font-bold tracking-wider text-[#F8F4EB] drop-shadow-md">
                  ODD WAR
                </h3>
                <span className="font-handwriting text-xs sm:text-sm text-[#D59926] font-semibold">
                  Magical Book of Fate
                </span>
              </div>

              {/* Front Cover Footer */}
              <div
                className="text-center pb-1 relative z-10"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="font-mono text-[9px] sm:text-[10px] text-[#A2A8B5] px-2.5 py-0.5 rounded-full bg-black/50 border border-white/10 shadow-xs">
                  {maxPages} Ruled Pages
                </span>
              </div>

              {/* Inside Front Cover (Reverse marbling texture seen when flipped open) */}
              <div
                className="absolute inset-0 w-full h-full bg-[#181920] rounded-l-2xl rounded-r-sm p-4 overflow-hidden border border-[#242730]"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)'
                }}
              >
                <div className="w-full h-full border border-[#D59926]/30 rounded-lg p-3 flex flex-col justify-between text-center opacity-60">
                  <span className="font-mono text-[8px] text-[#D59926]">EX LIBRIS NOTEBOOK</span>
                  <div className="w-8 h-8 rounded-full border border-[#D59926]/40 mx-auto flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#D59926]" />
                  </div>
                  <span className="font-mono text-[8px] text-[#8C929D]">AUTHORITATIVE DRAW</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Floating Prompt for the Active Player (Only when book is waiting to be opened) */}
      {!isCoverOpen && isCurrentPlayer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-6 flex flex-col items-center gap-1 pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#242730] text-[#F8F4EB] border border-[#D59926]/60 shadow-lg font-mono text-xs font-bold animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-[#D59926]" />
            <span>CLICK NOTEBOOK TO OPEN & FLIP</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RealisticMagicalBook;
