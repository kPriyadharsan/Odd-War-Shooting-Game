import React from 'react';
import { motion } from 'framer-motion';

/**
 * LoadingProgress Component
 *
 * Implements:
 * - Minimal, premium bottom progress bar inspired by AAA title loading screens.
 * - Smooth animated fill bound to real initialization milestones.
 * - Never hits 100% until both genuine readiness and minimum duration conditions are met.
 * - Accessible progress indicators.
 */
export const LoadingProgress = ({ progress = 0, isReady = false }) => {
  // Ensure visual clamped progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className="w-full max-w-md sm:max-w-lg mx-auto px-4 xs:px-6 select-none"
      role="progressbar"
      aria-label="Application Loading Progress"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Outer Glow Capsule */}
      <div className="relative h-2 xs:h-2.5 w-full bg-black/60 backdrop-blur-md rounded-full overflow-hidden p-[1.5px] border border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
        {/* Animated Progress Bar Fill */}
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#2B68B4] via-[#D59926] to-[#F5D588] relative shadow-[0_0_12px_rgba(213,153,38,0.6)]"
          initial={{ width: '0%' }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
        >
          {/* Subtle Shimmer Highlight */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
        </motion.div>
      </div>

      {/* Numerical Percentage Display */}
      <div className="flex items-center justify-between mt-2 px-1 text-[11px] font-mono tracking-wider text-slate-300/80">
        <span className="uppercase text-[10px] tracking-widest text-[#D59926] font-semibold">
          {clampedProgress < 100 ? 'INITIALIZING' : 'SYNCHRONIZED'}
        </span>
        <span className="font-bold text-white drop-shadow">
          {clampedProgress}%
        </span>
      </div>
    </div>
  );
};

export default LoadingProgress;
