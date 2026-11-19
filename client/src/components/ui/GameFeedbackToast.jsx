import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  BookOpen,
  Crosshair,
  Skull,
  Trophy,
  AlertTriangle,
  Pencil,
  X,
  ShieldAlert
} from 'lucide-react';

const TOAST_VARIANTS = {
  YOUR_TURN: {
    badge: 'YOUR TURN',
    icon: Sparkles,
    bg: 'bg-[#F0F7F3]',
    border: 'border-[#2E8557]',
    badgeBg: 'bg-[#2E8557]',
    textColor: 'text-[#1C5236]',
    tapeColor: 'bg-[#D59926]/40'
  },
  OPPONENT_TURN: {
    badge: "OPPONENT'S TURN",
    icon: Clock,
    bg: 'bg-[#F8F5EE]',
    border: 'border-[#4A4F5B]',
    badgeBg: 'bg-[#4A4F5B]',
    textColor: 'text-[#242730]',
    tapeColor: 'bg-[#8C929D]/30'
  },
  BOOK_OPENED: {
    badge: 'BOOK OPENED',
    icon: BookOpen,
    bg: 'bg-[#FFFBF0]',
    border: 'border-[#D59926]',
    badgeBg: 'bg-[#D59926]',
    textColor: 'text-[#8F610E]',
    tapeColor: 'bg-[#D59926]/40'
  },
  ROW_UNLOCKED: {
    badge: 'ROW ACTIVATED',
    icon: Sparkles,
    bg: 'bg-[#F0F7F3]',
    border: 'border-[#2E8557]',
    badgeBg: 'bg-[#2E8557]',
    textColor: 'text-[#1C5236]',
    tapeColor: 'bg-[#2E8557]/30'
  },
  NO_ACTION: {
    badge: 'NO ACTION',
    icon: AlertTriangle,
    bg: 'bg-[#FAF6EE]',
    border: 'border-[#8C929D]',
    badgeBg: 'bg-[#5C6069]',
    textColor: 'text-[#4A4F5B]',
    tapeColor: 'bg-[#8C929D]/30'
  },
  DRAWING_COMPLETED: {
    badge: 'DRAWING COMPLETED',
    icon: Pencil,
    bg: 'bg-[#F0F7F3]',
    border: 'border-[#2E8557]',
    badgeBg: 'bg-[#2E8557]',
    textColor: 'text-[#1C5236]',
    tapeColor: 'bg-[#2E8557]/30'
  },
  SHOT_FIRED: {
    badge: 'SHOT FIRED',
    icon: Crosshair,
    bg: 'bg-[#FFF5F5]',
    border: 'border-[#CE4242]',
    badgeBg: 'bg-[#CE4242]',
    textColor: 'text-[#962626]',
    tapeColor: 'bg-[#CE4242]/30'
  },
  ROW_ELIMINATED: {
    badge: 'ROW ELIMINATED',
    icon: Skull,
    bg: 'bg-[#FDF2F2]',
    border: 'border-[#CE4242]',
    badgeBg: 'bg-[#CE4242]',
    textColor: 'text-[#962626]',
    tapeColor: 'bg-[#CE4242]/40'
  },
  PLAYER_ELIMINATED: {
    badge: 'WARRIOR ELIMINATED',
    icon: ShieldAlert,
    bg: 'bg-[#242730]',
    border: 'border-[#CE4242]',
    badgeBg: 'bg-[#CE4242]',
    textColor: 'text-[#F8F4EB]',
    tapeColor: 'bg-[#CE4242]/60'
  },
  VICTORY: {
    badge: 'YOU WON',
    icon: Trophy,
    bg: 'bg-[#FFFDF5]',
    border: 'border-[#D59926]',
    badgeBg: 'bg-[#D59926]',
    textColor: 'text-[#242730]',
    tapeColor: 'bg-[#D59926]/50'
  },
  DEFEAT: {
    badge: 'YOU LOST',
    icon: Skull,
    bg: 'bg-[#FAF4F4]',
    border: 'border-[#8C929D]',
    badgeBg: 'bg-[#8C929D]',
    textColor: 'text-[#4A4F5B]',
    tapeColor: 'bg-[#8C929D]/30'
  },
  INFO: {
    badge: 'NOTEBOOK NOTE',
    icon: Sparkles,
    bg: 'bg-[#FCFAF5]',
    border: 'border-[#2B68B4]',
    badgeBg: 'bg-[#2B68B4]',
    textColor: 'text-[#242730]',
    tapeColor: 'bg-[#2B68B4]/30'
  }
};

/**
 * GameFeedbackToast Component (Task 12)
 *
 * Renders a tactile, non-blocking notebook sticky slip notification.
 * Appears floating at the top of the battlefield with realistic tape, paper ruling,
 * graphite lettering, and smooth spring physics.
 */
export const GameFeedbackToast = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || 4200;
    const timer = setTimeout(() => {
      if (typeof onDismiss === 'function') onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const style = TOAST_VARIANTS[toast.type] || TOAST_VARIANTS.INFO;
  const IconComponent = style.icon;

  return (
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 max-w-sm w-[calc(100vw-24px)] sm:w-80 pointer-events-auto select-none">
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.92, rotate: -2 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0.5 }}
        exit={{ opacity: 0, y: -20, scale: 0.9, rotate: -2 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className={`relative p-3.5 rounded-lg border-2 shadow-paper-lg ${style.bg} ${style.border} overflow-hidden`}
      >
        {/* Transparent Masking Tape Accent at top center */}
        <div
          className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-14 h-4 ${style.tapeColor} backdrop-blur-xs rounded-xs shadow-xs rotate-[-2deg] border border-white/40 pointer-events-none`}
        />

        {/* Notebook faint horizontal rulings */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_17px,rgba(130,155,185,0.4)_18px)]" />

        {/* Toast Content */}
        <div className="relative z-10 flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <div
              className={`w-7 h-7 rounded-md ${style.badgeBg} text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5`}
            >
              <IconComponent className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${style.badgeBg} text-white`}
                >
                  {toast.badge || style.badge}
                </span>
              </div>

              {toast.title && (
                <h4 className="font-display font-bold text-xs text-[#242730] leading-tight">
                  {toast.title}
                </h4>
              )}

              <p className={`font-mono text-xs leading-snug mt-0.5 ${style.textColor}`}>
                {toast.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded text-[#8C929D] hover:text-[#242730] hover:bg-black/5 transition-colors shrink-0"
            title="Dismiss Note"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
