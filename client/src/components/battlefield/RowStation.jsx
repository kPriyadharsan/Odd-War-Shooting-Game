import React from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Target,
  Sparkles,
  Shield,
  Circle,
  Skull,
  Pencil,
  Crosshair
} from 'lucide-react';
import { ROW_STATUS, ROW_STATUS_META } from '../../store/battlefieldState.js';
import { RenderedCharacterStrokes } from '../drawing/RenderedCharacterStrokes.jsx';
import { soundEffects } from '../../services/soundEffects.js';

/**
 * RowStation Component (Tasks 09 & 10)
 * Renders an independent playable row station (1, 3, 5, 7, or 9).
 * - Displays the actual player's manual pencil drawing vectors.
 * - Displays construction stage status (HEAD, BODY, GUN, BULLETS, ELIMINATED).
 * - Displays 3 ammunition bullet slots (EMPTY, LOADED, FIRED).
 * - Displays pencil cross-out strike and skull when ELIMINATED.
 * - Displays targeting crosshair when targeted in combat.
 */
export const RowStation = ({
  rowNumber,
  rowData,
  isHomeTerritory,
  isSelected,
  onSelectRow,
  onOpenDrawing,
  isEligibleForAction = false,
  isTargetable = false,
  isTargeted = false,
  onSelectTarget,
  playerId = '',
  playerShadeHex = '#2B68B4',
  className = ''
}) => {
  const status = rowData?.status || ROW_STATUS.EMPTY;
  const currentStage = rowData?.currentStage || 'HEAD';
  const drawings = rowData?.drawings || null;
  const hasDrawings = drawings && (drawings.HEAD || drawings.BODY || drawings.GUN || drawings.BULLET);
  const bulletCount = rowData?.bulletCount || 0;
  const isEliminated = Boolean(rowData?.isEliminated || status === ROW_STATUS.ELIMINATED);

  // Ammunition 3 slots breakdown: EMPTY, LOADED, FIRED
  const bulletSlots = rowData?.bullets || [
    { slot: 1, state: bulletCount >= 1 ? 'LOADED' : 'EMPTY' },
    { slot: 2, state: bulletCount >= 2 ? 'LOADED' : 'EMPTY' },
    { slot: 3, state: bulletCount >= 3 ? 'LOADED' : 'EMPTY' }
  ];

  const statusMeta = ROW_STATUS_META[status] || ROW_STATUS_META[ROW_STATUS.EMPTY];

  const handleClick = () => {
    if (isHomeTerritory && typeof onSelectRow === 'function') {
      soundEffects.playButtonClick();
      onSelectRow(rowNumber);
    } else if (!isHomeTerritory && isTargetable && !isEliminated && typeof onSelectTarget === 'function') {
      soundEffects.playGunLoading();
      onSelectTarget(playerId, rowNumber);
    }
  };

  return (
    <div
      onClick={handleClick}
      role={isHomeTerritory || (isTargetable && !isEliminated) ? 'button' : 'region'}
      tabIndex={isHomeTerritory || (isTargetable && !isEliminated) ? 0 : -1}
      aria-label={`Row ${rowNumber} ${
        isHomeTerritory ? '(Your Territory)' : '(Opponent Territory)'
      } ${isEliminated ? '- Eliminated' : ''}`}
      aria-pressed={isHomeTerritory ? isSelected : isTargeted}
      className={`group relative w-full h-[94px] sm:h-[106px] rounded-lg transition-all duration-200 select-none flex items-center justify-between px-2 sm:px-3 border ${
        isEliminated
          ? 'bg-[#F2EDE4]/60 border-[#D5CFC3] opacity-65 cursor-not-allowed'
          : isTargeted
          ? 'bg-[#FFF3F3] border-[#CE4242] shadow-sketch ring-2 ring-[#CE4242]/40 cursor-pointer z-20 scale-[1.01]'
          : !isHomeTerritory && isTargetable
          ? 'bg-[#FAF6EE] border-[#CE4242]/50 hover:border-[#CE4242] hover:bg-[#FFF5F5] cursor-crosshair ring-1 ring-[#CE4242]/20'
          : isHomeTerritory
          ? isSelected
            ? 'bg-[#FFFDF9] border-[#242730] shadow-sketch ring-2 ring-[#242730]/15 cursor-pointer z-10'
            : isEligibleForAction
            ? 'bg-[#F0F7F3] border-[#2E8557] ring-1 ring-[#2E8557]/40 cursor-pointer animate-pulse'
            : 'bg-[#FCFAF5]/90 border-[#D5CFC3] hover:border-[#242730]/60 hover:bg-[#FFFDF9] cursor-pointer'
          : 'bg-[#FAF6EE]/60 border-[#D5CFC3]/60 cursor-default opacity-90'
      } ${className}`}
    >
      {/* Selection Left Accent Rib (Pencil mark) */}
      {isHomeTerritory && isSelected && !isEliminated && (
        <motion.div
          layoutId="selectedRowBar"
          className="absolute left-0 top-1 bottom-1 w-1.5 rounded-r bg-[#242730]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Target Red Indicator Bar */}
      {isTargeted && (
        <motion.div
          layoutId="targetedRowBar"
          className="absolute left-0 top-1 bottom-1 w-2 rounded-r bg-[#CE4242]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Row Number Identifier (Permanent & Distinct) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-display font-bold text-base sm:text-xl border transition-transform ${
            isEliminated
              ? 'border-[#8C929D] bg-[#8C929D]/15 text-[#8C929D] line-through'
              : isTargeted
              ? 'scale-105 border-[#CE4242] bg-[#CE4242] text-white shadow-sm'
              : isSelected && isHomeTerritory
              ? 'scale-105 border-[#242730] text-white shadow-sm'
              : 'border-[#D5CFC3] text-[#242730]'
          }`}
          style={{
            backgroundColor: isEliminated
              ? undefined
              : isTargeted
              ? '#CE4242'
              : isSelected && isHomeTerritory
              ? playerShadeHex
              : `${playerShadeHex}18`
          }}
        >
          {rowNumber}
        </div>

        <div className="hidden md:flex flex-col">
          <span className="font-mono text-[9px] text-[#8C929D] uppercase tracking-wider">
            Row
          </span>
          <span
            className={`font-display font-bold text-xs leading-none ${
              isEliminated ? 'text-[#8C929D] line-through' : 'text-[#242730]'
            }`}
          >
            Pos {rowNumber}
          </span>
        </div>
      </div>

      {/* Center: Character Drawing Canvas Viewport */}
      <div className="flex-1 mx-1.5 sm:mx-3 h-full flex flex-col justify-center items-center min-w-0">
        <div
          className={`relative w-full max-w-[120px] sm:max-w-[180px] h-13 sm:h-16 rounded border transition-colors flex items-center justify-center overflow-hidden px-1 sm:px-2 ${
            isEliminated
              ? 'border-[#CE4242]/40 bg-[#FAF4F4]'
              : isTargeted
              ? 'border-[#CE4242] bg-[#FFF8F8]'
              : 'border-dashed border-[#D5CFC3] bg-white/40 group-hover:bg-white/70'
          }`}
        >
          {/* Subtle notebook horizontal lines inside drawing box */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_11px,rgba(130,155,185,0.4)_12px)]" />

          {/* Render Actual Freehand Pencil Drawing If Present */}
          {hasDrawings ? (
            <div
              className={`relative w-full h-full p-1 flex items-center justify-center ${
                isEliminated ? 'opacity-35 grayscale contrast-75' : ''
              }`}
            >
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

          {/* Pencil Cross-Out Strike Overlay on Eliminated Station */}
          {isEliminated && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <svg className="w-full h-full" viewBox="0 0 160 60" preserveAspectRatio="none">
                {/* Diagonal pencil scratch 1 */}
                <motion.path
                  d="M 5,8 Q 80,32 155,54"
                  stroke="#CE4242"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="4 1"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.85 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
                {/* Diagonal pencil scratch 2 */}
                <motion.path
                  d="M 155,8 Q 80,28 5,54"
                  stroke="#CE4242"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="4 1"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.85 }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                />
                {/* Middle scribble scratch */}
                <motion.path
                  d="M 20,30 Q 50,22 80,31 T 140,28"
                  stroke="#242730"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: 0.18 }}
                />
              </svg>
              <motion.div
                initial={{ scale: 2.2, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: -8, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.2 }}
                className="absolute px-2 py-0.5 bg-[#CE4242] text-white font-mono text-[9px] font-black tracking-widest rounded shadow-xs border border-white/60"
              >
                ELIMINATED
              </motion.div>
            </div>
          )}

          {/* Crosshair Overlay when targeted */}
          {isTargeted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-[#CE4242]/10 animate-pulse">
              <Crosshair className="w-8 h-8 text-[#CE4242]" />
            </div>
          )}
        </div>
      </div>

      {/* Right: Stage Badge, Ammunition & Interaction feedback */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {isEliminated ? (
          <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono border bg-[#FDF2F2] text-[#CE4242] border-[#CE4242]/40 font-bold">
            DESTROYED
          </span>
        ) : (
          <span
            className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono border ${statusMeta.badgeClass}`}
          >
            {statusMeta.shortLabel}
          </span>
        )}

        {/* Ammunition Slots (3 Bullets: EMPTY, LOADED, FIRED) */}
        {!isEliminated && (
          <div
            className="flex items-center gap-1 p-0.5 bg-black/5 rounded border border-black/5"
            title={`Ammunition: ${bulletCount}/3 Loaded`}
          >
            {bulletSlots.map((b, idx) => (
              <span
                key={b.slot || idx + 1}
                title={`Bullet ${idx + 1}: ${b.state}`}
                className={`w-2 h-2 rounded-full transition-colors flex items-center justify-center text-[7px] ${
                  b.state === 'LOADED'
                    ? 'bg-[#2E8557] ring-1 ring-[#2E8557]/60 shadow-xs'
                    : b.state === 'FIRED'
                    ? 'bg-[#8C929D] opacity-40 line-through'
                    : 'border border-dashed border-[#8C929D] bg-transparent'
                }`}
              />
            ))}
          </div>
        )}

        {/* Home vs Opponent Feedback / Draw Trigger / Combat Targeting */}
        {isEliminated ? (
          <span className="text-[9px] font-mono text-[#CE4242] font-semibold">Row Out</span>
        ) : isHomeTerritory ? (
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
        ) : isTargeted ? (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-[#CE4242]">
            <Target className="w-3 h-3 text-[#CE4242]" /> TARGETED
          </span>
        ) : isTargetable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onSelectTarget === 'function') {
                onSelectTarget(playerId, rowNumber);
              }
            }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#CE4242] hover:bg-[#B03535] text-white font-mono text-[9px] font-bold shadow-xs cursor-pointer"
          >
            <Crosshair className="w-2.5 h-2.5" /> TARGET
          </button>
        ) : (
          <span
            className="inline-flex items-center gap-0.5 text-[9px] font-mono text-[#8C929D]/70"
            title="Opponent station"
          >
            <Lock className="w-2.5 h-2.5" /> Opponent
          </span>
        )}
      </div>
    </div>
  );
};
