import React from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Target,
  Sparkles,
  Shield,
  Circle,
  Skull,
  Pencil
} from 'lucide-react';
import { ROW_STATUS, ROW_STATUS_META } from '../../store/battlefieldState.js';
import { RenderedCharacterStrokes } from '../drawing/RenderedCharacterStrokes.jsx';

/**
 * RowStation Component (Task 09)
 * Renders an independent playable row station (1, 3, 5, 7, or 9).
 * - Displays the actual player's manual pencil drawing vectors.
 * - Displays construction stage status (HEAD, BODY, GUN, BULLETS, ELIMINATED).
 * - Displays ammunition bullet counters.
 * - Restricts drawing and selection strictly to home territory.
 */
export const RowStation = ({
  rowNumber,
  rowData,
  isHomeTerritory,
  isSelected,
  onSelectRow,
  onOpenDrawing,
  isEligibleForAction = false,
  playerShadeHex = '#2B68B4',
  className = ''
}) => {
  const status = rowData?.status || ROW_STATUS.EMPTY;
  const currentStage = rowData?.currentStage || 'HEAD';
  const drawings = rowData?.drawings || null;
  const hasDrawings = drawings && (drawings.HEAD || drawings.BODY || drawings.GUN || drawings.BULLET);
  const bulletCount = rowData?.bulletCount || 0;

  const statusMeta = ROW_STATUS_META[status] || ROW_STATUS_META[ROW_STATUS.EMPTY];
  const isEliminated = rowData?.isEliminated || status === ROW_STATUS.ELIMINATED;

  const handleClick = () => {
    if (isHomeTerritory && typeof onSelectRow === 'function') {
      onSelectRow(rowNumber);
    }
  };

  return (
    <div
      onClick={handleClick}
      role={isHomeTerritory ? 'button' : 'region'}
      tabIndex={isHomeTerritory ? 0 : -1}
      aria-label={`Row ${rowNumber} ${isHomeTerritory ? '(Your Territory)' : '(Opponent Territory)'}`}
      aria-pressed={isHomeTerritory ? isSelected : undefined}
      className={`group relative w-full h-[98px] sm:h-[108px] rounded-lg transition-all duration-200 select-none flex items-center justify-between px-2.5 sm:px-3 border ${
        isHomeTerritory
          ? isSelected
            ? 'bg-[#FFFDF9] border-[#242730] shadow-sketch ring-2 ring-[#242730]/15 cursor-pointer z-10'
            : isEligibleForAction
            ? 'bg-[#F0F7F3] border-[#2E8557] ring-1 ring-[#2E8557]/40 cursor-pointer animate-pulse'
            : 'bg-[#FCFAF5]/90 border-[#D5CFC3] hover:border-[#242730]/60 hover:bg-[#FFFDF9] cursor-pointer'
          : 'bg-[#FAF6EE]/60 border-[#D5CFC3]/60 cursor-default opacity-90'
      } ${isEliminated ? 'opacity-40 grayscale' : ''} ${className}`}
    >
      {/* Selection Left Accent Rib (Pencil mark) */}
      {isHomeTerritory && isSelected && (
        <motion.div
          layoutId="selectedRowBar"
          className="absolute left-0 top-1 bottom-1 w-1.5 rounded-r bg-[#242730]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Row Number Identifier (Permanent & Distinct) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-display font-bold text-lg sm:text-xl border transition-transform ${
            isSelected && isHomeTerritory
              ? 'scale-105 border-[#242730] text-white shadow-sm'
              : 'border-[#D5CFC3] text-[#242730]'
          }`}
          style={{
            backgroundColor: isSelected && isHomeTerritory ? playerShadeHex : `${playerShadeHex}18`
          }}
        >
          {rowNumber}
        </div>

        <div className="hidden sm:flex flex-col">
          <span className="font-mono text-[10px] text-[#8C929D] uppercase tracking-wider">
            Row
          </span>
          <span className="font-display font-bold text-xs text-[#242730] leading-none">
            Pos {rowNumber}
          </span>
        </div>
      </div>

      {/* Center: Character Drawing Canvas Viewport */}
      <div className="flex-1 mx-2 sm:mx-3 h-full flex flex-col justify-center items-center">
        <div className="relative w-full max-w-[140px] sm:max-w-[180px] h-14 sm:h-16 rounded border border-dashed border-[#D5CFC3] bg-white/40 group-hover:bg-white/70 transition-colors flex items-center justify-center overflow-hidden px-2">
          {/* Subtle notebook horizontal lines inside drawing box */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_11px,rgba(130,155,185,0.4)_12px)]" />

          {/* Render Actual Freehand Pencil Drawing If Present */}
          {hasDrawings ? (
            <div className="relative w-full h-full p-1 flex items-center justify-center">
              <RenderedCharacterStrokes
                drawings={drawings}
                width="100%"
                height="100%"
                viewBox="0 0 400 300"
              />
            </div>
          ) : isEliminated ? (
            <div className="flex items-center gap-1.5 text-[#CE4242]">
              <Skull className="w-4 h-4" />
              <span className="font-handwriting font-bold text-xs">ELIMINATED</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-handwriting text-[11px] sm:text-xs text-[#8C929D] tracking-wide">
                [ Empty Station ]
              </span>
              <span className="text-[9px] font-mono text-[#8C929D]/70 hidden sm:inline">
                Needs {currentStage}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Stage Badge, Ammunition & Interaction feedback */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono border ${statusMeta.badgeClass}`}
        >
          {statusMeta.shortLabel}
        </span>

        {/* Ammunition Slots (3 Bullets max) */}
        {bulletCount > 0 && (
          <div className="flex items-center gap-0.5" title={`${bulletCount}/3 Bullets loaded`}>
            {[1, 2, 3].map((slot) => (
              <span
                key={slot}
                className={`w-1.5 h-1.5 rounded-full ${
                  slot <= bulletCount ? 'bg-[#2E8557]' : 'bg-[#D5CFC3]'
                }`}
              />
            ))}
          </div>
        )}

        {/* Home vs Opponent Feedback / Draw Trigger */}
        {isHomeTerritory ? (
          isEligibleForAction ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onOpenDrawing === 'function') {
                  onOpenDrawing(rowNumber, currentStage);
                }
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#2E8557] hover:bg-[#1C5236] text-white font-mono text-[9px] font-bold shadow-xs cursor-pointer"
            >
              <Pencil className="w-2.5 h-2.5" /> DRAW {currentStage}
            </button>
          ) : isSelected ? (
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-[#2E8557]">
              <Pencil className="w-2.5 h-2.5" /> SELECTED
            </span>
          ) : (
            <span className="text-[9px] font-mono text-[#8C929D] group-hover:text-[#242730] transition-colors hidden sm:inline">
              Click to inspect
            </span>
          )
        ) : (
          <span
            className="inline-flex items-center gap-0.5 text-[9px] font-mono text-[#8C929D]/70"
            title="Opponent row cannot be selected"
          >
            <Lock className="w-2.5 h-2.5" /> Opponent
          </span>
        )}
      </div>
    </div>
  );
};
