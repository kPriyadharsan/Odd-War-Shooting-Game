import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Info,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotebookBackground,
  Button,
  IconButton,
  Card,
  LoadingIndicator
} from '../../components/ui/index.js';
import { SoundControls } from '../../components/ui/SoundControls.jsx';
import { NotebookBattlefieldArena } from '../../components/battlefield/NotebookBattlefieldArena.jsx';
import { MagicalBookStage } from '../../components/book/MagicalBookStage.jsx';
import { ResultHistoryPanel } from '../../components/book/ResultHistoryPanel.jsx';
import { CharacterDrawingModal } from '../../components/drawing/CharacterDrawingModal.jsx';
import { roomApi } from '../../services/roomApi.js';
import { getSocket } from '../../services/socket.js';
import { soundEffects } from '../../services/soundEffects.js';
import { getPlayerSession } from '../../store/playerSession.js';

export const BattlefieldPage = () => {
  const { code: routeCode, roomId } = useParams();
  const roomCode = (routeCode || roomId || '').toUpperCase().trim();
  const navigate = useNavigate();

  const currentPlayer = getPlayerSession();

  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedRowNumber, setSelectedRowNumber] = useState(1);
  const [notification, setNotification] = useState(null);

  // Magical Book State (Task 08)
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastOutcome, setLastOutcome] = useState(null);
  const [bookActionLoading, setBookActionLoading] = useState(false);
  const [bookError, setBookError] = useState(null);

  // Manual Drawing Engine State (Task 09)
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [drawingRowNumber, setDrawingRowNumber] = useState(1);
  const [drawingStage, setDrawingStage] = useState('HEAD');
  const [isSubmittingDrawing, setIsSubmittingDrawing] = useState(false);
  const [drawingError, setDrawingError] = useState(null);

  const socketRef = useRef(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3800);
  };

  useEffect(() => {
    let isMounted = true;
    const socket = getSocket();
    socketRef.current = socket;

    // Play book entrance sound on battlefield load
    soundEffects.playBookEntrance();

    const initializeBattlefield = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const initialData = await roomApi.getRoomByCode(roomCode);
        if (isMounted) {
          setRoom(initialData);
          if (initialData.gameState?.lastFlip) {
            setLastOutcome(initialData.gameState.lastFlip);
          }
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
              if (res.room.gameState?.lastFlip) {
                setLastOutcome(res.room.gameState.lastFlip);
              }
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

    // Socket Event Listeners
    const handleRoomState = (updatedRoom) => {
      if (!isMounted || !updatedRoom) return;
      setRoom(updatedRoom);
      if (updatedRoom.gameState?.lastFlip) {
        setLastOutcome(updatedRoom.gameState.lastFlip);
      }
    };

    const handlePlayerLeft = ({ playerId, room: updatedRoom }) => {
      if (!isMounted) return;
      if (updatedRoom) setRoom(updatedRoom);
      showNotification('A player disconnected from the battlefield.');
    };

    // Task 08: Magical Book Socket Events
    const handleBookOpening = () => {
      if (!isMounted) return;
      setIsFlipping(true);
      setBookError(null);
    };

    const handleBookResult = ({ outcome, room: updatedRoom }) => {
      if (!isMounted) return;
      setIsFlipping(false);
      setBookActionLoading(false);
      setLastOutcome(outcome);
      if (updatedRoom) setRoom(updatedRoom);

      // If odd digit, automatically focus that row on home territory if it was your turn
      if (outcome?.isOdd && outcome?.targetRow) {
        if (outcome.playerId === currentPlayer.playerId) {
          setSelectedRowNumber(outcome.targetRow);
        }
        showNotification(
          `${outcome.nickname} drew Page ${outcome.pageNumber} → Row ${outcome.targetRow} Activated!`
        );
      } else {
        showNotification(
          `${outcome?.nickname} drew Page ${outcome?.pageNumber} → Even Digit (NO ACTION)`
        );
      }
    };

    const handleBookError = (err) => {
      if (!isMounted) return;
      setIsFlipping(false);
      setBookActionLoading(false);
      setBookError(err.message || 'Could not open book');
    };

    // Task 09: Manual Drawing Socket Events
    const handleDrawingUpdated = (data) => {
      if (!isMounted) return;
      if (data.room) setRoom(data.room);
      soundEffects.playMagicShimmer();
      showNotification(`Warrior completed ${data.stage} on Row ${data.rowNumber}!`);
    };

    const handleDrawingError = (err) => {
      if (!isMounted) return;
      setDrawingError(err.message || 'Failed to save drawing');
      setIsSubmittingDrawing(false);
    };

    socket.on('room:state', handleRoomState);
    socket.on('ROOM_STATE', handleRoomState);
    socket.on('room:player_left', handlePlayerLeft);

    // Book events
    socket.on('BOOK_OPENING', handleBookOpening);
    socket.on('book:opening', handleBookOpening);
    socket.on('BOOK_RESULT', handleBookResult);
    socket.on('book:result', handleBookResult);
    socket.on('BOOK_ERROR', handleBookError);
    socket.on('book:error', handleBookError);

    // Drawing events
    socket.on('DRAWING_UPDATED', handleDrawingUpdated);
    socket.on('drawing:updated', handleDrawingUpdated);
    socket.on('DRAWING_STAGE_COMPLETED', handleDrawingUpdated);
    socket.on('drawing:stage_completed', handleDrawingUpdated);
    socket.on('DRAWING_ERROR', handleDrawingError);
    socket.on('drawing:error', handleDrawingError);

    return () => {
      isMounted = false;
      socket.off('room:state', handleRoomState);
      socket.off('ROOM_STATE', handleRoomState);
      socket.off('room:player_left', handlePlayerLeft);
      socket.off('BOOK_OPENING', handleBookOpening);
      socket.off('book:opening', handleBookOpening);
      socket.off('BOOK_RESULT', handleBookResult);
      socket.off('book:result', handleBookResult);
      socket.off('BOOK_ERROR', handleBookError);
      socket.off('book:error', handleBookError);
      socket.off('DRAWING_UPDATED', handleDrawingUpdated);
      socket.off('drawing:updated', handleDrawingUpdated);
      socket.off('DRAWING_STAGE_COMPLETED', handleDrawingUpdated);
      socket.off('drawing:stage_completed', handleDrawingUpdated);
      socket.off('DRAWING_ERROR', handleDrawingError);
      socket.off('drawing:error', handleDrawingError);
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

  // Find home player entry
  const homePlayer = useMemo(() => {
    return room?.players?.find((p) => p.playerId === currentPlayer.playerId) || room?.players?.[0] || null;
  }, [room, currentPlayer.playerId]);

  // Find target row data
  const homeRowStates = homePlayer?.territory?.rowStates || homePlayer?.rows || [];
  const selectedRowData = homeRowStates.find((r) => r.rowNumber === selectedRowNumber) || {
    rowNumber: selectedRowNumber,
    status: 'EMPTY',
    currentStage: 'HEAD',
    drawings: {}
  };

  // Check if home player currently has an eligible row from an odd book landing
  const eligibleRowNumber = useMemo(() => {
    if (lastOutcome?.isOdd && lastOutcome?.targetRow) {
      if (lastOutcome.playerId === currentPlayer.playerId) {
        return lastOutcome.targetRow;
      }
    }
    return null;
  }, [lastOutcome, currentPlayer.playerId]);

  // Task 08: Handle OPEN THE BOOK Action
  const handleOpenBook = async () => {
    if (isFlipping || bookActionLoading) return;
    setBookActionLoading(true);
    setBookError(null);

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      // 1. Emit via Socket.IO
      socketRef.current?.emit(
        'REQUEST_BOOK_OPEN',
        {
          roomCode: room.code,
          playerId: currentPlayer.playerId,
          requestId
        },
        async (ack) => {
          if (ack && !ack.success) {
            setBookError(ack.message);
            setBookActionLoading(false);
          }
        }
      );

      // 2. REST fallback
      const result = await roomApi.openBook({
        code: room.code,
        playerId: currentPlayer.playerId,
        requestId
      });

      if (result?.outcome) {
        setLastOutcome(result.outcome);
        if (result.room) setRoom(result.room);
      }
    } catch (err) {
      setBookError(err.message || 'Failed to open book');
      setBookActionLoading(false);
      setIsFlipping(false);
    }
  };

  // Task 09: Open Drawing Modal for a Row
  const handleOpenDrawingModal = (rowNum, stageOverride = null) => {
    const targetRow = rowNum || selectedRowNumber || 1;
    const targetRowData = homeRowStates.find((r) => r.rowNumber === targetRow);
    const stage = stageOverride || targetRowData?.currentStage || 'HEAD';

    setDrawingRowNumber(targetRow);
    setDrawingStage(stage);
    setDrawingError(null);
    setIsDrawingModalOpen(true);
  };

  // Task 09: Handle Drawing Submission
  const handleSubmitDrawing = async ({ rowNumber, stage, strokeData }) => {
    setIsSubmittingDrawing(true);
    setDrawingError(null);

    try {
      // 1. Emit via Socket.IO
      socketRef.current?.emit(
        'SUBMIT_DRAWING',
        {
          roomCode: room.code,
          playerId: currentPlayer.playerId,
          rowNumber,
          stage,
          strokeData
        },
        (ack) => {
          if (ack && !ack.success) {
            setDrawingError(ack.message);
            setIsSubmittingDrawing(false);
          }
        }
      );

      // 2. REST fallback
      const result = await roomApi.submitDrawing({
        code: room.code,
        playerId: currentPlayer.playerId,
        rowNumber,
        stage,
        strokeData
      });

      if (result?.room) {
        setRoom(result.room);
      }

      soundEffects.playMagicShimmer();
      showNotification(`Successfully completed and saved ${stage} on Row ${rowNumber}!`);
      setIsDrawingModalOpen(false);
    } catch (err) {
      setDrawingError(err.message || 'Failed to submit drawing');
    } finally {
      setIsSubmittingDrawing(false);
    }
  };

  if (isLoading) {
    return (
      <NotebookBackground className="py-16">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center min-h-[400px]">
          <LoadingIndicator size="lg" text="Unfolding Notebook Battlefield..." />
          <p className="font-handwriting text-sm text-[#4A4F5B] mt-2">
            Awakening the Magical Book of Fate & establishing player territories...
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

  // Active drawings for drawing modal
  const activeModalRowData = homeRowStates.find((r) => r.rowNumber === drawingRowNumber);
  const activePreviousDrawings = activeModalRowData?.drawings || null;

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

          {/* Quick Match Meta Details & Sound Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Procedural Sound Effects Controls (Task 08) */}
            <SoundControls />

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

        {/* Temporary Notification Banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3 rounded-lg border border-[#2B68B4]/40 bg-[#F0F5FB] text-[#2B68B4] font-mono text-xs flex items-center justify-between"
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

        {/* Action Prompt Banner: When an odd row is activated for current player */}
        {eligibleRowNumber !== null && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-5 p-4 rounded-xl border-2 border-[#2E8557] bg-[#F0F7F3] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2E8557] text-white flex items-center justify-center font-display font-bold text-lg shadow-sm">
                {eligibleRowNumber}
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#1C5236] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D59926]" />
                  <span>Row {eligibleRowNumber} Action Permitted!</span>
                </h3>
                <p className="font-mono text-xs text-[#2E8557]/90 mt-0.5">
                  The Magical Book selected Row {eligibleRowNumber}. Advance your warrior by drawing your next character stage!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenDrawingModal(eligibleRowNumber)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E8557] hover:bg-[#1C5236] text-white font-mono font-bold text-xs sm:text-sm shadow-sketch transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Pencil className="w-4 h-4" />
              <span>DRAW ON ROW {eligibleRowNumber}</span>
            </button>
          </motion.div>
        )}

        {/* Status Notice if match has not formally started */}
        {!isMatchStarted && (
          <div className="mb-5 p-3.5 rounded-xl border border-[#D59926]/40 bg-[#FCF8EE] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-mono text-[#96630D]">
              <Clock className="w-4 h-4 shrink-0 text-[#D59926]" />
              <span>
                <strong>Inspection Mode:</strong> Host has not launched the match yet. The Magical Book, territories, and drawing engine are active in practice mode.
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

        {/* =========================================================================
            TASK 08: 3D MAGICAL BOOK CENTRAL STAGE
            ========================================================================= */}
        <div className="mb-8">
          <MagicalBookStage
            room={room}
            currentPlayerId={currentPlayer.playerId}
            isFlipping={isFlipping}
            lastOutcome={lastOutcome}
            onOpenBook={handleOpenBook}
            isActionLoading={bookActionLoading}
            error={bookError}
          />
        </div>

        {/* Proportional Layout Specification Info Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-[#5C6069] mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#23252A]">Battlefield Territories:</span>
            <span>Home: <strong>45% (Left)</strong></span>
            <span>•</span>
            <span>
              Opponents ({opponentCount}): <strong>55% Total</strong> (
              {(55 / opponentCount).toFixed(1)}% each)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#8C929D]">
            <Info className="w-3.5 h-3.5" />
            <span>Stages: HEAD → BODY → GUN → BULLET</span>
          </div>
        </div>

        {/* =========================================================================
            TASK 07 & 09: MAIN BATTLEFIELD ARENA WITH ACTUAL FREEHAND DRAWINGS
            ========================================================================= */}
        <div className="mb-8">
          <NotebookBattlefieldArena
            players={room.players}
            currentPlayerId={currentPlayer.playerId}
            selectedRowNumber={selectedRowNumber}
            onSelectRow={handleSelectRow}
            onOpenDrawing={handleOpenDrawingModal}
            eligibleRowNumber={eligibleRowNumber}
          />
        </div>

        {/* Bottom Section: History & Selected Row Inspector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Selected Row Interaction & Manual Drawing Trigger Card */}
          <div className="md:col-span-2">
            <Card className="p-4 sm:p-5 border-2 border-[#242730] bg-[#FAF6EE] shadow-sm h-full flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#242730] text-[#F8F4EB] font-display font-bold text-xl flex items-center justify-center shrink-0">
                    {selectedRowNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-sm sm:text-base text-[#242730]">
                        Selected Station: Row {selectedRowNumber}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#2E8557]/10 text-[#2E8557] border border-[#2E8557]/30">
                        {selectedRowData.status || 'EMPTY'}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-[#5C6069] mt-1">
                      Current Stage:{' '}
                      <strong className="text-[#242730]">
                        {selectedRowData.currentStage || 'HEAD'}
                      </strong>{' '}
                      • Bullets:{' '}
                      <strong className="text-[#242730]">
                        {selectedRowData.bulletCount || 0}/3 Loaded
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Direct Manual Draw Button for Selected Row */}
                <button
                  type="button"
                  onClick={() => handleOpenDrawingModal(selectedRowNumber, selectedRowData.currentStage)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#242730] bg-[#FCFAF5] hover:bg-[#F4EFE6] text-xs font-mono font-bold text-[#242730] shadow-xs cursor-pointer transition-colors shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>DRAW {selectedRowData.currentStage || 'HEAD'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-[#8C929D] pt-3 border-t border-[#D5CFC3] mt-3">
                <span>Task 09 Manual Drawing Engine Active</span>
                <span>Pencil, Eraser, Undo, Touch/Stylus Supported</span>
              </div>
            </Card>
          </div>

          {/* Book Result History Panel */}
          <div className="md:col-span-1">
            <ResultHistoryPanel history={room?.gameState?.history || []} />
          </div>
        </div>
      </div>

      {/* =========================================================================
          TASK 09: CHARACTER DRAWING MODAL
          ========================================================================= */}
      <CharacterDrawingModal
        isOpen={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
        rowNumber={drawingRowNumber}
        stage={drawingStage}
        previousDrawings={activePreviousDrawings}
        playerShadeHex={homePlayer?.assignedShade?.hex || '#2B68B4'}
        onSubmit={handleSubmitDrawing}
        isSubmitting={isSubmittingDrawing}
        error={drawingError}
      />
    </NotebookBackground>
  );
};
