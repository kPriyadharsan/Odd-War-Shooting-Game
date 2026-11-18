import React from 'react';
import { Crown, Shield, User, Lock, Sparkles } from 'lucide-react';
import { RowStation } from './RowStation.jsx';
import { TERRITORY_ROWS } from '../../store/battlefieldState.js';

/**
 * Mini 2D Pencil Character Avatar
 */
const MiniPencilAvatar = ({ hexColor = '#2B68B4', isHome = false }) => (
  <div
    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-black/20 flex items-center justify-center shrink-0 shadow-xs"
    style={{ backgroundColor: `${hexColor}20` }}
    title={isHome ? 'Your Warrior' : 'Opponent Warrior'}
  >
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={hexColor} strokeWidth="2">
      {/* Pencil warrior head and torso */}
      <circle cx="12" cy="7" r="4" stroke={hexColor} fill="white" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  </div>
);

/**
 * TerritoryColumn Component (Task 07)
 * Renders an independent vertical territory column containing five horizontal rows (1, 3, 5, 7, 9).
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

  return (
    <div
      className={`relative flex flex-col h-full rounded-xl border transition-all duration-200 overflow-hidden ${
        isPlayerEliminated
          ? 'bg-[#F2EDE4]/70 border-[#8C929D] opacity-75'
          : isHomeTerritory
          ? 'bg-[#FCFAF5] border-[#242730] shadow-md ring-1 ring-[#242730]/10'
          : 'bg-[#F9F5EC]/70 border-[#D5CFC3] hover:border-[#D5CFC3]/90'
      } ${className}`}
    >
      {/* Home Territory Left Notebook Margin Line Accent */}
      {isHomeTerritory && (
        <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-[#D75050]/40 pointer-events-none z-20" />
      )}

      {/* Territory Header */}
      <div
        className="p-3 sm:p-3.5 border-b-2 flex flex-col gap-2 shrink-0 select-none"
        style={{
          backgroundColor: isPlayerEliminated ? '#F2EDE4' : `${shadeHex}10`,
          borderColor: isPlayerEliminated ? '#8C929D' : isHomeTerritory ? '#242730' : `${shadeHex}30`
        }}
      >
        {/* Top line: Status, Home/Host tags */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <MiniPencilAvatar hexColor={isPlayerEliminated ? '#8C929D' : shadeHex} isHome={isHomeTerritory} />

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                {isHost && (
                  <span title="Room Host">
                    <Crown className="w-3.5 h-3.5 text-[#D59926] fill-[#D59926] shrink-0" />
                  </span>
                )}
                <h3
                  className={`font-display text-sm sm:text-base font-bold truncate ${
                    isPlayerEliminated ? 'text-[#8C929D] line-through' : 'text-[#242730]'
                  }`}
                  title={nickname}
                >
                  {nickname}
                </h3>
              </div>
            </div>
          </div>

          {/* Territory Badge: HOME vs OPPONENT vs ELIMINATED */}
          <div className="shrink-0">
            {isPlayerEliminated ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#CE4242] text-white shadow-xs">
                ELIMINATED
              </span>
            ) : isHomeTerritory ? (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#242730] text-[#F8F4EB] shadow-xs">
                <Sparkles className="w-3 h-3 text-[#D59926]" /> HOME (YOU)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/5 text-[#5C6069] border border-black/10">
                <Shield className="w-3 h-3 text-[#8C929D]" /> OPPONENT
              </span>
            )}
          </div>
        </div>

        {/* Bottom line: Color Shade & Territory Label */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-black/20 shadow-xs shrink-0"
              style={{ backgroundColor: isPlayerEliminated ? '#8C929D' : shadeHex }}
            />
            <span className="font-mono text-[11px] text-[#4A4F5B] truncate max-w-[130px]">
              {shadeName}
            </span>
          </div>

          <span className="font-mono text-[10px] text-[#8C929D] uppercase tracking-wider">
            {isHomeTerritory ? '45% ARENA' : `${(55 / totalOpponents).toFixed(1)}% ARENA`}
          </span>
        </div>
      </div>

      {/* 5 Rows Container (1, 3, 5, 7, 9) */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between gap-2 overflow-y-auto">
        {TERRITORY_ROWS.map((rowNum) => {
          const rowData = playerRows.find((r) => r.rowNumber === rowNum) || { rowNumber: rowNum };
          const isSelected = isHomeTerritory && selectedRowNumber === rowNum;
          const isEligible = isHomeTerritory && eligibleRowNumber === rowNum;
          const isTargeted =
            !isHomeTerritory &&
            selectedTarget?.playerId === player.playerId &&
            selectedTarget?.rowNumber === rowNum;
          const isTargetable =
            !isHomeTerritory &&
            !isPlayerEliminated &&
            isTargetableOpponent &&
            !rowData.isEliminated;

          return (
            <RowStation
              key={rowNum}
              rowNumber={rowNum}
              rowData={rowData}
              isHomeTerritory={isHomeTerritory}
              isSelected={isSelected}
              onSelectRow={onSelectRow}
              onOpenDrawing={onOpenDrawing}
              isEligibleForAction={isEligible}
              isTargetable={isTargetable}
              isTargeted={isTargeted}
              onSelectTarget={onSelectTarget}
              playerId={player.playerId}
              playerShadeHex={shadeHex}
            />
          );
        })}
      </div>
    </div>
  );
};
