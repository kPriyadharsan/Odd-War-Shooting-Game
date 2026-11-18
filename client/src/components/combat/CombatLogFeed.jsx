import React from 'react';
import { ShieldAlert, Crosshair, Skull, Crown, Zap } from 'lucide-react';

/**
 * CombatLogFeed Component (Task 10)
 * Notebook margin record of authoritative shots, hits, eliminations, and match events.
 */
export const CombatLogFeed = ({ combatLog = [], className = '' }) => {
  if (!combatLog || combatLog.length === 0) {
    return (
      <div
        className={`p-4 rounded-xl border border-dashed border-[#D5CFC3] bg-[#FAF6EE]/50 text-center text-xs font-mono text-[#8C929D] ${className}`}
      >
        <Crosshair className="w-4 h-4 mx-auto mb-1 text-[#8C929D]/60" />
        <span>No shots fired yet. Complete warriors and load ammunition to attack!</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 border-[#242730] bg-[#FFFDF9] p-4 shadow-sm flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#D5CFC3]">
        <div className="flex items-center gap-1.5 font-display font-bold text-sm text-[#242730]">
          <Zap className="w-4 h-4 text-[#D59926]" />
          <span>Battlefield Combat Log</span>
        </div>
        <span className="text-[10px] font-mono text-[#8C929D]">
          {combatLog.length} {combatLog.length === 1 ? 'Action' : 'Actions'}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px] pr-1">
        {combatLog.map((log, idx) => (
          <div
            key={log.actionId || idx}
            className="p-2 rounded-lg border border-[#D5CFC3]/80 bg-[#FCFAF5] text-xs font-mono flex items-start gap-2 text-[#242730]"
          >
            {log.matchFinished ? (
              <Crown className="w-4 h-4 text-[#D59926] shrink-0 mt-0.5" />
            ) : log.targetPlayerEliminated ? (
              <Skull className="w-4 h-4 text-[#CE4242] shrink-0 mt-0.5" />
            ) : (
              <Crosshair className="w-4 h-4 text-[#CE4242] shrink-0 mt-0.5" />
            )}

            <div className="min-w-0 flex-1">
              <div className="leading-snug">
                <strong>{log.attackerNickname}</strong> (Row {log.attackerRow}){' '}
                <span className="text-[#CE4242] font-semibold">eliminated</span>{' '}
                <strong>{log.targetNickname}</strong>'s Row {log.targetRow}
              </div>

              {log.targetPlayerEliminated && (
                <div className="text-[10px] text-[#CE4242] font-bold mt-0.5">
                  ☠️ {log.targetNickname} is fully ELIMINATED!
                </div>
              )}

              {log.matchFinished && (
                <div className="text-[10px] text-[#2E8557] font-bold mt-0.5">
                  🏆 VICTORY: {log.winnerNickname} won the match!
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
