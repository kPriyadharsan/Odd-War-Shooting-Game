import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Swords, Clock, Calendar, Hash, Target, ShieldAlert, Award } from 'lucide-react';

export const MatchDetailsModal = ({ match, isOpen, onClose }) => {
  if (!isOpen || !match) return null;

  const formatDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent Match';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 60) return `${seconds || 0}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-[#FBF7EE] border-2 border-[#23252A] rounded-2xl shadow-sketch-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b-2 border-dashed border-[#D5CFC3] flex items-center justify-between bg-[#F4EEDB]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#23252A] text-[#F8F4EB] flex items-center justify-center shadow-sketch-sm">
                <Swords className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-handwriting font-bold text-xl sm:text-2xl text-[#23252A] leading-none">
                  {match.roomName || 'Match Report'}
                </h3>
                <span className="font-mono text-xs text-[#6B7280]">
                  Room Code: <span className="font-bold text-[#23252A]">{match.roomCode}</span> • {match.isPrivate ? 'Private Duel' : 'Public Battle'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#D5CFC3] hover:bg-[#EFE8DA] text-[#5C6069] transition-colors"
              aria-label="Close match details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Quick Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white border border-[#D5CFC3] text-center shadow-sketch-sm">
                <div className="flex items-center justify-center text-[#6B7280] mb-0.5">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  <span className="text-[10px] font-mono uppercase">Duration</span>
                </div>
                <span className="font-handwriting font-bold text-base text-[#23252A]">
                  {formatDuration(match.durationSeconds)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#D5CFC3] text-center shadow-sketch-sm">
                <div className="flex items-center justify-center text-[#6B7280] mb-0.5">
                  <Hash className="w-3.5 h-3.5 mr-1" />
                  <span className="text-[10px] font-mono uppercase">Turns</span>
                </div>
                <span className="font-handwriting font-bold text-base text-[#23252A]">
                  {match.totalTurns || 1}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#D5CFC3] text-center shadow-sketch-sm">
                <div className="flex items-center justify-center text-[#6B7280] mb-0.5">
                  <Award className="w-3.5 h-3.5 mr-1" />
                  <span className="text-[10px] font-mono uppercase">Paper</span>
                </div>
                <span className="font-mono text-xs font-semibold text-[#23252A] truncate block capitalize">
                  {(match.paperStyle || 'classic').replace('-', ' ')}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#D5CFC3] text-center shadow-sketch-sm">
                <div className="flex items-center justify-center text-[#6B7280] mb-0.5">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  <span className="text-[10px] font-mono uppercase">Date</span>
                </div>
                <span className="font-mono text-[11px] font-medium text-[#23252A] truncate block">
                  {formatDate(match.completedAt)}
                </span>
              </div>
            </div>

            {/* Winner Banner */}
            {match.winner ? (
              <div className="p-3.5 rounded-xl bg-[#FEF3C7] border-2 border-[#D97706] flex items-center justify-between shadow-sketch-sm">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#92400E] block font-bold">
                      Match Champion
                    </span>
                    <span className="font-handwriting font-bold text-lg text-[#78350F]">
                      {match.winner.nickname}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#FDE68A] text-[#92400E] border border-[#F59E0B]">
                  VICTORY
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#E5E7EB] border border-[#9CA3AF] text-center">
                <span className="font-mono text-xs text-[#4B5563]">Match completed with no single survivor (Tie / Draw)</span>
              </div>
            )}

            {/* Combatants List */}
            <div>
              <h4 className="font-handwriting font-bold text-lg text-[#23252A] mb-2 flex items-center">
                <span>Warriors & Combat Statistics</span>
              </h4>
              <div className="space-y-2">
                {match.players?.map((p, idx) => (
                  <div
                    key={p.playerId || idx}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      p.isWinner
                        ? 'bg-[#FEFCE8] border-[#EAB308] shadow-sketch-sm'
                        : 'bg-white border-[#D5CFC3]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: p.assignedShade?.hex || (p.primaryColor === 'RED' ? '#dc2626' : p.primaryColor === 'GREEN' ? '#16a34a' : p.primaryColor === 'YELLOW' ? '#ca8a04' : p.primaryColor === 'BLACK' ? '#1f2937' : '#2563eb') }}
                        title={p.primaryColor}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-handwriting font-bold text-base text-[#23252A] truncate">
                            {p.nickname}
                          </span>
                          {p.isWinner && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#FEF08A] text-[#854D0E] font-bold rounded">
                              #1
                            </span>
                          )}
                          {p.isEliminated && !p.isWinner && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#FEE2E2] text-[#991B1B] rounded">
                              Eliminated
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-[#6B7280]">
                          Color: {p.primaryColor} • Placement #{p.placement || (p.isWinner ? 1 : 2)}
                        </span>
                      </div>
                    </div>

                    {/* Stats columns */}
                    <div className="flex items-center space-x-3 text-right shrink-0">
                      <div className="text-center">
                        <span className="block font-mono text-[10px] text-[#6B7280]">Shots</span>
                        <span className="font-handwriting font-bold text-sm text-[#23252A]">
                          {p.shotsFired || 0}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block font-mono text-[10px] text-[#6B7280]">KOs</span>
                        <span className="font-handwriting font-bold text-sm text-[#2563EB]">
                          {p.opponentsEliminated || 0}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="block font-mono text-[10px] text-[#6B7280]">Losses</span>
                        <span className="font-handwriting font-bold text-sm text-[#DC2626]">
                          {p.eliminatedRowsCount || 0}r
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#D5CFC3] bg-[#F4EEDB] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl font-handwriting font-bold text-sm bg-[#23252A] text-[#F8F4EB] hover:bg-[#3E424B] transition-colors shadow-sketch-sm"
            >
              Close Ledger
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
