import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects.js';

/**
 * 3D-Style Magical Book Component (Task 08)
 *
 * Implements:
 * - 3D CSS perspective transforms for realistic book appearance.
 * - Aged notebook leather hardcover with golden embossing.
 * - Layered page edges and parchment leaves.
 * - Rapid page flipping animation with deceleration.
 * - Golden magical glow and sparkle particles.
 * - Final page number reveal.
 * - Accessibility: respects prefers-reduced-motion.
 */
export const MagicalBook = ({
  isOpening = false,
  isFlipping = false,
  finalPageNumber = null,
  maxPages = 100,
  outcome = null,
  onAnimationComplete = () => {}
}) => {
  const [displayNumber, setDisplayNumber] = useState(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const flipTimerRef = useRef(null);

  // Detect reduced-motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const listener = (e) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Page flipping numbers simulation & deceleration toward finalPageNumber
  useEffect(() => {
    if (!isFlipping) {
      if (finalPageNumber !== null) {
        setDisplayNumber(finalPageNumber);
      }
      return;
    }

    if (prefersReducedMotion) {
      // Instantly set final page without rapid cycling
      setDisplayNumber(finalPageNumber || 1);
      soundEffects.playResultChime(finalPageNumber % 2 !== 0);
      onAnimationComplete();
      return;
    }

    soundEffects.playBookOpen();

    let currentInterval = 35; // Start fast (35ms per flip)
    let elapsed = 0;
    const totalDuration = 2200; // 2.2 seconds total flip animation

    const runFlipStep = () => {
      elapsed += currentInterval;

      // Random intermediate page number while flipping
      const randomPage = Math.floor(Math.random() * maxPages) + 1;
      setDisplayNumber(randomPage);
      soundEffects.playPageFlip(1);

      // Decelerate toward the end
      if (elapsed > 1400) {
        currentInterval += 40; // Decelerate smoothly
      } else if (elapsed > 800) {
        currentInterval += 15;
      }

      if (elapsed >= totalDuration) {
        // Settle on authoritative final page
        setDisplayNumber(finalPageNumber || 1);
        soundEffects.playMagicShimmer();
        soundEffects.playResultChime((finalPageNumber || 1) % 2 !== 0);
        onAnimationComplete();
      } else {
        flipTimerRef.current = setTimeout(runFlipStep, currentInterval);
      }
    };

    flipTimerRef.current = setTimeout(runFlipStep, currentInterval);

    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, [isFlipping, finalPageNumber, maxPages, prefersReducedMotion]);

  const isOpen = isOpening || isFlipping || finalPageNumber !== null;

  return (
    <div className="relative flex flex-col items-center justify-center p-2 sm:p-4 select-none">
      {/* Outer Magical Glow Effect */}
      <div
        className={`absolute inset-0 rounded-full transition-opacity duration-700 pointer-events-none filter blur-2xl ${
          isFlipping || finalPageNumber
            ? 'opacity-70 bg-gradient-to-r from-[#D59926]/40 via-[#F3C06B]/30 to-[#D59926]/40'
            : 'opacity-20 bg-[#D59926]/20'
        }`}
      />

      {/* 3D Perspective Book Wrapper */}
      <div
        className="relative perspective-[1200px] w-[260px] xs:w-[290px] sm:w-[360px] md:w-[420px] h-[195px] sm:h-[240px] md:h-[270px] flex items-center justify-center max-w-full"
        style={{ perspective: '1200px' }}
      >
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
          animate={
            prefersReducedMotion
              ? {}
              : {
                  y: isOpen ? [0, -6, 0] : [0, -8, 0],
                  rotateX: isOpen ? 6 : 8,
                  rotateY: isOpen ? 0 : -4
                }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* =========================================================================
              BOOK VIEW A: CLOSED COVER (ENTRANCE / PRE-FLIP)
              ========================================================================= */}
          {!isOpen && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0, x: -80, rotateY: 25 }}
              animate={{ scale: 1, opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, type: 'spring', damping: 18 }}
              className="relative w-[210px] sm:w-[260px] h-[220px] sm:h-[260px] rounded-r-2xl rounded-l-md bg-gradient-to-r from-[#1E1F24] via-[#2A2B32] to-[#24252B] shadow-2xl border-2 border-[#D59926]/40 flex flex-col items-center justify-between p-6 cursor-pointer group"
            >
              {/* Spine texture on left */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#141518] to-transparent border-r border-[#D59926]/30 rounded-l-md flex flex-col justify-between py-4 items-center">
                <div className="w-2 h-4 border-t border-b border-[#D59926]/40" />
                <div className="w-2 h-4 border-t border-b border-[#D59926]/40" />
                <div className="w-2 h-4 border-t border-b border-[#D59926]/40" />
              </div>

              {/* Gold embossed corner ornaments */}
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#D59926] rounded-tr" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#D59926] rounded-br" />

              {/* Cover Header */}
              <div className="text-center pt-2">
                <span className="font-mono text-[9px] tracking-widest text-[#D59926] uppercase">
                  SCHOOL NOTEBOOK ARCHIVES
                </span>
              </div>

              {/* Central Seal & Title */}
              <div className="flex flex-col items-center justify-center my-auto text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[#D59926] bg-[#D59926]/10 flex items-center justify-center mb-2 shadow-inner group-hover:scale-105 transition-transform">
                  <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[#D59926]" />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold tracking-wider text-[#F8F4EB]">
                  ODD WAR
                </h3>
                <span className="font-handwriting text-xs text-[#D59926]">
                  Magical Book of Fate
                </span>
              </div>

              {/* Footer Page Count */}
              <div className="text-center pb-1">
                <span className="font-mono text-[10px] text-[#8C929D] px-2 py-0.5 rounded bg-black/40 border border-white/10">
                  {maxPages} Ruled Pages
                </span>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              BOOK VIEW B: OPENED SPREAD (RAPID FLIPPING & FINAL REVEAL)
              ========================================================================= */}
          {isOpen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, rotateX: 15 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full flex rounded-xl shadow-2xl overflow-hidden border-2 border-[#23252A] bg-[#F7F2E6]"
            >
              {/* Central Book Spine Groove / Binding */}
              <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#23252A]/25 to-transparent z-30 pointer-events-none" />

              {/* -------------------------------------------------------------
                  LEFT PAGE: Status & Ruleset Overview
                  ------------------------------------------------------------- */}
              <div className="relative w-1/2 h-full p-4 sm:p-5 flex flex-col justify-between border-r border-[#D5CFC3] bg-[#FAF5EB] overflow-hidden">
                {/* Notebook Horizontal Ruling */}
                <div className="absolute inset-0 pointer-events-none opacity-25 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_21px,rgba(130,155,185,0.3)_22px)]" />

                {/* Left Margin Accent */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#D75050]/30 pointer-events-none" />

                {/* Left Header */}
                <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-[#8C929D] border-b border-[#D5CFC3] pb-1.5 pl-2">
                  <span>ODD WAR RULES</span>
                  <span>{maxPages} PAGES</span>
                </div>

                {/* Left Body: Notebook Rules Reminder */}
                <div className="relative z-10 my-auto pl-2 space-y-2">
                  <div className="font-handwriting text-xs sm:text-sm text-[#4A4F5B] leading-relaxed">
                    <p className="font-bold text-[#23252A]">
                      Odd digits command row stations:
                    </p>
                    <ul className="list-disc list-inside text-[11px] sm:text-xs text-[#5C6069] space-y-0.5">
                      <li>Ending in 1, 3, 5, 7, 9 → Action on that Row</li>
                      <li>Ending in 0, 2, 4, 6, 8 → No Action (Turn passes)</li>
                    </ul>
                  </div>

                  <div className="p-1.5 rounded bg-[#EFE8DA]/60 border border-[#D5CFC3] text-[10px] font-mono text-[#5C6069]">
                    <span>Cryptographic Server Flip</span>
                  </div>
                </div>

                {/* Left Footer */}
                <div className="relative z-10 text-[9px] font-mono text-[#8C929D] pl-2">
                  Odd War Book • Authoritative
                </div>
              </div>

              {/* -------------------------------------------------------------
                  RIGHT PAGE: Flipping Leaves & Final Page Reveal
                  ------------------------------------------------------------- */}
              <div className="relative w-1/2 h-full p-4 sm:p-5 flex flex-col justify-between bg-[#FFFDF9] overflow-hidden">
                {/* Notebook Horizontal Ruling */}
                <div className="absolute inset-0 pointer-events-none opacity-25 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_21px,rgba(130,155,185,0.3)_22px)]" />

                {/* Right Header */}
                <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-[#8C929D] border-b border-[#D5CFC3] pb-1.5">
                  <span>BOOK OF FATE</span>
                  <span className="text-[#D59926] font-bold">
                    {isFlipping ? 'FLIPPING...' : 'REVEALED'}
                  </span>
                </div>

                {/* Center Page Number Result */}
                <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
                  {isFlipping ? (
                    <div className="flex flex-col items-center">
                      <motion.div
                        key={displayNumber}
                        initial={{ opacity: 0.6, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.04 }}
                        className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-[#23252A] tracking-tight filter blur-[0.4px]"
                      >
                        {displayNumber}
                      </motion.div>
                      <span className="font-handwriting text-xs text-[#D59926] animate-pulse mt-1">
                        Flipping through pages...
                      </span>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      className="flex flex-col items-center"
                    >
                      <span className="font-mono text-[10px] text-[#8C929D] uppercase tracking-wider mb-0.5">
                        LANDED ON
                      </span>

                      <div className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl text-[#23252A] tracking-tight drop-shadow-sm">
                        {finalPageNumber || displayNumber}
                      </div>

                      {/* Final Digit Breakdown & Parchment Stamp Reveal */}
                      {finalPageNumber !== null && (
                        <div className="mt-2 flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-[#4A4F5B]">
                              Final Digit:
                            </span>
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-xs text-white ${
                                (finalPageNumber % 10) % 2 !== 0
                                  ? 'bg-[#2E8557]'
                                  : 'bg-[#5C6069]'
                              }`}
                            >
                              {finalPageNumber % 10}
                            </span>
                          </div>

                          {/* Official Notebook Parchment Stamp */}
                          <motion.div
                            initial={{ scale: 2.2, opacity: 0, rotate: -20 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              rotate: (finalPageNumber % 10) % 2 !== 0 ? -4 : 3
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 420,
                              damping: 22,
                              delay: 0.12
                            }}
                            className={`px-2.5 py-1 rounded-md border-2 font-mono text-[10px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1.5 ${
                              (finalPageNumber % 10) % 2 !== 0
                                ? 'border-[#2E8557] bg-[#2E8557]/10 text-[#2E8557]'
                                : 'border-[#5C6069] bg-[#5C6069]/10 text-[#5C6069]'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>
                              {(finalPageNumber % 10) % 2 !== 0
                                ? `ROW ${finalPageNumber % 10} ACTIVATED`
                                : 'EVEN DIGIT • PASS TURN'}
                            </span>
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Right Footer: Page Bottom Indicator */}
                <div className="relative z-10 text-right text-[10px] font-mono text-[#8C929D]">
                  Page {displayNumber} of {maxPages}
                </div>
              </div>

              {/* Animated Flipping Sheets Overlay (Motion Blur Effect) */}
              {isFlipping && !prefersReducedMotion && (
                <motion.div
                  className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-black/5 via-white/40 to-transparent pointer-events-none z-20"
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                    scaleX: [0.95, 1, 0.95]
                  }}
                  transition={{
                    duration: 0.12,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Floating Sparkle & Graphite Dust Particles */}
      <AnimatePresence>
        {(isFlipping || finalPageNumber) && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Golden sparks */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`spark_${i}`}
                initial={{
                  opacity: 0,
                  scale: 0.5,
                  x: 140 + (i % 3) * 40 - 60,
                  y: 100 + Math.sin(i) * 30
                }}
                animate={{
                  opacity: [0, 0.9, 0],
                  scale: [0.5, 1.2, 0.6],
                  y: [100, 40 + i * 15],
                  x: [140 + (i % 3) * 40 - 60, 140 + (i % 3) * 50 - 40]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.28,
                  ease: 'easeOut'
                }}
                className="absolute text-[#D59926]"
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            ))}

            {/* Graphite dust motes */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`dust_${i}`}
                initial={{
                  opacity: 0,
                  x: 150 + (i * 35) - 70,
                  y: 120
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  y: [120, 20 + i * 18],
                  x: [150 + (i * 35) - 70, 150 + (i * 35) - 50 + (i % 2 === 0 ? 15 : -15)]
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: i * 0.35,
                  ease: 'easeOut'
                }}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#242730]/40 pointer-events-none"
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
