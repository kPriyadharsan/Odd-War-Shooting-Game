import React from 'react';
import { Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * LoadingBranding Component
 *
 * Implements:
 * - Clean ODD WAR brand mark.
 * - Integrates seamlessly with the cover artwork presentation.
 * - Mobile safe-area inset aware.
 */
export const LoadingBranding = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="absolute top-0 left-0 right-0 z-30 pt-safe-top p-6 sm:p-8 flex items-center justify-between pointer-events-none select-none"
    >
      <div className="flex items-center gap-3">
        {/* Iconic ODD WAR Pencil Seal */}
        <div className="w-9 h-9 xs:w-10 xs:h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
          <Pencil className="w-4 h-4 xs:w-5 xs:h-5 text-[#D59926]" />
        </div>

        {/* Clean ODD WAR Title Treatment */}
        <div className="flex flex-col">
          <span className="font-handwriting font-bold text-2xl xs:text-3xl text-white tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            ODD WAR
          </span>
          <span className="text-[9px] xs:text-[10px] font-mono tracking-[0.25em] text-[#E5C378]/90 uppercase font-semibold -mt-1 drop-shadow">
            Multiplayer Arena
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingBranding;
