import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Check, X, ArrowRight } from 'lucide-react';
import { MagicalBook } from './MagicalBook.jsx';
import { soundEffects } from '../../services/soundEffects.js';

/**
 * MagicalBookOverlay Component (Part 5 Redesign)
 *
 * Renders the 3D Magical Book of Fate as a cinematic overlay DIRECTLY over the notebook sheet.
 * Auto-dismisses after revealing the authoritative result, returning focus to the notebook sheet.
 */
export const MagicalBookOverlay = ({
  isOpen = false,
  isFlipping = false,
  outcome = null,
  bookPageCount = 100,
  activePlayerNickname = 'Warrior',
  isCurrentPlayer = false,
  onClose = () => {},
  autoCloseDelayMs = 3200
}) => {
  const [hasFinishedAnimation, setHasFinishedAnimation] = useState(false);

  useEffect(() => {
    if (isFlipping) {
      setHasFinishedAnimation(false);
    }
  }, [isFlipping]);

  // When animation finishes or outcome is revealed, auto-dismiss after short delay
  useEffect(() => {
    if (!isOpen || isFlipping || !outcome) return;

    setHasFinishedAnimation(true);
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDelayMs);

    return () => clearTimeout(timer);
  }, [isOpen, isFlipping, outcome, autoCloseDelayMs, onClose]);

  if (!isOpen) return null;

  const isOdd = outcome?.isOdd ?? false;
  const targetRow = outcome?.targetRow ?? null;
  const pageNumber = outcome?.pageNumber ?? null;
  const finalDigit = outcome?.finalDigit ?? (pageNumber ? pageNumber % 10 : null);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl border-2 border-[#242730] bg-[#FAF6EE] shadow-2xl p-4 sm:p-7 overflow-y-auto max-h-[92vh] max-h-[92dvh] flex flex-col items-center text-center notebook-sheet-shadow my-auto"
        >
          {/* Subtle paper background lines inside popup */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_27px,rgba(43,104,180,0.2)_28px)]" />
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#D75050]/20 pointer-events-none" />

          {/* Close / Skip button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-[#4A4F5B] hover:text-[#242730] hover:bg-black/5 transition-colors z-20 cursor-pointer"
            title="Close overlay"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Badge */}
          <div className="relative z-10 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#242730] text-[#F8F4EB] shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-[#D59926]" />
              THE MAGICAL BOOK OF FATE ({bookPageCount} PAGES)
            </span>
            <p className="font-handwriting text-xs sm:text-sm text-[#4A4F5B] mt-1.5">
              {isFlipping
                ? `${activePlayerNickname} is flipping through the ruled pages...`
                : `${activePlayerNickname} opened the book of destiny.`}
            </p>
          </div>

          {/* Center: 3D Magical Book */}
          <div className="relative z-10 my-2 sm:my-4 flex items-center justify-center w-full min-h-[220px]">
            <MagicalBook
              isOpening={isFlipping}
              isFlipping={isFlipping}
              finalPageNumber={pageNumber}
              maxPages={bookPageCount}
              outcome={outcome}
              onAnimationComplete={() => setHasFinishedAnimation(true)}
            />
          </div>

          {/* Outcome Announcement */}
          <div className="relative z-10 w-full mt-3">
            {isFlipping ? (
              <div className="flex items-center justify-center gap-2 py-2 text-xs font-mono text-[#D59926] font-bold animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>FLIPPING PAGES... REVEALING FATE</span>
              </div>
            ) : outcome ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl border-2 ${
                  isOdd
                    ? 'bg-[#F0F7F3] border-[#2E8557] text-[#1C5236]'
                    : 'bg-[#FCF8EE] border-[#D59926] text-[#96630D]'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold">
                    REVEALED: PAGE {pageNumber} (ENDS IN {finalDigit})
                  </span>
                </div>

                {isOdd ? (
                  <div>
                    <h3 className="font-display text-lg sm:text-xl font-bold flex items-center justify-center gap-1.5 text-[#1C5236]">
                      <Sparkles className="w-5 h-5 text-[#D59926]" />
                      ROW {targetRow} ACTIVATED!
                    </h3>
                    <p className="font-mono text-xs text-[#2E8557] mt-0.5">
                      {isCurrentPlayer
                        ? `Tap Row ${targetRow} on your notebook column to draw your warrior!`
                        : `Warrior ${activePlayerNickname} unlocked Row ${targetRow}.`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#96630D]">
                      EVEN DIGIT — NO ACTION
                    </h3>
                    <p className="font-mono text-xs text-[#96630D]/80 mt-0.5">
                      Even page drawn. Turn passes to the next warrior.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#242730] text-[#F8F4EB] font-mono text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-xs"
                >
                  <span>Continue to Notebook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
