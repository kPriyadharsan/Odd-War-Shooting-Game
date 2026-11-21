import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LOADING_ASSETS } from '../../config/loadingAssets.js';

/**
 * LoadingArtwork Component
 *
 * Implements:
 * - Centralized artwork reference (`LOADING_ASSETS.coverArtworkPath`).
 * - Slow cinematic zoom animation (scale 1.0 -> 1.08).
 * - Accelerated zoom + fade on transition exit.
 * - Reduced-motion accessibility support.
 * - Graceful high-fidelity GTA V-inspired aesthetic fallback before the user adds their own JPG.
 * - Mobile-first vertical presentation and balanced widescreen desktop presentation.
 */
export const LoadingArtwork = ({ isTransitioning = false, duration = 5 }) => {
  const shouldReduceMotion = useReducedMotion();
  const [imageExists, setImageExists] = useState(false);
  const [hasCheckedImage, setHasCheckedImage] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const testImg = new Image();
    testImg.src = LOADING_ASSETS.coverArtworkPath;

    testImg.onload = () => {
      if (isMounted) {
        setImageExists(true);
        setHasCheckedImage(true);
      }
    };

    testImg.onerror = () => {
      if (isMounted) {
        setImageExists(false);
        setHasCheckedImage(true);
      }
    };

    return () => {
      isMounted = false;
    };
  }, []);

  // Motion variants for the artwork zoom
  const artworkVariants = {
    initial: {
      scale: 1.0,
      opacity: 0.95
    },
    zooming: {
      scale: shouldReduceMotion ? 1.0 : 1.08,
      opacity: 1,
      transition: {
        duration: Math.max(duration, 5),
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    transitionOut: {
      scale: shouldReduceMotion ? 1.0 : 1.15,
      opacity: 0,
      transition: {
        duration: 0.85,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0A0B0E] select-none pointer-events-none">
      {/* Ambient Desktop Backdrop (Dark atmospheric vignette) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090A0D]/90 via-[#12141C]/80 to-[#070709] z-0" />

      {/* Main Artwork Container: Mobile full-screen, Desktop centered vertical poster */}
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          className="relative w-full h-full sm:max-w-[480px] md:max-w-[540px] lg:max-w-[600px] sm:my-auto sm:h-[92vh] sm:rounded-2xl sm:overflow-hidden sm:shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:border sm:border-white/10"
          variants={artworkVariants}
          initial="initial"
          animate={isTransitioning ? 'transitionOut' : 'zooming'}
        >
          {imageExists ? (
            /* User's custom vertical cover artwork */
            <img
              src={LOADING_ASSETS.coverArtworkPath}
              alt="ODD WAR Cover Artwork"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            /* Graceful GTA V-inspired high-contrast placeholder artwork */
            <FallbackCinematicArtwork />
          )}

          {/* Cinematic Overlays: Top Vignette and Bottom Gradient for UI contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/60 pointer-events-none" />

          {/* Subtle Film Grain & Comic Ink Vignette Edge */}
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.85)] pointer-events-none" />
        </motion.div>
      </div>

      {/* Outer Widescreen Atmospheric Glow for Desktop */}
      <div className="hidden sm:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,6,8,0.95)_90%)] pointer-events-none z-10" />
    </div>
  );
};

/**
 * High-fidelity fallback SVG/Canvas artwork inspired by GTA V cover-art aesthetics:
 * Bold comic-ink outlines, angled cinematic vignettes, twilight gold and noir shadows.
 */
const FallbackCinematicArtwork = () => {
  return (
    <div className="w-full h-full bg-[#12151E] relative flex flex-col justify-between overflow-hidden">
      {/* Background Graphic Gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#14120E] via-[#1E2333] to-[#2B1B17] opacity-95" />

      {/* Angled GTA-style Comic Split Panels */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <line x1="0" y1="35" x2="100" y2="28" stroke="#D59926" strokeWidth="0.75" />
          <line x1="0" y1="68" x2="100" y2="74" stroke="#2B68B4" strokeWidth="0.75" />
          <line x1="48" y1="0" x2="52" y2="100" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="1,2" />
        </svg>
      </div>

      {/* Stylized Cover Art Silhouettes & Battlefield Motif */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
        {/* Cinematic Emblem */}
        <div className="relative mb-6">
          <div className="w-24 h-24 xs:w-28 xs:h-28 rounded-2xl bg-gradient-to-br from-[#2B68B4] via-[#1A2E4C] to-[#121722] p-[2px] shadow-2xl border border-white/20">
            <div className="w-full h-full rounded-[14px] bg-[#0F131C] flex flex-col items-center justify-center relative overflow-hidden">
              {/* Crossed Pencils / Weapons Graphic */}
              <svg className="w-14 h-14 text-[#E5C378] drop-shadow-[0_4px_12px_rgba(213,153,38,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          {/* Subtle backlight ring */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#D59926]/30 to-[#2B68B4]/30 rounded-3xl blur-xl -z-10" />
        </div>

        {/* Cinematic Cover Typography Backdrop */}
        <div className="space-y-1 max-w-xs">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[#D59926] uppercase font-semibold">
            OFFICIAL COVER ARTWORK
          </p>
          <h2 className="font-sans font-black text-2xl xs:text-3xl text-white tracking-wider uppercase drop-shadow-md">
            NOTEBOOK WARFARE
          </h2>
          <p className="font-mono text-xs text-slate-400/80 leading-relaxed pt-2">
            Add your cover art to <br />
            <span className="text-white/90 font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/10">
              client/src/assets/loading/odd-war-cover.jpg
            </span>
          </p>
        </div>
      </div>

      {/* Decorative GTA-style corner borders */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/30" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/30" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/30" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/30" />
    </div>
  );
};

export default LoadingArtwork;
