import React from 'react';
import { History, Shield, CheckCircle2, Ban } from 'lucide-react';

/**
 * ResultHistoryPanel Component (Task 08)
 * Displays a notebook-style log of recent magical book page flips.
 */
export const ResultHistoryPanel = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-[#D5CFC3] bg-[#FCFAF5]/60 text-center">
        <span className="font-handwriting text-xs text-[#8C929D]">
          No book flips recorded yet. Flip the book to reveal your row!
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-[#242730] bg-[#FCFAF5] p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D5CFC3]">
        <div className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-[#242730]" />
          <h4 className="font-display font-bold text-xs sm:text-sm text-[#242730]">
            Book of Fate History
          </h4>
        </div>
        <span className="font-mono text-[10px] text-[#8C929D]">
          {history.length} Flip{history.length === 1 ? '' : 's'} Logged
        </span>
      </div>

      {/* History Rows List */}
      <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
        {history.map((entry, idx) => {
          const isOdd = entry.isOdd;
          return (
            <div
              key={idx}
              className={`p-2 rounded border flex items-center justify-between gap-2 text-xs transition-colors ${
                isOdd
                  ? 'bg-[#F0F7F3] border-[#2E8557]/30 text-[#1C5236]'
                  : 'bg-[#FAF6EE] border-[#D5CFC3] text-[#5C6069]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[10px] text-[#8C929D] shrink-0">
                  T{entry.turnNumber}
                </span>

                <span className="font-display font-bold truncate max-w-[100px] text-[#242730]">
                  {entry.nickname}
                </span>

                <span className="font-mono text-xs font-semibold px-1.5 py-0.2 rounded bg-white/70 border border-black/10 shrink-0">
                  p. {entry.pageNumber}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-[10px] text-[#8C929D]">
                  Digit {entry.finalDigit} →
                </span>

                {isOdd ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#2E8557]">
                    <CheckCircle2 className="w-3 h-3" /> Row {entry.targetRow}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#8C929D]">
                    <Ban className="w-3 h-3" /> NO ACTION
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
