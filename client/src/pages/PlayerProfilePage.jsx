import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Trophy,
  Swords,
  Flame,
  Target,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Award
} from 'lucide-react';
import { getPlayerSession } from '../store/playerSession.js';
import { matchApi } from '../services/matchApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.jsx';
import { MatchDetailsModal } from '../components/profile/MatchDetailsModal.jsx';

export const PlayerProfilePage = () => {
  const session = getPlayerSession();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfileData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, historyData] = await Promise.all([
        matchApi.getPlayerStats(session.playerId),
        matchApi.getPlayerMatchHistory(session.playerId, page, 10)
      ]);

      setStats(statsData);
      setMatches(historyData.matches || []);
      setPagination(historyData.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load player profile:', err);
      setError('Could not load match records. Ensure the server is online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData(1);
  }, [session.playerId]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchProfileData(newPage);
    }
  };

  const handleInspectMatch = async (matchId) => {
    try {
      const fullDetails = await matchApi.getMatchDetails(matchId);
      setSelectedMatch(fullDetails);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load match details:', err);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 60) return `${seconds || 0}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="min-w-0 max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* 1. Header Profile Banner */}
      <section className="relative p-5 sm:p-7 rounded-2xl bg-[#FAF6EC] border-2 border-[#23252A] shadow-sketch-md overflow-hidden">
        {/* Subtle Notebook Ruling Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(to_bottom,transparent_27px,#D5CFC3_28px)] bg-[size:100%_28px]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center space-x-4">
            {/* Color Swatch Avatar */}
            <div className="relative">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#23252A] shadow-sketch-sm flex items-center justify-center text-white"
                style={{
                  backgroundColor:
                    session.primaryColor === 'RED'
                      ? '#dc2626'
                      : session.primaryColor === 'GREEN'
                      ? '#16a34a'
                      : session.primaryColor === 'YELLOW'
                      ? '#ca8a04'
                      : session.primaryColor === 'BLACK'
                      ? '#1f2937'
                      : '#2563eb'
                }}
              >
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
              </div>
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#23252A] text-[#F8F4EB] uppercase">
                {session.primaryColor}
              </div>
            </div>

            {/* Nickname & ID */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-handwriting font-bold text-2xl sm:text-3xl text-[#23252A]">
                  {session.nickname}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-mono bg-[#EFE8DA] border border-[#D5CFC3] text-[#5C6069]">
                  Notebook Combatant
                </span>
              </div>
              <p className="font-mono text-xs text-[#6B7280] mt-0.5">
                Player ID: <span className="text-[#23252A] font-semibold">{session.playerId}</span>
                {isAuthenticated && user?.email && (
                  <span className="ml-2 font-mono text-xs text-[#2563EB]">({user.email})</span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {isAuthenticated ? (
                  <>
                    <span className="inline-flex items-center text-xs font-mono text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Google Verified Account
                    </span>
                    {user?.dob && (
                      <span className="inline-flex items-center text-xs font-mono text-[#4B5563] bg-[#F3F4F6] px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                        <Calendar className="w-3 h-3 mr-1 text-[#2B68B4]" />
                        DOB: {formatDate(user.dob)} (Private)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center text-xs font-mono text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                    Guest Session
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <GoogleSignInButton
                returnTo="/profile"
                text="Link Google Account"
                size="sm"
                className="shadow-sketch-sm"
              />
            )}
            <button
              onClick={() => fetchProfileData(pagination.page)}
              className="p-2.5 rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-[#23252A] transition-colors shadow-sketch-sm"
              title="Refresh Stats"
              aria-label="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/profile-setup"
              className="px-4 py-2.5 rounded-xl font-handwriting font-bold text-sm bg-[#23252A] text-[#F8F4EB] hover:bg-[#3E424B] transition-colors shadow-sketch-sm flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile Settings</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Aggregate Career Statistics Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-handwriting font-bold text-2xl text-[#23252A] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D97706]" />
            <span>Career Record & Statistics</span>
          </h2>
          {stats?.lastMatchAt && (
            <span className="font-mono text-xs text-[#6B7280]">
              Last match: {formatDate(stats.lastMatchAt)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Matches Played */}
          <div className="p-4 rounded-xl bg-white border border-[#D5CFC3] shadow-sketch-sm flex flex-col justify-between">
            <span className="font-mono text-xs text-[#6B7280] uppercase tracking-wider">Battles</span>
            <div className="mt-2">
              <span className="font-handwriting font-bold text-3xl text-[#23252A]">
                {stats?.matchesPlayed ?? 0}
              </span>
              <span className="block font-mono text-[10px] text-[#9CA3AF] mt-0.5">Total Matches</span>
            </div>
          </div>

          {/* Victories */}
          <div className="p-4 rounded-xl bg-[#FEFCE8] border border-[#FEF08A] shadow-sketch-sm flex flex-col justify-between">
            <span className="font-mono text-xs text-[#854D0E] uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Wins</span>
            </span>
            <div className="mt-2">
              <span className="font-handwriting font-bold text-3xl text-[#854D0E]">
                {stats?.wins ?? 0}
              </span>
              <span className="block font-mono text-[10px] text-[#A16207] mt-0.5">
                {stats?.losses ?? 0} Defeats
              </span>
            </div>
          </div>

          {/* Win Rate */}
          <div className="p-4 rounded-xl bg-white border border-[#D5CFC3] shadow-sketch-sm flex flex-col justify-between">
            <span className="font-mono text-xs text-[#6B7280] uppercase tracking-wider">Win Rate</span>
            <div className="mt-2">
              <span className="font-handwriting font-bold text-3xl text-[#2563EB]">
                {stats?.winPercentage ?? 0}%
              </span>
              <span className="block font-mono text-[10px] text-[#9CA3AF] mt-0.5">Authoritative</span>
            </div>
          </div>

          {/* Current Win Streak */}
          <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] shadow-sketch-sm flex flex-col justify-between">
            <span className="font-mono text-xs text-[#C2410C] uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Streak</span>
            </span>
            <div className="mt-2">
              <span className="font-handwriting font-bold text-3xl text-[#EA580C]">
                {stats?.currentStreak ?? 0}
              </span>
              <span className="block font-mono text-[10px] text-[#C2410C] mt-0.5">Current Streak</span>
            </div>
          </div>

          {/* Best Win Streak */}
          <div className="p-4 rounded-xl bg-white border border-[#D5CFC3] shadow-sketch-sm flex flex-col justify-between">
            <span className="font-mono text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#4B5563]" />
              <span>Best</span>
            </span>
            <div className="mt-2">
              <span className="font-handwriting font-bold text-3xl text-[#23252A]">
                {stats?.bestStreak ?? 0}
              </span>
              <span className="block font-mono text-[10px] text-[#9CA3AF] mt-0.5">All-time High</span>
            </div>
          </div>

          {/* Opponents Knocked Out */}
          <div className="p-4 rounded-xl bg-white border border-[#D5CFC3] shadow-sketch-sm flex flex-col justify-between">
            <span className="font-mono text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Knockouts</span>
            </span>
            <div className="mt-2">
              <span className="font-handwriting font-bold text-3xl text-[#DC2626]">
                {stats?.opponentsEliminated ?? 0}
              </span>
              <span className="block font-mono text-[10px] text-[#9CA3AF] mt-0.5">Players Wiped</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Match History Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-handwriting font-bold text-2xl text-[#23252A] flex items-center gap-2">
            <Swords className="w-5 h-5 text-[#2563EB]" />
            <span>Match History & Combat Log</span>
          </h2>
          <span className="font-mono text-xs text-[#6B7280]">
            {pagination.total} total {pagination.total === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-sm font-mono">
            {error}
          </div>
        )}

        {/* Match Cards List */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#D5CFC3] shadow-sketch-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6B7280] mb-2" />
            <p className="font-mono text-xs text-[#6B7280]">Consulting the Battle Ledger...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="p-10 sm:p-14 text-center rounded-2xl bg-[#FAF6EC] border-2 border-dashed border-[#D5CFC3] shadow-sketch-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EFE8DA] text-[#6B7280] flex items-center justify-center mx-auto">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="font-handwriting font-bold text-xl text-[#23252A]">
              No Battles Recorded Yet
            </h3>
            <p className="font-mono text-xs text-[#6B7280] max-w-sm mx-auto">
              You haven't finished any notebook duels yet. Create or join a room from the Lobby to earn your place in history!
            </p>
            <div className="pt-2">
              <Link
                to="/lobby"
                className="inline-flex items-center px-4 py-2 rounded-xl font-handwriting font-bold text-sm bg-[#23252A] text-[#F8F4EB] hover:bg-[#3E424B] transition-colors shadow-sketch-sm"
              >
                Go to Lobby
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
              <motion.div
                key={m.matchId}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-sketch-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  m.isWinner
                    ? 'bg-[#FEFCE8]/80 border-[#EAB308]'
                    : 'bg-white border-[#D5CFC3]'
                }`}
              >
                {/* Result Stamp & Details */}
                <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                  {/* Ink Stamp */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-handwriting font-bold text-sm shrink-0 border-2 shadow-sketch-sm ${
                      m.isWinner
                        ? 'bg-[#FEF08A] text-[#854D0E] border-[#CA8A04] rotate-[-2deg]'
                        : 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626] rotate-[2deg]'
                    }`}
                  >
                    {m.isWinner ? 'WIN' : 'LOSS'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-handwriting font-bold text-lg sm:text-xl text-[#23252A] truncate">
                        {m.roomName || `Room ${m.roomCode}`}
                      </span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#F4EEDB] border border-[#D5CFC3] text-[#5C6069]">
                        {m.roomCode}
                      </span>
                      <span className="font-mono text-[10px] text-[#6B7280]">
                        {m.isPrivate ? 'Private' : 'Public'}
                      </span>
                    </div>

                    {/* Opponents and Metadata */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-mono text-[#6B7280]">
                      <span className="flex items-center">
                        <span className="text-[#23252A] font-semibold mr-1">Opponents:</span>
                        {m.opponents?.length > 0 ? (
                          m.opponents.map((opp, idx) => (
                            <span key={opp.playerId || idx} className="inline-flex items-center mr-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full mr-1 inline-block"
                                style={{
                                  backgroundColor:
                                    opp.primaryColor === 'RED'
                                      ? '#dc2626'
                                      : opp.primaryColor === 'GREEN'
                                      ? '#16a34a'
                                      : opp.primaryColor === 'YELLOW'
                                      ? '#ca8a04'
                                      : opp.primaryColor === 'BLACK'
                                      ? '#1f2937'
                                      : '#2563eb'
                                }}
                              />
                              {opp.nickname}
                              {idx < m.opponents.length - 1 ? ',' : ''}
                            </span>
                          ))
                        ) : (
                          <span>Solo</span>
                        )}
                      </span>

                      <span>•</span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(m.durationSeconds)}
                      </span>

                      <span>•</span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(m.completedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance summary & Inspect button */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB]">
                  <div className="flex items-center space-x-3 text-right">
                    <div>
                      <span className="block font-mono text-[10px] text-[#6B7280]">Shots</span>
                      <span className="font-handwriting font-bold text-sm text-[#23252A]">
                        {m.shotsFired ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="block font-mono text-[10px] text-[#6B7280]">KOs</span>
                      <span className="font-handwriting font-bold text-sm text-[#2563EB]">
                        {m.opponentsEliminated ?? 0}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInspectMatch(m.matchId)}
                    className="px-3 py-1.5 rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-xs font-handwriting font-bold text-[#23252A] transition-colors shadow-sketch-sm flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="font-mono text-xs text-[#6B7280]">
              Page {pagination.page} of {pagination.totalPages}
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

      {/* 4. Match Details Modal */}
      <MatchDetailsModal
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
