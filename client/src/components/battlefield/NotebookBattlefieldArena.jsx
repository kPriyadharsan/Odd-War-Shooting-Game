import React, { useMemo, useRef, useState } from 'react';
import { Shield, Target, MoveHorizontal } from 'lucide-react';
import { TerritoryColumn } from './TerritoryColumn.jsx';
import { calculateBattlefieldProportions } from '../../store/battlefieldState.js';

/**
 * NotebookBattlefieldArena Component (Tasks 07 & 12)
 * Implements the core 45% / 55% proportional notebook battlefield layout.
 *
 * Responsive Architecture:
 * - Own territory ALWAYS appears on the LEFT side (45% width).
 * - Remaining 55% is reserved for all opponents, divided equally.
 * - Mobile & Tablet Responsive: Provides smooth horizontal scrolling with touch gestures
 *   and responsive quick-switcher tabs ("⚔️ Home" / "🎯 Opponents").
 * - Fluid high-resolution scaling across tablets, laptops, and ultra-wide desktops.
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

  // 2. Calculate Mathematical Proportions (45% Home, 55% Opponents)
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
      ? 'min-w-[820px] lg:min-w-0'
      : opponentCount === 2
      ? 'min-w-[680px] md:min-w-0'
      : 'min-w-[560px] md:min-w-0';

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
      className={`relative w-full rounded-2xl border-2 border-[#23252A] bg-[#F8F4EB] p-2.5 sm:p-4 md:p-5 shadow-paper-lg overflow-hidden ${className}`}
    >
      {/* Notebook Background Ruling (Light horizontal lines spanning entire arena) */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_27px,rgba(130,155,185,0.2)_28px)]" />

      {/* Top Red Notebook Margin Line (School Notebook signature) */}
      <div className="absolute left-6 sm:left-10 top-0 bottom-0 w-0.5 bg-[#D75050]/20 pointer-events-none z-0" />

      {/* Mobile Responsive Navigation Bar (<md only) */}
      <div className="relative z-20 flex md:hidden items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#D5CFC3]">
        <div className="flex items-center gap-1.5 bg-[#EFE8DA] p-1 rounded-lg border border-[#D5CFC3] text-xs font-mono">
          <button
            type="button"
            onClick={() => scrollToView('home')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
              activeMobileView === 'home'
                ? 'bg-[#242730] text-[#F8F4EB] shadow-xs'
                : 'text-[#5C6069] hover:text-[#242730]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#2B68B4]" />
            <span>Your Territory (45%)</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToView('opponents')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
              activeMobileView === 'opponents'
                ? 'bg-[#242730] text-[#F8F4EB] shadow-xs'
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

      {/* Arena Content Container: 
          On Desktop/Laptop: Exactly 45% (Left) / 55% (Right) proportional split.
          On Mobile/Compact Tablet: Scrollable with tactile ease and zero layout degradation.
      */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 w-full overflow-x-auto pb-2 scroll-smooth"
        onScroll={(e) => {
          const target = e.currentTarget;
          if (target.scrollLeft > target.scrollWidth * 0.2) {
            if (activeMobileView !== 'opponents') setActiveMobileView('opponents');
          } else {
            if (activeMobileView !== 'home') setActiveMobileView('home');
          }
        }}
      >
        <div className={`${minArenaWidthClass} w-full flex items-stretch gap-2.5 sm:gap-4`}>
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
              onOpenDrawing={onOpenDrawing}
              eligibleRowNumber={eligibleRowNumber}
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
            className="shrink-0 flex items-stretch gap-2 sm:gap-3"
            style={{ width: `calc(${proportions.opponentsTotalPercent}% - 17px)` }}
          >
            {opponents.length > 0 ? (
              opponents.map((opponent, idx) => (
                <div
                  key={opponent.playerId}
                  className="flex-1 min-w-0 flex flex-col"
                  style={{
                    flex: '1 1 0%'
                  }}
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
