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

/**
 * RowStation Component (Task 07)
 * Renders an independent playable row station (1, 3, 5, 7, or 9).
 * - Permanently visible row number identifier.
 * - Character drawing area placeholder.
 * - Character state placeholder (EMPTY, HEAD_DRAWN, BODY_DRAWN, GUN_DRAWN, BULLETS_LOADED, ELIMINATED).
 * - Visual selection indicator for home territory.
 * - Locked / non-selectable feedback for opponents.
 */
export const RowStation = ({
  rowNumber,
  rowData,
  isHomeTerritory,
  isSelected,
  onSelectRow,
  playerShadeHex = '#2B68B4',
  className = ''
}) => {
  const status = rowData?.status || ROW_STATUS.EMPTY;
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

      {/* Center: Character Drawing Area Placeholder */}
      <div className="flex-1 mx-2 sm:mx-3 h-full flex flex-col justify-center items-center">
        <div className="relative w-full max-w-[140px] sm:max-w-[180px] h-14 sm:h-16 rounded border border-dashed border-[#D5CFC3] bg-white/40 group-hover:bg-white/70 transition-colors flex items-center justify-center overflow-hidden px-2">
          {/* Subtle notebook horizontal lines inside drawing box */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_11px,rgba(130,155,185,0.4)_12px)]" />

          {/* Character State Visual Representation */}
          {status === ROW_STATUS.EMPTY ? (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="font-handwriting text-[11px] sm:text-xs text-[#8C929D] tracking-wide">
                [ Character Canvas ]
              </span>
              <span className="text-[9px] font-mono text-[#8C929D]/70 hidden sm:inline">
                Empty Position
              </span>
            </div>
          ) : isEliminated ? (
            <div className="flex items-center gap-1.5 text-[#CE4242]">
              <Skull className="w-4 h-4" />
              <span className="font-handwriting font-bold text-xs">ELIMINATED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-black/20"
                style={{ backgroundColor: playerShadeHex }}
              />
              <span className="font-mono text-xs font-semibold text-[#242730]">
                {statusMeta.shortLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: State Placeholder Badge & Interaction feedback */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono border ${statusMeta.badgeClass}`}
        >
          {statusMeta.shortLabel}
        </span>

        {/* Home vs Opponent Feedback */}
        {isHomeTerritory ? (
          isSelected ? (
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-[#2E8557]">
              <Pencil className="w-2.5 h-2.5" /> SELECTED
            </span>
          ) : (
            <span className="text-[9px] font-mono text-[#8C929D] group-hover:text-[#242730] transition-colors hidden sm:inline">
              Click to select
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
