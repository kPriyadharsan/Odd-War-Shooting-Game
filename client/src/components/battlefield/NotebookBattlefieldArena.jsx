import React, { useMemo } from 'react';
import { TerritoryColumn } from './TerritoryColumn.jsx';
import { calculateBattlefieldProportions } from '../../store/battlefieldState.js';

/**
 * NotebookBattlefieldArena Component (Task 07)
 * Implements the core 45% / 55% proportional notebook battlefield layout.
 *
 * Rules:
 * - Own territory ALWAYS appears on the LEFT side, taking exactly 45% width.
 * - Remaining 55% is reserved for all opponents, divided equally:
 *   - 2-player match: 1 opponent = 55%
 *   - 3-player match: 2 opponents = 27.5% each
 *   - 4-player match: 3 opponents = 18.333% each
 * - Dynamic support for 2, 3, or 4 players.
 * - 5 horizontal rows (1, 3, 5, 7, 9) aligned across all player columns.
 */
export const NotebookBattlefieldArena = ({
  players = [],
  currentPlayerId = '',
  selectedRowNumber = null,
  onSelectRow = () => {},
  className = ''
}) => {
  // 1. Identify Home Player (Current Player) and Opponents
  const { homePlayer, opponents } = useMemo(() => {
    if (!players || players.length === 0) {
      return { homePlayer: null, opponents: [] };
    }

    // Find current player entry; fallback to first player if matching id is absent
    const foundHome = players.find((p) => p.playerId === currentPlayerId) || players[0];

    // Filter opponents and sort consistently by slotIndex (or joining order)
    const filteredOpponents = players
      .filter((p) => p.playerId !== foundHome.playerId)
      .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));

    return {
      homePlayer: foundHome,
      opponents: filteredOpponents
    };
  }, [players, currentPlayerId]);

  // 2. Calculate Mathematical Proportions (45% Home, 55% Opponents)
  const opponentCount = Math.max(1, opponents.length);
  const proportions = useMemo(
    () => calculateBattlefieldProportions(opponentCount),
    [opponentCount]
  );

  if (!homePlayer) {
    return (
      <div className="w-full p-8 text-center bg-[#FAF6EE] rounded-2xl border border-dashed border-[#D5CFC3]">
        <p className="font-mono text-sm text-[#4A4F5B]">
          No battlefield warriors detected.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl border-2 border-[#23252A] bg-[#F8F4EB] p-3 sm:p-5 shadow-paper-lg overflow-hidden ${className}`}
    >
      {/* Notebook Background Ruling (Light horizontal lines spanning entire arena) */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_27px,rgba(130,155,185,0.2)_28px)]" />

      {/* Top Red Notebook Margin Line (School Notebook signature) */}
      <div className="absolute left-6 sm:left-10 top-0 bottom-0 w-0.5 bg-[#D75050]/20 pointer-events-none z-0" />

      {/* Arena Content Container: 
          On Desktop/Tablet: Exactly 45% (Left) / 55% (Right) within this container.
          On Mobile: Minimum width ensures readability with smooth horizontal scrolling.
      */}
      <div className="relative z-10 w-full overflow-x-auto pb-2">
        <div className="min-w-[640px] md:min-w-0 w-full flex items-stretch gap-3 sm:gap-4">
          {/* =========================================================================
              1. OWN TERRITORY (HOME) - ALWAYS ON THE LEFT (EXACTLY 45% WIDTH)
              ========================================================================= */}
          <div
            className="shrink-0 flex flex-col"
            style={{ width: `${proportions.ownWidthPercent}%` }}
          >
            <TerritoryColumn
              player={homePlayer}
              isHomeTerritory={true}
              selectedRowNumber={selectedRowNumber}
              onSelectRow={onSelectRow}
              territoryIndex={0}
              totalOpponents={opponentCount}
            />
          </div>

          {/* Vertical Pencil Separator Between Own and Opponent Territories */}
          <div className="w-px bg-gradient-to-b from-transparent via-[#23252A]/30 to-transparent my-2 shrink-0" />

          {/* =========================================================================
              2. OPPONENTS TERRITORY AREA - TAKES THE REMAINING 55% WIDTH
              Divided equally among all opponents:
              - 1 opponent: 100% of 55% = 55%
              - 2 opponents: 50% of 55% = 27.5% each
              - 3 opponents: 33.333% of 55% = 18.333% each
              ========================================================================= */}
          <div
            className="shrink-0 flex items-stretch gap-2.5 sm:gap-3"
            style={{ width: `calc(${proportions.opponentsTotalPercent}% - 17px)` }}
          >
            {opponents.length > 0 ? (
              opponents.map((opponent, idx) => (
                <div
                  key={opponent.playerId}
                  className="flex-1 min-w-0 flex flex-col"
                  style={{
                    // Each opponent receives an equal fraction of the 55%
                    flex: '1 1 0%'
                  }}
                >
                  <TerritoryColumn
                    player={opponent}
                    isHomeTerritory={false}
                    selectedRowNumber={null}
                    onSelectRow={() => {}}
                    territoryIndex={idx + 1}
                    totalOpponents={opponentCount}
                  />
                </div>
              ))
            ) : (
              // If match is opened before opponent joins (fallback placeholder)
              <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-[#D5CFC3] bg-[#FAF6EE]/50 text-center">
                <span className="font-display font-bold text-sm text-[#4A4F5B]">
                  Awaiting Opponent...
                </span>
                <span className="font-mono text-xs text-[#8C929D] mt-1">
                  Opponent territory will occupy 55% of the battlefield.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
