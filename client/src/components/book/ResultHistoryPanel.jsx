import React from 'react';
import { History, CheckCircle2, Ban, Crosshair, Pencil, SkipForward, Swords } from 'lucide-react';

/**
 * ResultHistoryPanel Component (Tasks 08 & 11)
 * Displays authoritative, notebook-style turn and combat history.
 */
export const ResultHistoryPanel = ({ history = [], className = '' }) => {
  if (!history || history.length === 0) {
    return (
      <div
        className={`p-4 rounded-xl border border-dashed border-[#D5CFC3] bg-[#FCFAF5]/60 text-center ${className}`}
      >
        <span className="font-handwriting text-xs text-[#8C929D]">
          No match history recorded yet. Open the Magical Book to begin!
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 border-[#242730] bg-[#FCFAF5] p-3 sm:p-4 shadow-sm flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D5CFC3]">
        <div className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-[#242730]" />
          <h4 className="font-display font-bold text-xs sm:text-sm text-[#242730]">
            Notebook Match History
          </h4>
        </div>
        <span className="font-mono text-[10px] text-[#8C929D]">
          {history.length} Turn{history.length === 1 ? '' : 's'} Logged
        </span>
      </div>

      {/* History Rows List */}
      <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
        {history.map((entry, idx) => {
          const isOdd = entry.isOdd;
          const actionType = entry.actionType || (isOdd ? 'ACTION' : 'NO_ACTION');
          const isAttack = actionType === 'ATTACK';
          const isDraw = actionType === 'DRAW';
          const isPass = actionType === 'PASS';
          const isNoAction = actionType === 'NO_ACTION' || !isOdd;

          return (
            <div
              key={entry.turnId || idx}
              className={`p-2 rounded-lg border text-xs transition-colors flex flex-col gap-1 ${
                isAttack
                  ? 'bg-[#FFF3F3] border-[#CE4242]/30 text-[#242730]'
                  : isDraw
                  ? 'bg-[#F0F7F3] border-[#2E8557]/30 text-[#242730]'
                  : 'bg-[#FAF6EE] border-[#D5CFC3] text-[#5C6069]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-[10px] text-[#8C929D] font-bold shrink-0">
                    #{entry.turnNumber}
                  </span>

                  <span className="font-display font-bold truncate max-w-[110px] text-[#242730]" title={entry.nickname}>
                    {entry.nickname}
                  </span>

                  {entry.pageNumber !== null && (
                    <span className="font-mono text-[10px] font-semibold px-1 rounded bg-white/80 border border-black/10 shrink-0">
                      p.{entry.pageNumber}
                    </span>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {isAttack ? (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-[#CE4242]">
                      <Crosshair className="w-3 h-3" /> ATTACK
                    </span>
                  ) : isDraw ? (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-[#2E8557]">
                      <Pencil className="w-3 h-3" /> DREW {entry.stage || 'STAGE'}
                    </span>
                  ) : isPass ? (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-[#8C929D]">
                      <SkipForward className="w-3 h-3" /> PASSED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-bold text-[#8C929D]">
                      <Ban className="w-3 h-3" /> NO ACTION
                    </span>
                  )}
                </div>
              </div>

              {/* Action Description & Target Station */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#4A4F5B]">
                <span className="truncate pr-1">
                  {entry.attackDetails ? (
                    <span>
                      Targeted <strong>{entry.attackDetails.targetNickname}</strong> Row {entry.attackDetails.targetRow}
                    </span>
                  ) : entry.targetRow ? (
                    <span>Row {entry.targetRow} Activated</span>
                  ) : (
                    <span>Even Digit</span>
                  )}
                </span>

                {entry.timestamp && (
                  <span className="text-[9px] text-[#8C929D] shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
