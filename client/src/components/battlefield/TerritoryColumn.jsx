import React from 'react';
import { Crown, Shield, User, Lock, Sparkles, Skull } from 'lucide-react';
import { RowStation } from './RowStation.jsx';
import { TERRITORY_ROWS } from '../../store/battlefieldState.js';

/**
 * Mini 2D Pencil Character Avatar (Graphite-ink sketched)
 */
const MiniPencilAvatar = ({ hexColor = '#2B68B4', isHome = false, isEliminated = false }) => (
  <div
    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-black/25 flex items-center justify-center shrink-0 shadow-2xs"
    style={{ backgroundColor: isEliminated ? '#8C929D20' : `${hexColor}25` }}
    title={isHome ? 'Your Warrior' : 'Opponent Warrior'}
  >
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={isEliminated ? '#8C929D' : hexColor} strokeWidth="2">
      <circle cx="12" cy="7" r="4" stroke={isEliminated ? '#8C929D' : hexColor} fill="white" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  </div>
);

/**
 * TerritoryColumn Component (Part 3 Redesign)
 *
 * Renders an authoritative player column inside the continuous notebook sheet.
 * Not a detached web card, but an integrated vertical column bounded by pencil lines.
 *
 * Contains:
 * - Player nickname & character color identity
 * - Player status badge (YOU / OPPONENT / ELIMINATED)
 * - Exactly five playable rows: 1, 3, 5, 7, 9
 * - Drawings rendered directly onto notebook paper ruling
 */
export const TerritoryColumn = ({
  player,
  isHomeTerritory = false,
  selectedRowNumber = null,
  onSelectRow = () => {},
  onOpenDrawing = () => {},
  eligibleRowNumber = null,
  isTargetableOpponent = false,
  selectedTarget = null,
  onSelectTarget = () => {},
  territoryIndex = 0,
  totalOpponents = 1,
  className = ''
}) => {
  const shadeHex = player?.assignedShade?.hex || '#2B68B4';
  const shadeName = player?.assignedShade?.name || player?.primaryColor || 'Blue Ink';
  const nickname = player?.nickname || `Warrior ${territoryIndex + 1}`;
  const isHost = Boolean(player?.isHost);
  const isPlayerEliminated = Boolean(player?.isEliminated);

  // Map 5 rows data from territory.rowStates or rows fallback
  const rowStates = player?.territory?.rowStates || player?.rows || [];
  const playerRows = TERRITORY_ROWS.map((r) => {
    const found = rowStates.find((row) => row.rowNumber === r);
    return found || { rowNumber: r, status: 'EMPTY', currentStage: 'HEAD', drawings: {} };
  });

  const activeRowsCount = playerRows.filter((r) => !r.isEliminated).length;

  return (
    <div
      className={`relative flex flex-col h-full select-none ${
        isPlayerEliminated ? 'opacity-70 grayscale-25' : ''
      } ${
        isHomeTerritory
          ? 'pencil-column-divider pr-2 sm:pr-3'
          : 'pencil-column-divider-subtle pr-1 sm:pr-2'
      } ${className}`}
    >
      {/* Column Header: Written like a handwritten column heading in student notebook */}
      <div
        className="pb-2.5 mb-2 border-b-2 flex flex-col gap-1.5 shrink-0"
        style={{
          borderColor: isPlayerEliminated
            ? '#8C929D'
            : isHomeTerritory
            ? '#242730'
            : 'rgba(36, 39, 48, 0.35)'
        }}
      >
        <div className="flex items-center justify-between gap-1.5">
          {/* Warrior Avatar & Nickname */}
          <div className="flex items-center gap-1.5 min-w-0">
            <MiniPencilAvatar
              hexColor={shadeHex}
              isHome={isHomeTerritory}
              isEliminated={isPlayerEliminated}
            />

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                {isHost && (
                  <span title="Room Host">
                    <Crown className="w-3.5 h-3.5 text-[#D59926] fill-[#D59926] shrink-0" />
                  </span>
                )}
                <h3
                  className={`font-display text-sm sm:text-base font-black truncate tracking-tight ${
                    isPlayerEliminated
                      ? 'text-[#8C929D] line-through'
                      : 'text-[#23252A]'
                  }`}
                  title={nickname}
                >
                  {nickname}
                </h3>
              </div>
            </div>
          </div>

          {/* Territory Status Tag */}
          <div className="shrink-0">
            {isPlayerEliminated ? (
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#CE4242] text-white shadow-xs">
                <Skull className="w-2.5 h-2.5" /> ELIMINATED
              </span>
            ) : isHomeTerritory ? (
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#242730] text-[#FAF6EE] shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 text-[#D59926]" /> YOU (HOME)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/5 text-[#5C6069] border border-black/10">
                <Shield className="w-2.5 h-2.5 text-[#8C929D]" /> OPPONENT
              </span>
            )}
          </div>
        </div>

        {/* Column Sub-details: Shade color and active stations */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#5C6069] px-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full border border-black/30 shrink-0"
              style={{ backgroundColor: shadeHex }}
            />
            <span className="truncate max-w-[90px]">{shadeName}</span>
          </div>
          <span className="text-[10px] text-[#4A4F5B] font-semibold">
            {activeRowsCount}/5 Stations
          </span>
        </div>
      </div>

      {/* Five Playable Numbered Rows: 1, 3, 5, 7, 9 */}
      <div className="flex-1 flex flex-col justify-between gap-1.5 sm:gap-2">
        {playerRows.map((row) => (
          <RowStation
            key={row.rowNumber}
            rowNumber={row.rowNumber}
            rowData={row}
            isHomeTerritory={isHomeTerritory}
            isSelected={isHomeTerritory && selectedRowNumber === row.rowNumber}
            onSelectRow={onSelectRow}
            onOpenDrawing={onOpenDrawing}
            isEligibleForAction={isHomeTerritory && eligibleRowNumber === row.rowNumber}
            isTargetable={!isHomeTerritory && isTargetableOpponent && !row.isEliminated}
            isTargeted={
              !isHomeTerritory &&
              selectedTarget?.playerId === player.playerId &&
              selectedTarget?.rowNumber === row.rowNumber
            }
            onSelectTarget={onSelectTarget}
            playerId={player.playerId}
            playerShadeHex={shadeHex}
          />
        ))}
      </div>
    </div>
  );
};
