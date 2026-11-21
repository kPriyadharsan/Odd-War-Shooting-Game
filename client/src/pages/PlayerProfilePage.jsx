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
  Award,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { getPlayerSession, syncAuthenticatedPlayer } from '../store/playerSession.js';
import { saveProfileDraft } from '../store/gameStore.js';
import { matchApi } from '../services/matchApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.jsx';
import { MatchDetailsModal } from '../components/profile/MatchDetailsModal.jsx';
import { Modal, Button, Input } from '../components/ui/index.js';
import { ScrollableDobPicker } from '../components/profile/ScrollableDobPicker.jsx';
import { ColorFamilySelector } from '../components/profile/ColorFamilySelector.jsx';
import { validateNickname, validateDob } from '../utils/validation.js';

export const PlayerProfilePage = () => {
  const session = getPlayerSession();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [matches, setMatches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNickname, setEditNickname] = useState(session.nickname || '');
  const [editColor, setEditColor] = useState(session.primaryColor || 'BLUE');
  const [editDob, setEditDob] = useState(() => {
    if (user?.dob) {
      try {
        return new Date(user.dob).toISOString().split('T')[0];
      } catch {
        return '2000-01-01';
      }
    }
    return '2000-01-01';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [copiedPlayerId, setCopiedPlayerId] = useState(false);

  const handleCopyPlayerId = () => {
    if (session.playerId) {
      navigator.clipboard.writeText(session.playerId);
      setCopiedPlayerId(true);
      setTimeout(() => setCopiedPlayerId(false), 2000);
    }
  };

  // Sync edit state whenever modal opens or user profile updates
  useEffect(() => {
    if (isEditModalOpen) {
      setEditNickname(session.nickname || '');
      setEditColor(session.primaryColor || 'BLUE');
      if (user?.dob) {
        try {
          setEditDob(new Date(user.dob).toISOString().split('T')[0]);
        } catch {
          setEditDob('2000-01-01');
        }
      }
      setEditError(null);
      setEditSuccess(false);
    }
  }, [isEditModalOpen, session.nickname, session.primaryColor, user?.dob]);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setEditError(null);

    const nickValidation = validateNickname(editNickname);
    if (!nickValidation.isValid) {
      setEditError(nickValidation.error);
      return;
    }

    const dobValidation = validateDob(editDob);
    if (!dobValidation.isValid) {
      setEditError(dobValidation.error);
      return;
    }

    setIsSaving(true);
    try {
      if (isAuthenticated) {
        const updated = await updateProfile({
          nickname: nickValidation.trimmed,
          primaryColor: editColor,
          dob: dobValidation.isoString
        });
        if (updated) {
          syncAuthenticatedPlayer(updated);
        }
      } else {
        saveProfileDraft({
          nickname: nickValidation.trimmed,
          primaryColor: editColor
        });
      }
      setEditSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess(false);
        fetchProfileData(pagination.page);
      }, 1000);
    } catch (err) {
      console.error('Failed to update profile settings:', err);
      setEditError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="min-w-0 max-w-5xl mx-auto px-3.5 xs:px-4 sm:px-6 py-5 sm:py-10 space-y-6 sm:space-y-8">
      {/* 1. Mobile Compact Player Identity Strip (< md) */}
      <section className="block md:hidden relative p-3.5 xs:p-4 rounded-2xl bg-[#FAF6EC] border-2 border-[#23252A] shadow-sketch-md overflow-hidden">
        {/* Subtle Notebook Ruling Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(to_bottom,transparent_27px,#D5CFC3_28px)] bg-[size:100%_28px]" />

        <div className="relative z-10 flex items-center justify-between gap-2.5">
          {/* Left: Avatar (52x52px) */}
          <div className="relative shrink-0">
            <div
              className="w-[52px] h-[52px] rounded-xl border-2 border-[#23252A] shadow-sketch-sm flex items-center justify-center text-white"
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
              <User className="w-6 h-6 text-white drop-shadow-md" />
            </div>
            <div className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-[#23252A] text-[#F8F4EB] uppercase">
              {session.primaryColor}
            </div>
          </div>

          {/* Center: Nickname & Player ID with Copy */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="font-handwriting font-bold text-xl text-[#23252A] truncate">
                {session.nickname}
              </h1>
              {isAuthenticated ? (
                <span
                  className="inline-flex items-center text-[10px] font-mono font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded-full border border-[#A7F3D0] shrink-0"
                  title="Google Verified Account"
                >
                  <ShieldCheck className="w-3 h-3 mr-0.5" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-mono text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 rounded-full border border-[#FDE68A] shrink-0">
                  Guest
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopyPlayerId}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6B7280] hover:text-[#23252A] transition-colors mt-0.5 group cursor-pointer text-left"
              title="Tap to copy Player ID"
            >
              <span className="truncate max-w-[130px] xs:max-w-[170px]">
                ID: {session.playerId}
              </span>
              {copiedPlayerId ? (
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-[#9CA3AF] group-hover:text-[#23252A] shrink-0" />
              )}
              {copiedPlayerId && (
                <span className="text-[10px] text-[#16A34A] font-bold shrink-0">Copied!</span>
              )}
            </button>
          </div>

          {/* Right: 44x44px Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => fetchProfileData(pagination.page)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-[#23252A] transition-colors shadow-sketch-sm flex items-center justify-center cursor-pointer"
              title="Refresh Stats"
              aria-label="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl font-handwriting font-bold bg-[#23252A] text-[#F8F4EB] hover:bg-[#3E424B] transition-colors shadow-sketch-sm flex items-center justify-center cursor-pointer"
              title="Edit Profile & Account"
              aria-label="Edit Profile & Account"
            >
              <Edit3 className="w-4 h-4 text-[#FF54A5]" />
            </button>
          </div>
        </div>

        {/* Guest Link Account Banner if unauthenticated */}
        {!isAuthenticated && (
          <div className="mt-2.5 pt-2 border-t border-[#D5CFC3]/60 relative z-10">
            <GoogleSignInButton
              returnTo="/profile"
              text="Link Google Account"
              size="sm"
              className="w-full shadow-sketch-sm text-center justify-center min-h-[44px]"
            />
          </div>
        )}
      </section>

      {/* 1. Desktop Player Identity Banner (>= md) */}
      <section className="hidden md:block relative p-6 lg:p-7 rounded-2xl bg-[#FAF6EC] border-2 border-[#23252A] shadow-sketch-md overflow-hidden">
        {/* Subtle Notebook Ruling Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(to_bottom,transparent_27px,#D5CFC3_28px)] bg-[size:100%_28px]" />

        <div className="relative z-10 flex items-center justify-between gap-5">
          <div className="flex items-center space-x-4">
            {/* 80px Color Swatch Avatar */}
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl border-2 border-[#23252A] shadow-sketch-sm flex items-center justify-center text-white"
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
                <User className="w-10 h-10 text-white drop-shadow-md" />
              </div>
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#23252A] text-[#F8F4EB] uppercase">
                {session.primaryColor}
              </div>
            </div>

            {/* Nickname, ID & Badges */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-handwriting font-bold text-3xl text-[#23252A]">
                  {session.nickname}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#EFE8DA] border border-[#D5CFC3] text-[#5C6069]">
                  Notebook Combatant
                </span>
              </div>

              {/* Player ID with copy button */}
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-[#6B7280]">
                  Player ID: <strong className="text-[#23252A] font-semibold">{session.playerId}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyPlayerId}
                  className="p-1 rounded hover:bg-[#EFE8DA] text-[#6B7280] hover:text-[#23252A] transition-colors cursor-pointer"
                  title="Copy Player ID"
                  aria-label="Copy Player ID"
                >
                  {copiedPlayerId ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {copiedPlayerId && (
                  <span className="text-[11px] font-mono text-[#16A34A] font-bold">Copied!</span>
                )}
              </div>

              {/* Verification status */}
              <div className="flex items-center gap-2 mt-2">
                {isAuthenticated ? (
                  <span className="inline-flex items-center text-xs font-mono text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Google Verified Account
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-mono text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                    Guest Session
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="flex items-center gap-2.5">
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
              className="p-2.5 rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-[#23252A] transition-colors shadow-sketch-sm cursor-pointer"
              title="Refresh Stats"
              aria-label="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-handwriting font-bold text-sm bg-[#23252A] text-[#F8F4EB] hover:bg-[#3E424B] transition-colors shadow-sketch-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-[#FF54A5]" />
              <span>Edit Profile & Account</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Career Statistics Section */}
      <section className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-handwriting font-bold text-xl sm:text-2xl text-[#23252A] flex items-center gap-1.5 sm:gap-2">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#D97706]" />
            <span>Career Record & Statistics</span>
          </h2>
          {stats?.lastMatchAt && (
            <span className="font-mono text-[11px] sm:text-xs text-[#6B7280]">
              Last match: {formatDate(stats.lastMatchAt)}
            </span>
          )}
        </div>

        {/* Mobile 4-Cell Compact Scorecard (block md:hidden) */}
        <div className="block md:hidden">
          <div className="rounded-xl border-2 border-[#23252A] bg-white shadow-sketch-sm overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-y divide-[#D5CFC3]/80">
              {/* WINS */}
              <div className="p-2.5 xs:p-3 bg-[#FEFCE8]/70 flex flex-col justify-between min-h-[52px]">
                <span className="font-mono text-[10px] text-[#854D0E] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-[#D97706] shrink-0" />
                  <span>Wins</span>
                </span>
                <span className="font-handwriting font-bold text-2xl text-[#854D0E] leading-none mt-1">
                  {stats?.wins ?? 0}
                </span>
              </div>

              {/* WIN RATE */}
              <div className="p-2.5 xs:p-3 bg-white flex flex-col justify-between min-h-[52px]">
                <span className="font-mono text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">
                  Win Rate
                </span>
                <span className="font-handwriting font-bold text-2xl text-[#2563EB] leading-none mt-1">
                  {stats?.winPercentage ?? 0}%
                </span>
              </div>

              {/* BATTLES */}
              <div className="p-2.5 xs:p-3 bg-white flex flex-col justify-between min-h-[52px]">
                <span className="font-mono text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">
                  Battles
                </span>
                <span className="font-handwriting font-bold text-2xl text-[#23252A] leading-none mt-1">
                  {stats?.matchesPlayed ?? 0}
                </span>
              </div>

              {/* STREAK */}
              <div className="p-2.5 xs:p-3 bg-[#FFF7ED]/70 flex flex-col justify-between min-h-[52px]">
                <span className="font-mono text-[10px] text-[#C2410C] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#EA580C] shrink-0" />
                  <span>Streak</span>
                </span>
                <span className="font-handwriting font-bold text-2xl text-[#EA580C] leading-none mt-1">
                  {stats?.currentStreak ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Statistics Ribbon */}
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-[#FAF6EC] border border-[#D5CFC3] text-center font-mono text-[11px] text-[#5C6069] flex items-center justify-around truncate">
            <span>
              Defeats: <strong className="text-[#DC2626]">{stats?.losses ?? 0}</strong>
            </span>
            <span className="text-[#D5CFC3]">•</span>
            <span>
              Best Streak: <strong className="text-[#23252A]">{stats?.bestStreak ?? 0}</strong>
            </span>
            <span className="text-[#D5CFC3]">•</span>
            <span>
              Knockouts: <strong className="text-[#23252A]">{stats?.opponentsEliminated ?? 0}</strong>
            </span>
          </div>
        </div>

        {/* Desktop 6-Card Grid (hidden md:grid) */}
        <div className="hidden md:grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-handwriting font-bold text-xl sm:text-2xl text-[#23252A] flex items-center gap-1.5 sm:gap-2">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB]" />
            <span>Match History & Combat Log</span>
          </h2>
          <span className="font-mono text-[11px] sm:text-xs text-[#6B7280]">
            {pagination.total} total {pagination.total === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {error && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs sm:text-sm font-mono">
            {error}
          </div>
        )}

        {/* Match Cards List */}
        {loading ? (
          <div className="p-10 sm:p-12 text-center bg-white rounded-2xl border border-[#D5CFC3] shadow-sketch-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6B7280] mb-2" />
            <p className="font-mono text-xs text-[#6B7280]">Consulting the Battle Ledger...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="p-8 sm:p-14 text-center rounded-2xl bg-[#FAF6EC] border-2 border-dashed border-[#D5CFC3] shadow-sketch-sm space-y-3">
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
          <div className="space-y-2.5 sm:space-y-3">
            {matches.map((m) => (
              <motion.div
                key={m.matchId}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className={`rounded-2xl border-2 transition-all shadow-sketch-sm overflow-hidden ${
                  m.isWinner
                    ? 'bg-[#FEFCE8]/80 border-[#EAB308]'
                    : 'bg-white border-[#D5CFC3]'
                }`}
              >
                {/* Mobile Match Card Layout (< sm) */}
                <div className="block sm:hidden p-3.5 space-y-2.5">
                  {/* Top row: Result pill + Room name + Room code + Date */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 border ${
                          m.isWinner
                            ? 'bg-[#FEF08A] text-[#854D0E] border-[#CA8A04]'
                            : 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]'
                        }`}
                      >
                        {m.isWinner ? 'WIN' : 'LOSS'}
                      </span>
                      <span className="font-handwriting font-bold text-base text-[#23252A] truncate">
                        {m.roomName || `Room ${m.roomCode}`}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#F4EEDB] border border-[#D5CFC3] text-[#5C6069] shrink-0">
                        {m.roomCode}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#6B7280] shrink-0">
                      {formatDate(m.completedAt)}
                    </span>
                  </div>

                  {/* Middle row: Duration + Mode + Opponents */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-[#6B7280] pt-1.5 border-t border-[#E5E7EB]/70">
                    <span className="inline-flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-[#4B5563]" />
                      {formatDuration(m.durationSeconds)}
                    </span>
                    <span className="text-[#D5CFC3]">•</span>
                    <span className="px-1.5 py-0.2 rounded bg-black/5 text-[#5C6069] text-[10px]">
                      {m.isPrivate ? 'Private' : 'Public'}
                    </span>
                    <span className="text-[#D5CFC3]">•</span>
                    <span className="inline-flex items-center truncate">
                      <span className="text-[#23252A] font-medium mr-1">Opponents:</span>
                      {m.opponents?.length > 0 ? (
                        m.opponents.map((opp, idx) => (
                          <span key={opp.playerId || idx} className="inline-flex items-center mr-1">
                            <span
                              className="w-2 h-2 rounded-full mr-0.5 inline-block shrink-0"
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
                            <span className="truncate max-w-[80px]">{opp.nickname}</span>
                            {idx < m.opponents.length - 1 ? ',' : ''}
                          </span>
                        ))
                      ) : (
                        <span>Solo</span>
                      )}
                    </span>
                  </div>

                  {/* Bottom row: Shots + KOs + Details button (min 44x44px) */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E7EB]/70">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span>
                        Shots: <strong className="font-handwriting font-bold text-sm text-[#23252A]">{m.shotsFired ?? 0}</strong>
                      </span>
                      <span className="text-[#D5CFC3]">•</span>
                      <span>
                        KOs: <strong className="font-handwriting font-bold text-sm text-[#2563EB]">{m.opponentsEliminated ?? 0}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInspectMatch(m.matchId)}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-xs font-handwriting font-bold text-[#23252A] transition-colors shadow-sketch-sm flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Desktop Match Card Layout (hidden sm:flex) */}
                <div className="hidden sm:flex p-5 items-center justify-between gap-4">
                  {/* Result Stamp & Details */}
                  <div className="flex items-center space-x-3.5 min-w-0">
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
                  <div className="flex items-center justify-end space-x-3 text-right shrink-0">
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
                      className="px-3.5 py-2 rounded-xl border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-xs font-handwriting font-bold text-[#23252A] transition-colors shadow-sketch-sm flex items-center gap-1 cursor-pointer"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                className="min-h-[44px] px-3 py-1.5 rounded-lg border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-xs font-mono font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="min-h-[44px] px-3 py-1.5 rounded-lg border border-[#D5CFC3] bg-white hover:bg-[#F4EEDB] text-xs font-mono font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
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

      {/* 5. Edit Profile & Account Modal with GTA 6 Pink Tone Wheel */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Configure Profile & Account"
        subtitle="Combat call-sign, character color, and date of birth"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Private Authenticated Account Details */}
          {isAuthenticated && user?.email && (
            <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-mono text-[#065F46] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669] shrink-0 bg-white px-2 py-0.5 rounded border border-[#A7F3D0]">
                Verified
              </span>
            </div>
          )}

          {editSuccess && (
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              <span>Profile & DOB updated successfully!</span>
            </div>
          )}

          {editError && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {/* Nickname Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="edit-nickname" className="text-xs uppercase tracking-wider font-semibold text-[#23252A] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#2B68B4]" />
                <span>Game Nickname</span>
              </label>
              <span className="text-[11px] font-mono text-[#8E949F]">
                {editNickname.length}/24
              </span>
            </div>
            <Input
              id="edit-nickname"
              value={editNickname}
              onFocus={(e) => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              onChange={(e) => {
                setEditNickname(e.target.value);
                setEditError(null);
              }}
              placeholder="Your combat nickname"
              maxLength={24}
            />
          </div>

          {/* Colour Field */}
          <div className="pt-2 border-t border-[#D5CFC3]">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#23252A] flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#2B68B4]" />
              <span>Character Colour</span>
            </span>
            <ColorFamilySelector
              selectedColor={editColor}
              onSelectColor={(id) => {
                setEditColor(id);
                setEditError(null);
              }}
            />
          </div>

          {/* DOB with GTA 6 Pink Tone Wheel */}
          <div className="pt-2 border-t border-[#D5CFC3]">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#23252A] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF2A85]" />
                <span>Date of Birth (DOB)</span>
              </span>
            </div>

            <ScrollableDobPicker
              value={editDob}
              onChange={(newDob) => {
                setEditDob(newDob);
                setEditError(null);
              }}
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#D5CFC3] flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <Link
              to="/profile-setup"
              className="text-xs font-handwriting text-[#2B68B4] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Full setup screen</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <div className="flex items-center gap-2 w-full xs:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
                className="flex-1 xs:flex-initial min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                className="flex-1 xs:flex-initial min-h-[44px] bg-[#23252A] text-white hover:bg-[#3E424B]"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
