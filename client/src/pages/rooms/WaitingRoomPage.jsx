import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Copy,
  Check,
  Crown,
  Lock,
  Globe2,
  Users,
  BookOpen,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Play,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Clock,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotebookBackground,
  Button,
  IconButton,
  Card,
  LoadingIndicator,
  Modal
} from '../../components/ui/index.js';
import { SoundControls } from '../../components/ui/SoundControls.jsx';
import { TerritoryMiniaturePreview } from '../../components/waiting/TerritoryMiniaturePreview.jsx';
import { roomApi } from '../../services/roomApi.js';
import { getSocket } from '../../services/socket.js';
import { soundEffects } from '../../services/soundEffects.js';
import { getPlayerSession } from '../../store/playerSession.js';

export const WaitingRoomPage = () => {
  const { code: routeCode, roomId } = useParams();
  const roomCode = (routeCode || roomId || '').toUpperCase().trim();
  const navigate = useNavigate();

  const currentPlayer = getPlayerSession();

  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isReadyActionLoading, setIsReadyActionLoading] = useState(false);
  const [isStartingMatch, setIsStartingMatch] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isKicking, setIsKicking] = useState(false);
  const [notification, setNotification] = useState(null);
  const [kickedModalOpen, setKickedModalOpen] = useState(false);
  const [matchStartingBanner, setMatchStartingBanner] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const socketRef = useRef(null);

  // Helper to show temporary flash notifications
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Initial Room Fetch & Socket.IO Subscription
  useEffect(() => {
    let isMounted = true;
    const socket = getSocket();
    socketRef.current = socket;

    const initializeRoom = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch current room state via REST
        const initialData = await roomApi.getRoomByCode(roomCode);
        if (isMounted) {
          setRoom(initialData);
        }

        // Connect socket & emit room:join
        socket.emit(
          'room:join',
          {
            roomCode,
            player: {
              playerId: currentPlayer.playerId,
              nickname: currentPlayer.nickname,
              primaryColor: currentPlayer.primaryColor
            }
          },
          (res) => {
            if (isMounted && res?.success && res.room) {
              setRoom(res.room);
            } else if (isMounted && res?.success === false) {
              setError(res.message);
            }
          }
        );
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load waiting room');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeRoom();

    // Socket Event Listeners
    const handleRoomState = (updatedRoom) => {
      if (!isMounted || !updatedRoom) return;
      setRoom(updatedRoom);
    };

    const handlePlayerJoined = ({ player }) => {
      if (!isMounted) return;
      if (player?.playerId !== currentPlayer.playerId) {
        showNotification(`${player.nickname} joined the battle!`);
      }
    };

    const handlePlayerLeft = ({ playerId, room: updatedRoom }) => {
      if (!isMounted) return;
      if (updatedRoom) setRoom(updatedRoom);
      showNotification('A warrior left the waiting room.');
    };

    const handlePlayerReadyChanged = ({ playerId, isReady, room: updatedRoom }) => {
      if (!isMounted) return;
      if (updatedRoom) setRoom(updatedRoom);
    };

    const handleSettingsUpdated = ({ settings, room: updatedRoom }) => {
      if (!isMounted) return;
      if (updatedRoom) setRoom(updatedRoom);
      if (settings?.bookPageCount) {
        showNotification(`Host set Book Page Count to ${settings.bookPageCount} pages.`);
      }
    };

    const handlePlayerKicked = ({ targetPlayerId, kickedPlayer, room: updatedRoom }) => {
      if (!isMounted) return;
      if (updatedRoom) setRoom(updatedRoom);
      if (kickedPlayer) {
        showNotification(`${kickedPlayer.nickname} was removed from the room.`);
      }
    };

    const handleKicked = () => {
      if (!isMounted) return;
      setKickedModalOpen(true);
    };

    const handleMatchStarting = ({ room: startedRoom, message }) => {
      if (!isMounted) return;
      if (startedRoom) setRoom(startedRoom);
      setMatchStartingBanner(true);
      showNotification(message || 'Match starting!');
    };

    socket.on('room:state', handleRoomState);
    socket.on('ROOM_STATE', handleRoomState);
    socket.on('room:player_joined', handlePlayerJoined);
    socket.on('room:player_left', handlePlayerLeft);
    socket.on('room:player_ready_changed', handlePlayerReadyChanged);
    socket.on('room:settings_updated', handleSettingsUpdated);
    socket.on('room:player_kicked', handlePlayerKicked);
    socket.on('room:kicked', handleKicked);
    socket.on('room:match_starting', handleMatchStarting);
    socket.on('MATCH_STARTING', handleMatchStarting);

    return () => {
      isMounted = false;
      socket.off('room:state', handleRoomState);
      socket.off('ROOM_STATE', handleRoomState);
      socket.off('room:player_joined', handlePlayerJoined);
      socket.off('room:player_left', handlePlayerLeft);
      socket.off('room:player_ready_changed', handlePlayerReadyChanged);
      socket.off('room:settings_updated', handleSettingsUpdated);
      socket.off('room:player_kicked', handlePlayerKicked);
      socket.off('room:kicked', handleKicked);
      socket.off('room:match_starting', handleMatchStarting);
      socket.off('MATCH_STARTING', handleMatchStarting);
    };
  }, [roomCode, currentPlayer.playerId]);

  const handleCopyCode = () => {
    if (room?.code) {
      soundEffects.playButtonClick();
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCurrentPlayerHost = room?.hostId === currentPlayer.playerId;
  const currentParticipant = room?.players?.find((p) => p.playerId === currentPlayer.playerId);
  const isCurrentPlayerReady = currentParticipant?.isReady || false;

  // Toggle Readiness (for non-hosts)
  const handleToggleReady = async () => {
    if (isCurrentPlayerHost || isReadyActionLoading) return;
    soundEffects.playButtonClick();
    setIsReadyActionLoading(true);

    const nextReadyState = !isCurrentPlayerReady;

    try {
      // Emit via socket
      socketRef.current?.emit('room:ready', {
        roomCode: room.code,
        playerId: currentPlayer.playerId,
        isReady: nextReadyState
      });

      // REST fallback
      const result = await roomApi.setPlayerReady({
        code: room.code,
        playerId: currentPlayer.playerId,
        isReady: nextReadyState
      });

      if (result?.room) {
        setRoom(result.room);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update readiness');
    } finally {
      setIsReadyActionLoading(false);
    }
  };

  // Host updates Book Page Count (100 or 200)
  const handleUpdatePageCount = async (newPageCount) => {
    if (!isCurrentPlayerHost || isUpdatingSettings || room?.status === 'STARTING') return;
    soundEffects.playButtonClick();
    setIsUpdatingSettings(true);

    try {
      // Emit via socket
      socketRef.current?.emit('room:settings', {
        roomCode: room.code,
        hostPlayerId: currentPlayer.playerId,
        settings: { bookPageCount: newPageCount }
      });

      // REST fallback
      const updated = await roomApi.updateRoomSettings({
        code: room.code,
        hostPlayerId: currentPlayer.playerId,
        settings: { bookPageCount: newPageCount }
      });

      setRoom(updated);
      showNotification(`Book Page Count set to ${newPageCount} pages.`);
    } catch (err) {
      showNotification(err.message || 'Failed to update page count');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Host kicks a player
  const handleKickPlayer = async (targetPlayerId, targetNickname) => {
    if (!isCurrentPlayerHost || isKicking) return;
    setIsKicking(true);

    try {
      // Emit via socket
      socketRef.current?.emit('room:kick', {
        roomCode: room.code,
        hostPlayerId: currentPlayer.playerId,
        targetPlayerId
      });

      // REST fallback
      const result = await roomApi.kickPlayer({
        code: room.code,
        hostPlayerId: currentPlayer.playerId,
        targetPlayerId
      });

      if (result?.room) {
        setRoom(result.room);
      }
      showNotification(`Removed ${targetNickname} from room.`);
    } catch (err) {
      showNotification(err.message || 'Failed to kick player');
    } finally {
      setIsKicking(false);
    }
  };

  // Host starts the match
  const handleStartMatch = async () => {
    if (!isCurrentPlayerHost || isStartingMatch) return;
    soundEffects.playBookEntrance();
    setIsStartingMatch(true);

    try {
      // Emit via socket
      socketRef.current?.emit('room:start', {
        roomCode: room.code,
        hostPlayerId: currentPlayer.playerId
      });

      // REST fallback
      const started = await roomApi.startMatch({
        code: room.code,
        hostPlayerId: currentPlayer.playerId
      });

      setRoom(started);
      setMatchStartingBanner(true);
      showNotification('Match started! Preparing notebook battlefield...');
    } catch (err) {
      showNotification(err.message || 'Failed to start match');
    } finally {
      setIsStartingMatch(false);
    }
  };

  // Leave room voluntarily
  const handleConfirmLeave = async () => {
    try {
      socketRef.current?.emit('room:leave', {
        roomCode: room.code,
        playerId: currentPlayer.playerId
      });

      await roomApi.leaveRoom({
        code: room.code,
        playerId: currentPlayer.playerId
      });

      navigate('/rooms');
    } catch (err) {
      navigate('/rooms');
    }
  };

  // Conditions for Host to start match
  const playerCount = room?.players?.length || 0;
  const hasMinPlayers = playerCount >= 2;
  const nonHostPlayers = room?.players?.filter((p) => !p.isHost) || [];
  const allNonHostsReady = nonHostPlayers.length > 0 && nonHostPlayers.every((p) => p.isReady);
  const canStartMatch = isCurrentPlayerHost && hasMinPlayers && allNonHostsReady && room?.status !== 'STARTING';

  const getStartButtonDisabledTooltip = () => {
    if (!hasMinPlayers) return 'Need at least 2 warriors to start match.';
    if (!allNonHostsReady) {
      const waitingFor = nonHostPlayers
        .filter((p) => !p.isReady)
        .map((p) => p.nickname)
        .join(', ');
      return `Waiting for ${waitingFor} to click Ready.`;
    }
    return '';
  };

  if (isLoading) {
    return (
      <NotebookBackground className="py-16">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center min-h-[400px]">
          <LoadingIndicator size="lg" text="Entering Waiting Room..." />
          <p className="font-handwriting text-sm text-[#4A4F5B] mt-2">
            Sharpening pencils & allocating territory lines...
          </p>
        </div>
      </NotebookBackground>
    );
  }

  if (error || !room) {
    return (
      <NotebookBackground className="py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <Card className="p-8">
            <div className="w-12 h-12 rounded-full bg-[#FDF2F2] border border-[#CE4242]/30 flex items-center justify-center mx-auto mb-4 text-[#CE4242]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-[#242730] mb-2">
              Unable to Join Room
            </h2>
            <p className="font-mono text-sm text-[#4A4F5B] mb-6">
              {error || 'This room does not exist or has already finished.'}
            </p>
            <Button variant="primary" onClick={() => navigate('/rooms')}>
              Return to Rooms Lobby
            </Button>
          </Card>
        </div>
      </NotebookBackground>
    );
  }

  return (
    <NotebookBackground className="py-8 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#4A4F5B]/20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLeaveConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4A4F5B]/30 bg-[#FCFAF5] hover:bg-[#F4EFE6] text-xs font-mono text-[#242730] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8C929D]">
                  MULTI-WARRIOR WAITING ROOM
                </span>
                <span className="w-2 h-2 rounded-full bg-[#2E8557] animate-ping" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#242730]">
                ODD WARS — Waiting for Warriors
              </h1>
            </div>
          </div>

          {/* Quick Room Code Display & Sound Controls */}
          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
            <SoundControls />
            <div className="bg-[#FAF6EE] border-2 border-[#242730] rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xs">
              <span className="text-[11px] font-mono text-[#8C929D]">CODE:</span>
              <span className="font-mono font-bold text-lg tracking-widest text-[#242730]">
                {room.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Room Code"
                className="p-1 hover:bg-[#242730]/10 rounded transition-colors text-[#242730]"
              >
                {copied ? <Check className="w-4 h-4 text-[#2E8557]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Temporary Notification Banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-3 rounded-lg border border-[#2B68B4]/40 bg-[#F0F5FB] text-[#2B68B4] font-mono text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{notification}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-xs hover:underline"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match Starting Banner */}
        {(matchStartingBanner || room.status === 'STARTING' || room.status === 'PLAYING') && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-xl border-2 border-[#2E8557] bg-[#F0F7F3] text-center"
          >
            <div className="flex items-center justify-center gap-2 text-[#2E8557] font-display font-bold text-lg mb-1">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>MATCH STARTING! ALL WARRIORS ENGAGED!</span>
            </div>
            <p className="font-mono text-xs text-[#2E8557]/80 mb-3">
              Host has triggered the battle sequence. Territories are prepared for the notebook battlefield.
            </p>
            <Link
              to={`/rooms/${room.code}/battlefield`}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2E8557] hover:bg-[#1C5236] text-white font-mono font-bold text-sm shadow-sm transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enter Notebook Battlefield Arena</span>
            </Link>
          </motion.div>
        )}

        {/* Room Header Info Card */}
        <Card className="p-5 sm:p-6 mb-8 border-2 border-[#242730]/30 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 items-center">
            {/* Room Name & Host */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-1">
                {room.isPrivate ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF6EE] text-[#D59926] border border-[#D59926]/40">
                    <Lock className="w-3 h-3" /> PRIVATE ROOM
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FAF6EE] text-[#2E8557] border border-[#2E8557]/40">
                    <Globe2 className="w-3 h-3" /> PUBLIC ROOM
                  </span>
                )}
                <span className="text-[11px] font-mono text-[#8C929D]">
                  STATUS:{' '}
                  <strong className="text-[#242730]">
                    {room.status === 'READY'
                      ? 'ALL READY'
                      : room.status === 'STARTING'
                      ? 'STARTING'
                      : 'WAITING'}
                  </strong>
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#242730] truncate">
                {room.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[#4A4F5B]">
                <Crown className="w-3.5 h-3.5 text-[#D59926] fill-[#D59926]" />
                <span>
                  Host: <strong className="text-[#242730]">{room.hostNickname}</strong>
                </span>
              </div>
            </div>

            {/* Capacity Stats */}
            <div className="flex flex-col gap-1 border-l-0 md:border-l border-[#4A4F5B]/20 md:pl-4">
              <span className="text-[11px] font-mono text-[#8C929D] uppercase">
                WARRIORS
              </span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#242730]" />
                <span className="font-mono text-lg font-bold text-[#242730]">
                  {room.players?.length || 1} / {room.maxPlayers}
                </span>
              </div>
              <span className="text-[10px] font-handwriting text-[#4A4F5B]">
                {room.players?.length >= room.maxPlayers
                  ? 'Territory full'
                  : `Waiting for ${room.maxPlayers - (room.players?.length || 1)} more`}
              </span>
            </div>

            {/* Book Page Count & Host Setting */}
            <div className="flex flex-col gap-1 border-l-0 md:border-l border-[#4A4F5B]/20 md:pl-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#8C929D] uppercase">
                  BOOK RULESET
                </span>
                {isCurrentPlayerHost && (
                  <span className="text-[10px] font-mono text-[#D59926]">Host Editable</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#242730]" />
                <span className="font-mono text-base font-bold text-[#242730]">
                  {room.bookPageCount} Pages
                </span>
              </div>

              {/* Host Toggle for 100 / 200 Pages */}
              {isCurrentPlayerHost && room.status !== 'STARTING' ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => handleUpdatePageCount(100)}
                    disabled={isUpdatingSettings || room.bookPageCount === 100}
                    className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded border transition-colors ${
                      room.bookPageCount === 100
                        ? 'bg-[#242730] text-[#F8F4EB] border-[#242730]'
                        : 'bg-white text-[#4A4F5B] border-[#4A4F5B]/30 hover:border-[#242730]'
                    }`}
                  >
                    100p
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePageCount(200)}
                    disabled={isUpdatingSettings || room.bookPageCount === 200}
                    className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded border transition-colors ${
                      room.bookPageCount === 200
                        ? 'bg-[#242730] text-[#F8F4EB] border-[#242730]'
                        : 'bg-white text-[#4A4F5B] border-[#4A4F5B]/30 hover:border-[#242730]'
                    }`}
                  >
                    200p
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-mono text-[#8C929D]">
                  Authoritative Random Flip
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Section Heading */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#242730]" />
            <h3 className="font-display text-lg font-bold text-[#242730]">
              Battlefield Territories & Ready Status
            </h3>
          </div>
          <span className="text-xs font-handwriting text-[#4A4F5B]">
            Independent 5-Row Territories (1, 3, 5, 7, 9)
          </span>
        </div>

        {/* Miniature Territory Preview Grid */}
        <div className="mb-8">
          <TerritoryMiniaturePreview
            room={room}
            currentPlayerId={currentPlayer.playerId}
            isHost={isCurrentPlayerHost}
            onKickPlayer={handleKickPlayer}
            isKicking={isKicking}
          />
        </div>

        {/* Bottom Control & Readiness Action Bar */}
        <Card className="p-6 border-2 border-[#242730] bg-[#FAF6EE] shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Status & Instructions */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {room.status === 'READY' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2E8557]">
                    <CheckCircle2 className="w-4 h-4" /> ALL WARRIORS READY FOR WAR
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#96630D]">
                    <Clock className="w-4 h-4" /> WAITING FOR READINESS CONFIRMATION
                  </span>
                )}
              </div>

              <p className="font-mono text-xs text-[#4A4F5B]">
                {isCurrentPlayerHost ? (
                  canStartMatch ? (
                    'All requirements met! You can now start the match.'
                  ) : (
                    getStartButtonDisabledTooltip()
                  )
                ) : isCurrentPlayerReady ? (
                  "You are marked as READY. Waiting for the host to launch the match..."
                ) : (
                  'Review your territory and allocated pencil shade above, then click Ready Up.'
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Non-Host Ready Toggle */}
              {!isCurrentPlayerHost && (
                <Button
                  variant={isCurrentPlayerReady ? 'outline' : 'primary'}
                  size="lg"
                  onClick={handleToggleReady}
                  disabled={isReadyActionLoading || room.status === 'STARTING'}
                  className={`w-full sm:w-auto ${
                    isCurrentPlayerReady
                      ? 'border-[#2E8557] text-[#2E8557] hover:bg-[#F0F7F3]'
                      : 'bg-[#2E8557] hover:bg-[#1C5236] text-white border-[#1C5236]'
                  }`}
                >
                  {isReadyActionLoading ? (
                    'Updating...'
                  ) : isCurrentPlayerReady ? (
                    <span className="inline-flex items-center gap-2">
                      <Check className="w-4 h-4" /> READY (CLICK TO UNREADY)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Play className="w-4 h-4 fill-white" /> READY UP
                    </span>
                  )}
                </Button>
              )}

              {/* Host Start Match Button */}
              {isCurrentPlayerHost && (
                <div className="relative group w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartMatch}
                    disabled={!canStartMatch || isStartingMatch}
                    className={`w-full sm:w-auto ${
                      canStartMatch
                        ? 'bg-[#2E8557] hover:bg-[#1C5236] text-white border-[#1C5236]'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isStartingMatch ? (
                      'Starting Battle...'
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Play className="w-4 h-4 fill-white" /> START MATCH
                      </span>
                    )}
                  </Button>

                  {/* Tooltip explaining disabled state */}
                  {!canStartMatch && (
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-[#242730] text-[#F8F4EB] text-[11px] font-mono rounded shadow-lg z-20 text-center">
                      {getStartButtonDisabledTooltip()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Kicked by Host Modal */}
      <Modal
        isOpen={kickedModalOpen}
        onClose={() => navigate('/rooms')}
        title="Removed from Room"
      >
        <div className="p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FDF2F2] border border-[#CE4242]/30 flex items-center justify-center mx-auto mb-3 text-[#CE4242]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="font-mono text-sm text-[#4A4F5B] mb-6">
            The room host has removed you from this waiting room.
          </p>
          <Button variant="primary" onClick={() => navigate('/rooms')}>
            Return to Rooms Lobby
          </Button>
        </div>
      </Modal>

      {/* Leave Room Confirmation Modal */}
      <Modal
        isOpen={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        title="Leave Waiting Room?"
      >
        <div className="p-4">
          <p className="font-mono text-sm text-[#4A4F5B] mb-6">
            Are you sure you want to leave this room? If you are the host, host privileges will transfer to the next warrior.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setLeaveConfirmOpen(false)}>
              Stay in Room
            </Button>
            <Button
              variant="primary"
              className="bg-[#CE4242] border-[#CE4242] text-white hover:bg-[#8A1F1F]"
              onClick={handleConfirmLeave}
            >
              Leave Room
            </Button>
          </div>
        </div>
      </Modal>
    </NotebookBackground>
  );
};
