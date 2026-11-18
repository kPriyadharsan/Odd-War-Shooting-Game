import React from 'react';
import { Crown, CheckCircle2, Clock, UserX, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * TerritoryMiniaturePreview Component (Task 06)
 * Miniature preview of the actual game board territories.
 * - Each player owns an independent vertical territory column
 * - Exactly five rows with odd-numbered station identifiers: 1, 3, 5, 7, 9
 * - Displays player nickname, host crown, assigned shade, and ready status
 * - Displays empty slots waiting for opponents
 * - Allows host to kick non-host players
 */
export const TerritoryMiniaturePreview = ({
  room,
  currentPlayerId,
  isHost,
  onKickPlayer,
  isKicking
}) => {
  const maxPlayers = room?.maxPlayers || 4;
  const players = room?.players || [];
  const rows = [1, 3, 5, 7, 9];

  // Build slots array of length maxPlayers
  const slots = Array.from({ length: maxPlayers }, (_, index) => {
    const player = players.find((p) => p.slotIndex === index) || players[index] || null;
    return {
      slotIndex: index,
      player
    };
  });

  return (
    <div className="w-full">
      {/* Board Territory Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {slots.map(({ slotIndex, player }) => {
          if (player) {
            const isCurrent = player.playerId === currentPlayerId;
            const shadeHex = player.assignedShade?.hex || '#2B68B4';
            const shadeName = player.assignedShade?.name || player.primaryColor;

            return (
              <motion.div
                key={player.playerId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: slotIndex * 0.05 }}
                className={`relative rounded-xl border-2 flex flex-col transition-all duration-200 bg-[#FCFAF5] overflow-hidden ${
                  isCurrent
                    ? 'border-[#242730] shadow-md ring-2 ring-[#242730]/10'
                    : 'border-[#4A4F5B]/30 hover:border-[#4A4F5B]/60'
                }`}
              >
                {/* Territory Header: Player Info & Status */}
                <div
                  className="p-3 border-b-2 flex flex-col gap-2"
                  style={{
                    backgroundColor: `${shadeHex}12`,
                    borderColor: `${shadeHex}40`
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {player.isHost && (
                        <span title="Room Host">
                          <Crown className="w-4 h-4 text-[#D59926] fill-[#D59926] shrink-0" />
                        </span>
                      )}
                      <h4
                        className="font-display text-sm font-bold text-[#242730] truncate"
                        title={player.nickname}
                      >
                        {player.nickname}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-handwriting font-bold px-1.5 py-0.5 rounded bg-[#242730] text-[#F8F4EB] shrink-0">
                          YOU
                        </span>
                      )}
                    </div>

                    {/* Ready Badge */}
                    <div>
                      {player.isHost ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#2E8557]/15 text-[#2E8557] border border-[#2E8557]/30">
                          <CheckCircle2 className="w-3 h-3" /> HOST
                        </span>
                      ) : player.isReady ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#2E8557]/15 text-[#2E8557] border border-[#2E8557]/30">
                          <CheckCircle2 className="w-3 h-3" /> READY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#D59926]/15 text-[#96630D] border border-[#D59926]/30">
                          <Clock className="w-3 h-3" /> NOT READY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shade Swatch & Info */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-sm shrink-0"
                        style={{ backgroundColor: shadeHex }}
                      />
                      <span className="font-mono text-[11px] text-[#4A4F5B] truncate">
                        {shadeName}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-[#8C929D]">
                      SLOT {slotIndex + 1}
                    </span>
                  </div>
                </div>

                {/* Territory Miniature Board Preview (5 Odd Rows: 1, 3, 5, 7, 9) */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-1.5 bg-[#FAF6EE]/50">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C929D] text-center mb-0.5 flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3 text-[#8C929D]" />
                    <span>Territory {slotIndex + 1}</span>
                  </div>

                  {rows.map((rowNum) => (
                    <div
                      key={rowNum}
                      className="relative rounded border border-dashed border-[#8C929D]/40 bg-white/70 py-1 px-2 flex items-center justify-between group hover:border-[#242730]/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center font-display font-bold text-xs text-white shadow-xs"
                          style={{ backgroundColor: shadeHex }}
                        >
                          {rowNum}
                        </span>
                        <span className="text-[11px] font-mono text-[#4A4F5B]">
                          Row {rowNum}
                        </span>
                      </div>

                      {/* Station Marker */}
                      <span className="text-[9px] font-mono text-[#8C929D] italic">
                        Station {rowNum}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Host Control: Kick Player (Only visible to Host on non-host players) */}
                {isHost && !player.isHost && (
                  <div className="p-2 bg-[#FCFAF5] border-t border-[#4A4F5B]/20 text-center">
                    <button
                      type="button"
                      onClick={() => onKickPlayer(player.playerId, player.nickname)}
                      disabled={isKicking}
                      className="w-full inline-flex items-center justify-center gap-1 py-1 px-2 text-xs font-mono font-bold text-[#CE4242] hover:text-[#8A1F1F] hover:bg-[#FDF2F2] rounded border border-transparent hover:border-[#CE4242]/30 transition-colors cursor-pointer disabled:opacity-50"
                      title={`Remove ${player.nickname} from room`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Kick Warrior</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          }

          // Open Empty Slot
          return (
            <motion.div
              key={`empty-slot-${slotIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border-2 border-dashed border-[#8C929D]/40 bg-[#F4EFE6]/30 flex flex-col items-center justify-center p-6 min-h-[290px] text-center"
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-[#8C929D]/50 flex items-center justify-center mb-3 text-[#8C929D]">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <p className="font-display font-semibold text-sm text-[#4A4F5B] mb-1">
                Waiting for Warrior...
              </p>
              <p className="font-mono text-xs text-[#8C929D] mb-4">
                Territory Slot {slotIndex + 1} Open
              </p>

              {/* 5 Ghost Rows */}
              <div className="w-full max-w-[140px] space-y-1 opacity-50">
                {rows.map((r) => (
                  <div
                    key={r}
                    className="h-4 rounded border border-dashed border-[#8C929D]/40 bg-[#FCFAF5]/50 flex items-center justify-center text-[9px] font-mono text-[#8C929D]"
                  >
                    Row {r}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
