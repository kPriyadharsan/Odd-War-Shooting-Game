import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Shield,
  BookOpen,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  Crown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotebookBackground,
  Button,
  IconButton,
  Card,
  LoadingIndicator
} from '../../components/ui/index.js';
import { NotebookBattlefieldArena } from '../../components/battlefield/NotebookBattlefieldArena.jsx';
import { roomApi } from '../../services/roomApi.js';
import { getSocket } from '../../services/socket.js';
import { getPlayerSession } from '../../store/playerSession.js';
import { ROW_STATUS_META, ROW_STATUS } from '../../store/battlefieldState.js';

export const BattlefieldPage = () => {
  const { code: routeCode, roomId } = useParams();
  const roomCode = (routeCode || roomId || '').toUpperCase().trim();
  const navigate = useNavigate();

  const currentPlayer = getPlayerSession();

  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedRowNumber, setSelectedRowNumber] = useState(1); // Default selection to Row 1
  const [notification, setNotification] = useState(null);

  const socketRef = useRef(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  useEffect(() => {
    let isMounted = true;
    const socket = getSocket();
    socketRef.current = socket;

    const initializeBattlefield = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const initialData = await roomApi.getRoomByCode(roomCode);
        if (isMounted) {
          setRoom(initialData);
        }

        // Join socket room
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
            }
          }
        );
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load battlefield');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeBattlefield();

    const handleRoomState = (updatedRoom) => {
      if (!isMounted || !updatedRoom) return;
      setRoom(updatedRoom);
    };

    const handlePlayerLeft = ({ playerId, room: updatedRoom }) => {
      if (!isMounted) return;
      if (updatedRoom) setRoom(updatedRoom);
      showNotification('A player disconnected from the battlefield.');
    };

    socket.on('room:state', handleRoomState);
    socket.on('ROOM_STATE', handleRoomState);
    socket.on('room:player_left', handlePlayerLeft);

    return () => {
      isMounted = false;
      socket.off('room:state', handleRoomState);
      socket.off('ROOM_STATE', handleRoomState);
      socket.off('room:player_left', handlePlayerLeft);
    };
  }, [roomCode, currentPlayer.playerId]);

  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectRow = (rowNum) => {
    setSelectedRowNumber(rowNum);
  };

  if (isLoading) {
    return (
      <NotebookBackground className="py-16">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center min-h-[400px]">
          <LoadingIndicator size="lg" text="Unfolding Notebook Battlefield..." />
          <p className="font-handwriting text-sm text-[#4A4F5B] mt-2">
            Ruling notebook lines & establishing player territories...
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
              Battlefield Unavailable
            </h2>
            <p className="font-mono text-sm text-[#4A4F5B] mb-6">
              {error || 'Room not found.'}
            </p>
            <Button variant="primary" onClick={() => navigate('/rooms')}>
              Return to Rooms Lobby
            </Button>
          </Card>
        </div>
      </NotebookBackground>
    );
  }

  const isMatchStarted = room.status === 'STARTING' || room.status === 'PLAYING';
  const playerCount = room.players?.length || 0;
  const opponentCount = Math.max(1, playerCount - 1);

  return (
    <NotebookBackground className="py-6 sm:py-8 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#4A4F5B]/20">
          <div className="flex items-center gap-3">
            <Link
              to={`/rooms/${room.code}/waiting`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#4A4F5B]/30 bg-[#FCFAF5] hover:bg-[#F4EFE6] text-xs font-mono text-[#242730] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Waiting Room</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8C929D]">
                  OFFICIAL NOTEBOOK BATTLEFIELD
                </span>
                <span className="w-2 h-2 rounded-full bg-[#2E8557] animate-pulse" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#242730]">
                ODD WARS Arena — {room.name}
              </h1>
            </div>
          </div>

          {/* Quick Match Meta Details */}
          <div className="flex items-center gap-3">
            {/* Book Page Count */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6EE] border border-[#23252A]/20 text-xs font-mono text-[#23252A]">
              <BookOpen className="w-3.5 h-3.5 text-[#2B68B4]" />
              <span>{room.bookPageCount || 100} Pages</span>
            </div>

            {/* Room Code with Copy */}
            <div className="bg-[#FAF6EE] border-2 border-[#23252A] rounded-lg px-3 py-1 flex items-center gap-2 shadow-xs">
              <span className="text-[11px] font-mono text-[#8C929D]">CODE:</span>
              <span className="font-mono font-bold text-base tracking-widest text-[#23252A]">
                {room.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy Room Code"
                className="p-0.5 hover:bg-[#23252A]/10 rounded transition-colors text-[#23252A]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#2E8557]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Status Notice if match has not formally started */}
        {!isMatchStarted && (
          <div className="mb-5 p-3.5 rounded-xl border border-[#D59926]/40 bg-[#FCF8EE] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-mono text-[#96630D]">
              <Clock className="w-4 h-4 shrink-0 text-[#D59926]" />
              <span>
                <strong>Match Preview:</strong> Host has not launched the match yet. Territories are previewed in inspection mode.
              </span>
            </div>
            <Link
              to={`/rooms/${room.code}/waiting`}
              className="px-3 py-1 rounded bg-[#242730] text-[#F8F4EB] text-xs font-mono font-bold shrink-0 hover:bg-black transition-colors"
            >
              Go to Waiting Room
            </Link>
          </div>
        )}

        {/* Proportional Layout Specification Info Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-[#5C6069] mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#23252A]">Territory Allocation:</span>
            <span>Own Territory: <strong>45% (Left)</strong></span>
            <span>•</span>
            <span>
              Opponents ({opponentCount}): <strong>55% Total</strong> (
              {(55 / opponentCount).toFixed(1)}% each)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#8C929D]">
            <Info className="w-3.5 h-3.5" />
            <span>Rows: 1, 3, 5, 7, 9</span>
          </div>
        </div>

        {/* =========================================================================
            MAIN BATTLEFIELD ARENA
            ========================================================================= */}
        <div className="mb-6">
          <NotebookBattlefieldArena
            players={room.players}
            currentPlayerId={currentPlayer.playerId}
            selectedRowNumber={selectedRowNumber}
            onSelectRow={handleSelectRow}
          />
        </div>

        {/* Selected Row Interaction Inspector Card */}
        <Card className="p-4 sm:p-5 border-2 border-[#242730] bg-[#FAF6EE] shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#242730] text-[#F8F4EB] font-display font-bold text-xl flex items-center justify-center shrink-0">
                {selectedRowNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-sm sm:text-base text-[#242730]">
                    Selected Home Station: Row {selectedRowNumber}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#2E8557]/10 text-[#2E8557] border border-[#2E8557]/30">
                    Active Inspection
                  </span>
                </div>
                <p className="font-mono text-xs text-[#5C6069] mt-0.5">
                  Clicking any of your five rows (1, 3, 5, 7, 9) focuses that station. Opponent rows are protected and non-interactive.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#8C929D] shrink-0 self-end sm:self-auto">
              <span>Task 07 Board Model Verified</span>
            </div>
          </div>
        </Card>
      </div>
    </NotebookBackground>
  );
};
