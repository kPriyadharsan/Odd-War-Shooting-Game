import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react';
import { Button } from '../ui/index.js';

/**
 * VictoryModal Component (Task 10)
 * Celebrates match victory for the last surviving player in school notebook aesthetic.
 */
export const VictoryModal = ({
  isOpen = false,
  winnerNickname = '',
  winnerId = '',
  isCurrentUserWinner = false,
  totalShotsFired = 0,
  onReturnToLobby = () => {},
  onPlayAgain = () => {}
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md rounded-2xl border-4 border-[#242730] bg-[#FFFDF9] p-6 sm:p-8 shadow-paper-lg text-center overflow-hidden"
        >
          {/* Notebook ruled background texture */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_19px,rgba(130,155,185,0.4)_20px)]" />

          {/* Notebook red margin line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#D75050]/40 pointer-events-none" />

          {/* Laurel Trophy Graphic */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ rotate: -15, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="w-20 h-20 rounded-2xl bg-[#D59926]/15 border-2 border-[#D59926] flex items-center justify-center mb-4 shadow-sketch"
            >
              <Trophy className="w-10 h-10 text-[#D59926]" />
            </motion.div>

            <span className="font-mono text-xs uppercase tracking-widest text-[#8C929D]">
              MATCH COMPLETE • ODD WARS CHAMPION
            </span>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#242730] mt-1 flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-[#D59926] fill-[#D59926]" />
              <span>{winnerNickname || 'Warrior'}</span>
            </h2>

            <p className="font-handwriting text-base text-[#4A4F5B] mt-1 mb-6">
              {isCurrentUserWinner
                ? 'Glorious Victory! You eliminated all opponent stations and ruled the notebook page!'
                : `${winnerNickname} stood firm and eliminated all rival warrior positions!`}
            </p>

            {/* Quick Match Statistics Card */}
            <div className="w-full p-3 rounded-xl border border-[#D5CFC3] bg-[#FCFAF5] mb-6 flex items-center justify-around font-mono text-xs">
              <div>
                <span className="text-[#8C929D] block text-[10px] uppercase">Status</span>
                <strong className="text-[#2E8557] font-bold">VICTORY</strong>
              </div>
              <div className="w-px h-6 bg-[#D5CFC3]" />
              <div>
                <span className="text-[#8C929D] block text-[10px] uppercase">Combat Rounds</span>
                <strong className="text-[#242730] font-bold">{totalShotsFired} Shots</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onPlayAgain}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#242730] hover:bg-black text-[#F8F4EB] font-mono font-bold text-xs shadow-sketch transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Waiting Room</span>
              </button>

              <button
                type="button"
                onClick={onReturnToLobby}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#242730] bg-[#FFFDF9] hover:bg-[#F4EFE6] text-[#242730] font-mono font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Room Browser</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
