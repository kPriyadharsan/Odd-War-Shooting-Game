import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Flame,
  Target,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Swords
} from 'lucide-react';
import { matchApi } from '../services/matchApi.js';
import { getPlayerSession } from '../store/playerSession.js';

export const LeaderboardPage = () => {
  const session = getPlayerSession();
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await matchApi.getGlobalLeaderboard(page, 20);
      setLeaderboard(data.leaderboard || []);
      setPagination(data.pagination || { page: 1, limit: 20, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Could not retrieve standings. Please ensure backend is reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLeaderboard(newPage);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FEF08A] text-[#854D0E] border-2 border-[#EAB308] flex items-center justify-center font-handwriting font-bold text-sm shadow-sketch-sm rotate-[-4deg]">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E5E7EB] text-[#374151] border-2 border-[#9CA3AF] flex items-center justify-center font-handwriting font-bold text-sm shadow-sketch-sm rotate-[2deg]">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FED7AA] text-[#9A3412] border-2 border-[#F97316] flex items-center justify-center font-handwriting font-bold text-sm shadow-sketch-sm rotate-[-2deg]">
          🥉 3
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-md bg-[#F4EEDB] text-[#5C6069] border border-[#D5CFC3] flex items-center justify-center font-mono font-bold text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className="min-w-0 max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* 1. Header Banner */}
      <section className="relative p-5 sm:p-7 rounded-2xl bg-[#FAF6EC] border-2 border-[#23252A] shadow-sketch-md overflow-hidden">
        {/* Subtle Notebook Ruling */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(to_bottom,transparent_27px,#D5CFC3_28px)] bg-[size:100%_28px]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#D97706] text-white flex items-center justify-center shadow-sketch-sm rotate-[-2deg] shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-handwriting font-bold text-2xl sm:text-3xl text-[#23252A]">
                  Notebook Honor Roll
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] font-bold">
                  Official Standings
                </span>
              </div>
              <p className="font-mono text-xs text-[#6B7280] mt-0.5">
                Authoritative rankings determined by Victories • Win Rate • Matches • Best Streak
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchLeaderboard(pagination.page)}
              className="p-2.5 rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-[#23252A] transition-colors shadow-sketch-sm flex items-center gap-1.5 font-mono text-xs"
              title="Refresh Standings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Top 3 Podium Highlights (when available) */}
      {!loading && leaderboard.length >= 3 && pagination.page === 1 && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* #2 Silver (Left) */}
          <div className="order-2 sm:order-1 p-4 rounded-2xl bg-white border-2 border-[#9CA3AF] shadow-sketch-sm flex flex-col justify-between text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 text-2xl">🥈</div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-[#6B7280]">Second Place</span>
              <h3 className="font-handwriting font-bold text-xl text-[#23252A] mt-1 truncate">
                {leaderboard[1].nickname}
              </h3>
              <span className="font-mono text-xs text-[#2563EB] font-semibold">
                {leaderboard[1].wins} Wins ({leaderboard[1].winPercentage}%)
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-dashed border-[#E5E7EB] flex justify-around text-xs font-mono text-[#6B7280]">
              <span>{leaderboard[1].matchesPlayed} Battles</span>
              <span>🔥 {leaderboard[1].bestStreak} Streak</span>
            </div>
          </div>

          {/* #1 Gold (Center, Elevated) */}
          <div className="order-1 sm:order-2 p-5 rounded-2xl bg-[#FEFCE8] border-2 border-[#EAB308] shadow-sketch-md flex flex-col justify-between text-center relative overflow-hidden sm:-mt-2">
            <div className="absolute top-2 right-2 text-2xl">🥇</div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-[#854D0E] bg-[#FEF08A] px-2 py-0.5 rounded-full inline-block">
                Reigning Champion
              </span>
              <h3 className="font-handwriting font-bold text-2xl text-[#78350F] mt-1.5 truncate">
                {leaderboard[0].nickname}
              </h3>
              <span className="font-mono text-sm text-[#854D0E] font-bold">
                {leaderboard[0].wins} Wins ({leaderboard[0].winPercentage}%)
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-dashed border-[#FDE047] flex justify-around text-xs font-mono text-[#854D0E]">
              <span>{leaderboard[0].matchesPlayed} Battles</span>
              <span>🔥 {leaderboard[0].bestStreak} Streak</span>
              <span>🎯 {leaderboard[0].opponentsEliminated} KOs</span>
            </div>
          </div>

          {/* #3 Bronze (Right) */}
          <div className="order-3 sm:order-3 p-4 rounded-2xl bg-white border-2 border-[#F97316] shadow-sketch-sm flex flex-col justify-between text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 text-2xl">🥉</div>
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-[#9A3412]">Third Place</span>
              <h3 className="font-handwriting font-bold text-xl text-[#23252A] mt-1 truncate">
                {leaderboard[2].nickname}
              </h3>
              <span className="font-mono text-xs text-[#2563EB] font-semibold">
                {leaderboard[2].wins} Wins ({leaderboard[2].winPercentage}%)
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-dashed border-[#E5E7EB] flex justify-around text-xs font-mono text-[#6B7280]">
              <span>{leaderboard[2].matchesPlayed} Battles</span>
              <span>🔥 {leaderboard[2].bestStreak} Streak</span>
            </div>
          </div>
        </section>
      )}

      {/* 3. Global Standings Table / Card List */}
      <section className="space-y-4">
        {error && (
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-sm font-mono">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#D5CFC3] shadow-sketch-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6B7280] mb-2" />
            <p className="font-mono text-xs text-[#6B7280]">Tallying official combat records...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-10 sm:p-14 text-center rounded-2xl bg-[#FAF6EC] border-2 border-dashed border-[#D5CFC3] shadow-sketch-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EFE8DA] text-[#6B7280] flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-handwriting font-bold text-xl text-[#23252A]">
              The Honor Roll is Blank
            </h3>
            <p className="font-mono text-xs text-[#6B7280] max-w-sm mx-auto">
              No warriors have completed a battle yet. Be the first champion by finishing a match!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-[#23252A] shadow-sketch-md overflow-hidden">
            {/* Table Header (Desktop) */}
            <div className="hidden sm:grid grid-cols-12 px-5 py-3 bg-[#F4EEDB] border-b border-[#D5CFC3] text-[11px] font-mono uppercase font-bold text-[#5C6069] tracking-wider">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-4">Warrior</div>
              <div className="col-span-2 text-center">Battles (W/L)</div>
              <div className="col-span-2 text-center">Win Rate</div>
              <div className="col-span-2 text-center">Streak</div>
              <div className="col-span-1 text-center">KOs</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#E5E7EB]">
              {leaderboard.map((entry) => {
                const isMe = entry.playerId === session.playerId;
                return (
                  <motion.div
                    key={entry.playerId}
                    whileHover={{ backgroundColor: '#FAF6EC' }}
                    className={`p-3.5 sm:px-5 sm:py-3.5 flex flex-col sm:grid sm:grid-cols-12 items-start sm:items-center gap-2 sm:gap-0 transition-colors ${
                      isMe ? 'bg-[#FEFCE8]/70 font-semibold' : ''
                    }`}
                  >
                    {/* Rank & Warrior info */}
                    <div className="sm:col-span-1 flex items-center sm:justify-center shrink-0">
                      {getRankBadge(entry.rank)}
                    </div>

                    <div className="sm:col-span-4 flex items-center space-x-2.5 min-w-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{
                          backgroundColor:
                            entry.primaryColor === 'RED'
                              ? '#dc2626'
                              : entry.primaryColor === 'GREEN'
                              ? '#16a34a'
                              : entry.primaryColor === 'YELLOW'
                              ? '#ca8a04'
                              : entry.primaryColor === 'BLACK'
                              ? '#1f2937'
                              : '#2563eb'
                        }}
                        title={entry.primaryColor}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-handwriting font-bold text-base sm:text-lg text-[#23252A] truncate">
                            {entry.nickname}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#23252A] text-[#F8F4EB]">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Battles (W/L) */}
                    <div className="sm:col-span-2 sm:text-center text-xs font-mono text-[#23252A] flex items-center justify-between sm:justify-center w-full sm:w-auto">
                      <span className="sm:hidden text-[#6B7280]">Battles:</span>
                      <span>
                        <span className="font-bold text-[#16A34A]">{entry.wins}W</span>
                        <span className="mx-1 text-[#9CA3AF]">/</span>
                        <span className="text-[#DC2626]">{entry.losses}L</span>
                        <span className="text-[#6B7280] ml-1">({entry.matchesPlayed})</span>
                      </span>
                    </div>

                    {/* Win Rate */}
                    <div className="sm:col-span-2 sm:text-center text-xs font-mono flex items-center justify-between sm:justify-center w-full sm:w-auto">
                      <span className="sm:hidden text-[#6B7280]">Win Rate:</span>
                      <span className="font-bold text-[#2563EB]">{entry.winPercentage}%</span>
                    </div>

                    {/* Streak */}
                    <div className="sm:col-span-2 sm:text-center text-xs font-mono flex items-center justify-between sm:justify-center w-full sm:w-auto">
                      <span className="sm:hidden text-[#6B7280]">Streak:</span>
                      <span className="inline-flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-[#EA580C]" />
                        <span className="font-bold text-[#EA580C]">{entry.currentStreak}</span>
                        <span className="text-[#9CA3AF] text-[10px]">(Best: {entry.bestStreak})</span>
                      </span>
                    </div>

                    {/* Knockouts */}
                    <div className="sm:col-span-1 sm:text-center text-xs font-mono flex items-center justify-between sm:justify-center w-full sm:w-auto">
                      <span className="sm:hidden text-[#6B7280]">KOs:</span>
                      <span className="font-handwriting font-bold text-base text-[#DC2626]">
                        {entry.opponentsEliminated}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="font-mono text-xs text-[#6B7280]">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} warriors)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-xs font-mono font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-xs font-mono font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Next <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
