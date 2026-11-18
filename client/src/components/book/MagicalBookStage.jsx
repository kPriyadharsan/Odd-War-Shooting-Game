import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { MagicalBook } from './MagicalBook.jsx';
import { Button } from '../ui/index.js';

/**
 * MagicalBookStage Component (Task 08)
 * Central battlefield interface hosting the 3D magical book,
 * active player turn controls, OPEN THE BOOK button, and authoritative outcome reveal.
 */
export const MagicalBookStage = ({
  room,
  currentPlayerId,
  isFlipping = false,
  lastOutcome = null,
  onOpenBook = () => {},
  isActionLoading = false,
  error = null,
  className = ''
}) => {
  const gameState = room?.gameState || {};
  const activePlayerId = gameState.activePlayerId || room?.players?.[0]?.playerId;
  const turnNumber = gameState.turnNumber || 1;

  const activePlayer = room?.players?.find((p) => p.playerId === activePlayerId) || {
    nickname: 'Warrior',
    assignedShade: { hex: '#2B68B4', name: 'Blue Ink' }
  };

  const isCurrentPlayerTurn = activePlayerId === currentPlayerId;
  const bookPageCount = room?.bookPageCount || 100;

  // Final page to display (from lastOutcome)
  const finalPage = lastOutcome?.pageNumber || null;

  return (
    <div
      className={`relative w-full rounded-2xl border-2 border-[#23252A] bg-gradient-to-b from-[#FCFAF3] to-[#F8F4EB] p-4 sm:p-6 shadow-paper-lg flex flex-col items-center select-none ${className}`}
    >
      {/* Stage Header: Turn Counter & Active Player Indicator */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 mb-2 border-b border-[#D5CFC3]">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-md bg-[#242730] text-[#F8F4EB] font-mono font-bold text-xs tracking-wide shadow-xs">
            TURN {turnNumber}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-[#5C6069]">
            <span>Active Warrior:</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/20"
              style={{ backgroundColor: activePlayer?.assignedShade?.hex || '#2B68B4' }}
            />
            <strong className="text-[#242730] font-display text-sm font-bold">
              {activePlayer?.nickname}
            </strong>
          </div>
        </div>

        {/* Turn Status Badge */}
        <div>
          {isCurrentPlayerTurn ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#2E8557]/15 text-[#2E8557] border border-[#2E8557]/40 shadow-xs animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> YOUR TURN TO FLIP
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-[#5C6069] bg-black/5 border border-black/10">
              <Clock className="w-3.5 h-3.5 text-[#8C929D]" /> Waiting for {activePlayer?.nickname}...
            </span>
          )}
        </div>
      </div>

      {/* Centerpiece: The 3D Magical Book */}
      <div className="my-2 sm:my-4 flex items-center justify-center w-full">
        <MagicalBook
          isOpening={isFlipping}
          isFlipping={isFlipping}
          finalPageNumber={finalPage}
          maxPages={bookPageCount}
          outcome={lastOutcome}
        />
      </div>

      {/* Outcome Reveal Banner (If a page was drawn) */}
      <AnimatePresence>
        {lastOutcome && !isFlipping && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className={`w-full max-w-lg p-3 sm:p-4 rounded-xl border-2 my-2 text-center shadow-sm ${
              lastOutcome.isOdd
                ? 'bg-[#F0F7F3] border-[#2E8557] text-[#1C5236]'
                : 'bg-[#FCF8EE] border-[#D59926]/50 text-[#8F610E]'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="font-display font-extrabold text-base sm:text-lg">
                PAGE {lastOutcome.pageNumber} REVEALED!
              </span>
            </div>

            <p className="font-mono text-xs sm:text-sm">
              {lastOutcome.isOdd ? (
                <span>
                  Final digit is <strong>{lastOutcome.finalDigit} (ODD)</strong> → Commander may act on{' '}
                  <strong className="underline underline-offset-2">ROW {lastOutcome.targetRow}</strong>.
                </span>
              ) : (
                <span>
                  Final digit is <strong>{lastOutcome.finalDigit} (EVEN)</strong> →{' '}
                  <strong className="underline underline-offset-2">NO ACTION</strong>. Turn passes to the next warrior.
                </span>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert Notice */}
      {error && (
        <div className="w-full max-w-md p-2.5 rounded-lg border border-[#CE4242]/30 bg-[#FDF2F2] text-[#CE4242] text-xs font-mono flex items-center gap-2 my-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Footer: OPEN THE BOOK Button */}
      <div className="mt-3 flex flex-col items-center gap-2">
        <Button
          variant="primary"
          size="lg"
          onClick={onOpenBook}
          disabled={!isCurrentPlayerTurn || isFlipping || isActionLoading}
          className={`px-8 py-3 text-sm sm:text-base font-bold font-display shadow-sketch ${
            isCurrentPlayerTurn && !isFlipping
              ? 'bg-[#D59926] hover:bg-[#B88118] text-white border-[#8F610E] ring-2 ring-[#D59926]/30 animate-pulse'
              : 'opacity-50 cursor-not-allowed bg-[#5C6069] text-white border-[#242730]'
          }`}
        >
          {isFlipping ? (
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" /> Flipping Book of Fate...
            </span>
          ) : isCurrentPlayerTurn ? (
            <span className="inline-flex items-center gap-2">
              <BookOpen className="w-5 h-5 fill-white/20" /> OPEN THE BOOK
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Clock className="w-4 h-4" /> Waiting for {activePlayer?.nickname}
            </span>
          )}
        </Button>

        <span className="font-handwriting text-xs text-[#5C6069]">
          {isCurrentPlayerTurn
            ? `Draw an authoritative random page (1–${bookPageCount}) to discover your row!`
            : `Only ${activePlayer?.nickname} can open the book on this turn.`}
        </span>
      </div>
    </div>
  );
};
