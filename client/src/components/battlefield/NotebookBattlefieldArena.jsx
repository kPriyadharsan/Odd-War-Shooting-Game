import React, { useMemo, useRef, useState } from 'react';
import { Shield, Target, MoveHorizontal } from 'lucide-react';
import { TerritoryColumn } from './TerritoryColumn.jsx';
import { calculateBattlefieldProportions } from '../../store/battlefieldState.js';

/**
 * NotebookBattlefieldArena Component (Task Redesign)
 *
 * Implements the continuous notebook sheet battlefield.
 * - Current player's territory is ALWAYS on the LEFT (45% width).
 * - Opponents occupy the remaining 55% width:
 *   * 1 opponent: 55%
 *   * 2 opponents: 27.5% each
 *   * 3 opponents: 18.33% each
 * - Darker and thicker pencil column dividers.
 * - Mobile portrait friendly with touch-scroll and home/opponents toggle.
 */
export const NotebookBattlefieldArena = ({
  players = [],
  currentPlayerId = '',
  selectedRowNumber = null,
  onSelectRow = () => {},
  onOpenDrawing = () => {},
  eligibleRowNumber = null,
  isTargetableOpponent = false,
  selectedTarget = null,
  onSelectTarget = () => {},
  className = ''
}) => {
  const scrollContainerRef = useRef(null);
  const [activeMobileView, setActiveMobileView] = useState('home'); // 'home' | 'opponents'

  // 1. Identify Home Player (Current Player) and Opponents
  const { homePlayer, opponents } = useMemo(() => {
    if (!players || players.length === 0) {
      return { homePlayer: null, opponents: [] };
    }

    const foundHome = players.find((p) => p.playerId === currentPlayerId) || players[0];
    const filteredOpponents = players
      .filter((p) => p.playerId !== foundHome.playerId)
      .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));

    return {
      homePlayer: foundHome,
      opponents: filteredOpponents
    };
  }, [players, currentPlayerId]);

  // 2. Proportions Calculation (45% Home, 55% Opponents)
  const opponentCount = Math.max(1, opponents.length);
  const proportions = useMemo(
    () => calculateBattlefieldProportions(opponentCount),
    [opponentCount]
  );

  const scrollToView = (view) => {
    setActiveMobileView(view);
    if (!scrollContainerRef.current) return;
    if (view === 'home') {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth * 0.45,
        behavior: 'smooth'
      });
    }
  };

  const minArenaWidthClass =
    opponentCount >= 3
      ? 'min-w-[800px] lg:min-w-0'
      : opponentCount === 2
      ? 'min-w-[650px] md:min-w-0'
      : 'min-w-[540px] md:min-w-0';

  if (!homePlayer) {
    return (
      <div className="w-full p-8 text-center text-[#4A4F5B] font-mono text-sm">
        No notebook warriors detected.
      </div>
    );
  }

  return (
    <div className={`relative w-full flex-1 flex flex-col ${className}`}>
      {/* Mobile Responsive Territory Switcher (<md only) */}
      <div className="flex md:hidden items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#242730]/20 select-none">
        <div className="flex items-center gap-1 bg-black/5 p-0.5 rounded-lg border border-[#242730]/20 text-xs font-mono">
          <button
            type="button"
            onClick={() => scrollToView('home')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
              activeMobileView === 'home'
                ? 'bg-[#242730] text-[#FAF6EE] shadow-xs'
                : 'text-[#5C6069] hover:text-[#242730]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#2B68B4]" />
            <span>Your Side (45%)</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToView('opponents')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
              activeMobileView === 'opponents'
                ? 'bg-[#242730] text-[#FAF6EE] shadow-xs'
                : 'text-[#5C6069] hover:text-[#242730]'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#CE4242]" />
            <span>Opponents (55%)</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-mono text-[#8C929D]">
          <MoveHorizontal className="w-3 h-3 text-[#D59926] animate-pulse" />
          <span>Swipe arena</span>
        </div>
      </div>

      {/* Main Continuous Arena Surface:
          Desktop: 45% (Home on Left) / 55% (Opponents on Right)
          Mobile: Horizontal touch-scrollable without page overflow
      */}
      <div
        ref={scrollContainerRef}
        className="w-full flex-1 overflow-x-auto overflow-y-visible pb-1 scroll-smooth"
        onScroll={(e) => {
          const target = e.currentTarget;
          if (target.scrollLeft > target.scrollWidth * 0.2) {
            if (activeMobileView !== 'opponents') setActiveMobileView('opponents');
          } else {
            if (activeMobileView !== 'home') setActiveMobileView('home');
          }
        }}
      >
        <div className={`${minArenaWidthClass} w-full flex items-stretch h-full gap-2 sm:gap-3`}>
          {/* =========================================================================
              1. HOME TERRITORY - ALWAYS POSITIONED FIRST ON THE LEFT (45% WIDTH)
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
              onOpenDrawing={onOpenDrawing}
              eligibleRowNumber={eligibleRowNumber}
              territoryIndex={0}
              totalOpponents={opponentCount}
            />
          </div>

          {/* =========================================================================
              2. OPPONENTS' TERRITORIES - TAKES REMAINING 55% WIDTH
              ========================================================================= */}
          <div
            className="shrink-0 flex items-stretch gap-2 sm:gap-3"
            style={{ width: `calc(${proportions.opponentsTotalPercent}% - 12px)` }}
          >
            {opponents.length > 0 ? (
              opponents.map((opponent, idx) => (
                <div
                  key={opponent.playerId}
                  className="flex-1 min-w-0 flex flex-col"
                  style={{ flex: '1 1 0%' }}
                >
                  <TerritoryColumn
                    player={opponent}
                    isHomeTerritory={false}
                    selectedRowNumber={null}
                    onSelectRow={() => {}}
                    isTargetableOpponent={isTargetableOpponent}
                    selectedTarget={selectedTarget}
                    onSelectTarget={onSelectTarget}
                    territoryIndex={idx + 1}
                    totalOpponents={opponentCount}
                  />
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#242730]/20 rounded-xl text-center">
                <span className="font-display font-bold text-sm text-[#4A4F5B]">
                  Awaiting Opponent...
                </span>
                <span className="font-mono text-xs text-[#8C929D] mt-1">
                  Opponent territory will occupy 55% of the notebook sheet.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
