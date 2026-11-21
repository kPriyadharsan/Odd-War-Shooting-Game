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
  Crown,
  Pencil,
  Volume2,
  VolumeX,
  LogOut,
  Target,
  Zap,
  Info,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LoadingIndicator,
  GameFeedbackToast,
  Button
} from '../../components/ui/index.js';
import { NotebookBattlefieldArena } from '../../components/battlefield/NotebookBattlefieldArena.jsx';
import { MagicalBookOverlay } from '../../components/book/MagicalBookOverlay.jsx';
import { CharacterDrawingModal } from '../../components/drawing/CharacterDrawingModal.jsx';
import { ShootingAnimationOverlay } from '../../components/combat/ShootingAnimationOverlay.jsx';
import { VictoryModal } from '../../components/combat/VictoryModal.jsx';
import { roomApi } from '../../services/roomApi.js';
import { getSocket } from '../../services/socket.js';
import { soundEffects } from '../../services/soundEffects.js';
import { getPlayerSession } from '../../store/playerSession.js';
import { getPaperStyle, DEFAULT_PAPER_STYLE } from '../../config/paperStyles.js';

/**
 * BattlefieldPage Component (Single Notebook Sheet Redesign)
 *
 * Implements:
 * - ONE CONTINUOUS NOTEBOOK SHEET as the entire game interface.
 * - Random notebook paper style selected authoritatively and synchronized across all players.
 * - 45% Home territory on the left, 55% Opponents territory on the right.
 * - Five playable rows: 1, 3, 5, 7, 9.
 * - Magical Book as a temporary cinematic overlay popup over the notebook sheet.
 * - Drawing popup on eligible row selection.
 * - Game controls naturally integrated into the notebook sheet margins.
 * - Authoritative multiplayer synchronization via Socket.IO.
 */
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
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Magical Book Overlay State (Part 5)
  const [isBookOverlayOpen, setIsBookOverlayOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastOutcome, setLastOutcome] = useState(null);
  const [bookActionLoading, setBookActionLoading] = useState(false);
  const [bookError, setBookError] = useState(null);

  // Manual Drawing Overlay State (Part 6)
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [drawingRowNumber, setDrawingRowNumber] = useState(1);
  const [drawingStage, setDrawingStage] = useState('HEAD');
  const [isSubmittingDrawing, setIsSubmittingDrawing] = useState(false);
  const [drawingError, setDrawingError] = useState(null);

  // Authoritative Combat Engine State
  const [selectedTarget, setSelectedTarget] = useState(null); // { playerId, rowNumber }
  const [isShootingActive, setIsShootingActive] = useState(false);
  const [isFiringShot, setIsFiringShot] = useState(false);
  const [combatError, setCombatError] = useState(null);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);

  const socketRef = useRef(null);

  const triggerToast = (toastOrMsg, fallbackType = 'INFO') => {
    if (typeof toastOrMsg === 'string') {
      setFeedbackToast({
        id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: fallbackType,
        message: toastOrMsg
      });
    } else if (toastOrMsg && typeof toastOrMsg === 'object') {
      setFeedbackToast({
        id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ...toastOrMsg
      });
    }
  };

  const showNotification = (msg, type = 'INFO') => {
    triggerToast(msg, type);
  };

  // Sound toggle helper
  const handleToggleSound = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsSoundMuted(nextMuted);
    if (!nextMuted) {
      soundEffects.playButtonClick();
    }
  };

  useEffect(() => {
    let isMounted = true;
    const socket = getSocket();
    socketRef.current = socket;

    // Play book entrance chime
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

        // Ensure match transitions to PLAYING
        socket.emit('START_PLAYING', { roomCode });
        roomApi.startPlaying({ code: roomCode }).catch(() => {});
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
      triggerToast({
        type: 'INFO',
        title: 'WARRIOR DISCONNECTED',
        message: 'A player disconnected from the notebook match.'
      });
    };

    // Magical Book Socket Events (Part 5)
    const handleBookOpening = () => {
      if (!isMounted) return;
      setIsFlipping(true);
      setIsBookOverlayOpen(true);
      setBookError(null);
      triggerToast({
        type: 'BOOK_OPENED',
        title: 'BOOK OF FATE OPENED',
        message: 'Flipping through the ruled pages...'
      });
    };

    const handleBookResult = ({ outcome, room: updatedRoom }) => {
      if (!isMounted) return;
      setIsFlipping(false);
      setBookActionLoading(false);
      setLastOutcome(outcome);
      setIsBookOverlayOpen(true); // Ensure overlay shows the result
      if (updatedRoom) setRoom(updatedRoom);

      if (outcome?.isOdd && outcome?.targetRow) {
        if (outcome.playerId === currentPlayer.playerId) {
          setSelectedRowNumber(outcome.targetRow);
        }
        triggerToast({
          type: 'ROW_UNLOCKED',
          title: `ROW ${outcome.targetRow} UNLOCKED`,
          message: `${outcome.nickname} drew Page ${outcome.pageNumber} (Ends in ${outcome.finalDigit})!`
        });
      } else {
        triggerToast({
          type: 'NO_ACTION',
          title: 'NO ACTION',
          message: `${outcome?.nickname} drew Page ${outcome?.pageNumber} (Even Digit). Turn passes.`
        });
      }
    };

    const handleBookError = (err) => {
      if (!isMounted) return;
      setIsFlipping(false);
      setBookActionLoading(false);
      setBookError(err.message || 'Could not open book');
    };

    // Drawing Socket Events (Part 6)
    const handleDrawingUpdated = (data) => {
      if (!isMounted) return;
      if (data.room) setRoom(data.room);
      soundEffects.playStageComplete();
      triggerToast({
        type: 'DRAWING_COMPLETED',
        title: 'STAGE COMPLETED',
        message: `Warrior sketched ${data.stage} on Row ${data.rowNumber}!`
      });
    };

    const handleDrawingError = (err) => {
      if (!isMounted) return;
      setDrawingError(err.message || 'Failed to save drawing');
      setIsSubmittingDrawing(false);
    };

    // Combat Socket Events
    const handleShotFired = (data) => {
      if (!isMounted) return;
      if (data.room) setRoom(data.room);
      soundEffects.playGunshot();
      setIsShootingActive(true);
      setTimeout(() => {
        soundEffects.playPencilStrike();
      }, 450);

      const shot = data.shotEvent;
      if (shot) {
        triggerToast({
          type: 'SHOT_FIRED',
          title: 'SHOT FIRED',
          message: `⚔️ ${shot.attackerNickname} fired at ${shot.targetNickname}'s Row ${shot.targetRow}!`
        });
      }
    };

    const handleRowEliminated = (data) => {
      if (!isMounted) return;
      soundEffects.playPencilStrike();
      triggerToast({
        type: 'ROW_ELIMINATED',
        title: 'ROW ELIMINATED',
        message: `💥 Row ${data.targetRow} has been crossed out with pencil strike!`
      });
    };

    const handleMatchFinished = (data) => {
      if (!isMounted) return;
      if (data.room) setRoom(data.room);
      soundEffects.playVictoryFanfare();
      setIsVictoryModalOpen(true);
      const isWinner = data.winnerId === currentPlayer.playerId;
      triggerToast({
        type: isWinner ? 'VICTORY' : 'DEFEAT',
        title: isWinner ? 'YOU WON!' : 'MATCH FINISHED',
        message: `🏆 Victory claimed by ${data.winnerNickname || 'Warrior'}!`
      });
    };

    const handleCombatError = (err) => {
      if (!isMounted) return;
      setCombatError(err.message || 'Combat action failed');
      setIsFiringShot(false);
    };

    // Turn Lifecycle Socket Events
    const handleTurnStarted = (data) => {
      if (!isMounted) return;
      if (data.room) setRoom(data.room);
      const isMyTurnNow = data.activePlayerId === currentPlayer.playerId;
      if (isMyTurnNow) {
        soundEffects.playMagicShimmer();
        triggerToast({
          type: 'YOUR_TURN',
          title: 'YOUR TURN',
          message: `Turn #${data.turnNumber}: Open the Magical Book of Fate to activate a station!`
        });
      }
    };

    const handleTurnUpdated = (data) => {
      if (!isMounted) return;
      if (data.room) setRoom(data.room);
    };

    const handleTurnCompleted = (data) => {
      if (!isMounted) return;
      if (data.room) setRoom(data.room);
    };

    const handlePlayerEliminated = (data) => {
      if (!isMounted) return;
      if (data.room) setRoom(data.room);
      soundEffects.playPlayerEliminated();
      triggerToast({
        type: 'PLAYER_ELIMINATED',
        title: 'WARRIOR ELIMINATED',
        message: `☠️ Warrior ${data.targetNickname || 'Player'} has lost all 5 stations!`
      });
    };

    socket.on('room:state', handleRoomState);
    socket.on('ROOM_STATE', handleRoomState);
    socket.on('room:player_left', handlePlayerLeft);

    socket.on('BOOK_OPENING', handleBookOpening);
    socket.on('book:opening', handleBookOpening);
    socket.on('BOOK_RESULT', handleBookResult);
    socket.on('book:result', handleBookResult);
    socket.on('BOOK_ERROR', handleBookError);
    socket.on('book:error', handleBookError);

    socket.on('DRAWING_UPDATED', handleDrawingUpdated);
    socket.on('drawing:updated', handleDrawingUpdated);
    socket.on('DRAWING_STAGE_COMPLETED', handleDrawingUpdated);
    socket.on('drawing:stage_completed', handleDrawingUpdated);
    socket.on('DRAWING_ERROR', handleDrawingError);
    socket.on('drawing:error', handleDrawingError);

    socket.on('SHOT_FIRED', handleShotFired);
    socket.on('combat:shot_fired', handleShotFired);
    socket.on('ROW_ELIMINATED', handleRowEliminated);
    socket.on('combat:row_eliminated', handleRowEliminated);
    socket.on('MATCH_FINISHED', handleMatchFinished);
    socket.on('combat:match_finished', handleMatchFinished);
    socket.on('COMBAT_ERROR', handleCombatError);
    socket.on('combat:error', handleCombatError);

    socket.on('TURN_STARTED', handleTurnStarted);
    socket.on('turn:started', handleTurnStarted);
    socket.on('TURN_UPDATED', handleTurnUpdated);
    socket.on('turn:updated', handleTurnUpdated);
    socket.on('TURN_COMPLETED', handleTurnCompleted);
    socket.on('turn:completed', handleTurnCompleted);
    socket.on('PLAYER_ELIMINATED', handlePlayerEliminated);
    socket.on('player:eliminated', handlePlayerEliminated);

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
      socket.off('SHOT_FIRED', handleShotFired);
      socket.off('combat:shot_fired', handleShotFired);
      socket.off('ROW_ELIMINATED', handleRowEliminated);
      socket.off('combat:row_eliminated', handleRowEliminated);
      socket.off('MATCH_FINISHED', handleMatchFinished);
      socket.off('combat:match_finished', handleMatchFinished);
      socket.off('COMBAT_ERROR', handleCombatError);
      socket.off('combat:error', handleCombatError);
      socket.off('TURN_STARTED', handleTurnStarted);
      socket.off('turn:started', handleTurnStarted);
      socket.off('TURN_UPDATED', handleTurnUpdated);
      socket.off('turn:updated', handleTurnUpdated);
      socket.off('TURN_COMPLETED', handleTurnCompleted);
      socket.off('turn:completed', handleTurnCompleted);
      socket.off('PLAYER_ELIMINATED', handlePlayerEliminated);
      socket.off('player:eliminated', handlePlayerEliminated);
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

  // Active player information
  const activePlayerId = room?.gameState?.activePlayerId || room?.players?.[0]?.playerId;
  const isMyTurn = activePlayerId === currentPlayer.playerId;
  const activePlayer = room?.players?.find((p) => p.playerId === activePlayerId) || {
    nickname: 'Warrior',
    assignedShade: { hex: '#2B68B4' }
  };

  const currentTurn = room?.gameState?.currentTurn || null;
  const eligibleAction = currentTurn?.eligibleAction || null;

  // Check if home player currently has an eligible row from an odd book landing
  // Survives page refreshes and socket reconnections by inspecting canonical currentTurn first
  const eligibleRowNumber = useMemo(() => {
    if (
      currentTurn?.playerId === currentPlayer.playerId &&
      room?.gameState?.turnPhase === 'AWAITING_ACTION'
    ) {
      if (currentTurn.eligibleAction?.targetRow) {
        return currentTurn.eligibleAction.targetRow;
      }
      if (currentTurn.bookOutcome?.isOdd && currentTurn.bookOutcome?.targetRow) {
        return currentTurn.bookOutcome.targetRow;
      }
    }

    if (lastOutcome?.isOdd && lastOutcome?.targetRow) {
      if (lastOutcome.playerId === currentPlayer.playerId) {
        return lastOutcome.targetRow;
      }
    }
    return null;
  }, [room?.gameState?.turnPhase, currentTurn, lastOutcome, currentPlayer.playerId]);

  const eligibleRowData = homeRowStates.find((r) => r.rowNumber === eligibleRowNumber) || null;
  const isEligibleRowArmed = Boolean(
    eligibleRowData?.drawings?.HEAD &&
      eligibleRowData?.drawings?.BODY &&
      eligibleRowData?.drawings?.GUN &&
      eligibleRowData?.bulletCount > 0 &&
      !eligibleRowData?.isEliminated
  );

  const canAttackOpponents = Boolean(
    isMyTurn &&
      room?.status === 'PLAYING' &&
      room?.gameState?.turnPhase === 'AWAITING_ACTION' &&
      (eligibleAction?.canAttack || isEligibleRowArmed || (selectedRowData?.bulletCount > 0 && selectedRowNumber === eligibleRowNumber))
  );

  // Part 2: Selected Paper Style (Server-authoritative & synchronized)
  const paperStyleId = room?.gameState?.paperStyle || room?.paperStyle || DEFAULT_PAPER_STYLE;
  const paperStyleConfig = getPaperStyle(paperStyleId);

  // Part 5: Handle OPEN THE BOOK Action (Overlay popup)
  const handleOpenBook = async () => {
    if (isFlipping || bookActionLoading) return;
    setBookActionLoading(true);
    setBookError(null);
    setIsBookOverlayOpen(true);

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

  // Part 6: Open Drawing Popup for an Eligible Row
  const handleOpenDrawingModal = (rowNum, stageOverride = null) => {
    const targetRow = rowNum || eligibleRowNumber || selectedRowNumber || 1;
    const targetRowData = homeRowStates.find((r) => r.rowNumber === targetRow);
    const stage = stageOverride || targetRowData?.currentStage || 'HEAD';

    setDrawingRowNumber(targetRow);
    setDrawingStage(stage);
    setDrawingError(null);
    setIsDrawingModalOpen(true);
  };

  // Part 6: Handle Drawing Submission
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
      showNotification(`Saved ${stage} on Row ${rowNumber}!`);
      setIsDrawingModalOpen(false);
    } catch (err) {
      setDrawingError(err.message || 'Failed to submit drawing');
    } finally {
      setIsSubmittingDrawing(false);
    }
  };

  // Combat Target Selection
  const handleSelectTarget = (targetPlayerId, targetRowNumber) => {
    if (targetPlayerId === currentPlayer.playerId) {
      setCombatError('Friendly fire blocked! You cannot attack your own territory.');
      return;
    }

    const targetPlayer = room?.players?.find((p) => p.playerId === targetPlayerId);
    if (!targetPlayer) return;
    if (targetPlayer.isEliminated) {
      setCombatError(`${targetPlayer.nickname} is already eliminated!`);
      return;
    }

    const targetRow = targetPlayer.territory?.rowStates?.find((r) => r.rowNumber === targetRowNumber);
    if (targetRow?.isEliminated) {
      setCombatError(`Row ${targetRowNumber} is already eliminated! Choose an active station.`);
      return;
    }

    setCombatError(null);
    setSelectedTarget({ playerId: targetPlayerId, rowNumber: targetRowNumber });
    soundEffects.playPencilStrike();

    socketRef.current?.emit(
      'SELECT_TARGET',
      {
        roomCode: room.code,
        playerId: currentPlayer.playerId,
        attackerRow: selectedRowNumber,
        targetPlayerId,
        targetRow: targetRowNumber
      },
      (ack) => {
        if (ack && !ack.success) {
          setCombatError(ack.message);
        }
      }
    );
  };

  const handleClearTarget = () => {
    setSelectedTarget(null);
    setCombatError(null);
  };

  // Combat Execution
  const handleFireShot = async () => {
    if (!selectedTarget || isFiringShot) return;
    setIsFiringShot(true);
    setCombatError(null);

    const actionId = `shot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const firingRow = eligibleRowNumber || selectedRowNumber || 1;

    try {
      soundEffects.playGunshot();
      setIsShootingActive(true);

      socketRef.current?.emit(
        'FIRE_SHOT',
        {
          roomCode: room.code,
          playerId: currentPlayer.playerId,
          attackerRow: firingRow,
          targetPlayerId: selectedTarget.playerId,
          targetRow: selectedTarget.rowNumber,
          actionId
        },
        async (ack) => {
          if (ack && !ack.success) {
            setCombatError(ack.message);
            setIsFiringShot(false);
          }
        }
      );

      const result = await roomApi.fireCombatShot({
        code: room.code,
        playerId: currentPlayer.playerId,
        attackerRow: firingRow,
        targetPlayerId: selectedTarget.playerId,
        targetRow: selectedTarget.rowNumber,
        actionId
      });

      if (result?.room) {
        setRoom(result.room);
        if (result.room.status === 'FINISHED' || result.shotEvent?.matchFinished) {
          setIsVictoryModalOpen(true);
        }
      }

      setSelectedTarget(null);
    } catch (err) {
      setCombatError(err.message || 'Combat shot failed');
    } finally {
      setIsFiringShot(false);
    }
  };

  // Pass Turn
  const handlePassTurn = async () => {
    try {
      socketRef.current?.emit('PASS_TURN', {
        roomCode: room.code,
        playerId: currentPlayer.playerId
      });
      await roomApi.passTurn({
        code: room.code,
        playerId: currentPlayer.playerId
      });
      soundEffects.playPencilStrike();
      showNotification('You passed your turn.');
    } catch (err) {
      showNotification(err.message || 'Failed to pass turn');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#23201C] p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#FAF6EE] border-2 border-[#242730] shadow-2xl text-center paper-style-classic-blue">
          <LoadingIndicator size="lg" text="Unfolding Notebook Sheet..." />
          <p className="font-handwriting text-sm text-[#4A4F5B] mt-2">
            Sharpening pencils & establishing player territory columns...
          </p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#23201C] p-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#FAF6EE] border-2 border-[#242730] shadow-2xl text-center paper-style-classic-blue">
          <div className="w-12 h-12 rounded-full bg-[#FDF2F2] border border-[#CE4242]/30 flex items-center justify-center mx-auto mb-4 text-[#CE4242]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#242730] mb-2">
            Notebook Arena Unavailable
          </h2>
          <p className="font-mono text-sm text-[#4A4F5B] mb-6">
            {error || 'Match room not found.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/lobby')}>
            Return to Game Lobby
          </Button>
        </div>
      </div>
    );
  }

  // Active drawings for drawing modal
  const activeModalRowData = homeRowStates.find((r) => r.rowNumber === drawingRowNumber);
  const activePreviousDrawings = activeModalRowData?.drawings || null;

  // Combat check
  const targetOpponent = room.players?.find((p) => p.playerId === selectedTarget?.playerId) || null;
  const isAttackerArmed = Boolean(
    selectedRowData?.drawings?.HEAD &&
      selectedRowData?.drawings?.BODY &&
      selectedRowData?.drawings?.GUN &&
      selectedRowData?.bulletCount > 0 &&
      !selectedRowData?.isEliminated
  );
  const totalShotsFired = room.gameState?.combatLog?.length || 0;
  const winnerNickname =
    room.gameState?.winnerNickname ||
    (room.status === 'FINISHED' ? room.players?.find((p) => !p.isEliminated)?.nickname : '');
  const isCurrentUserWinner = Boolean(
    room.gameState?.winnerId === currentPlayer.playerId ||
      (room.status === 'FINISHED' && homePlayer && !homePlayer.isEliminated)
  );

  const turnNumber = room.gameState?.turnNumber || 1;
  const isAwaitingBook = isMyTurn && room.status === 'PLAYING' && room.gameState?.turnPhase === 'AWAITING_BOOK';

  return (
    // Outer desk container (Desktop: warm study desk backdrop; Mobile: full-bleed sheet)
    <div className="min-h-screen min-h-dvh w-full bg-[#201D1A] sm:py-4 md:py-6 sm:px-4 md:px-8 flex flex-col items-center justify-start overflow-x-hidden">
      {/* =========================================================================
          PART 1 & PART 2: THE SINGLE CONTINUOUS NOTEBOOK SHEET
          The sheet ITSELF is the entire game interface.
          ========================================================================= */}
      <div
        className={`w-full max-w-6xl min-h-[calc(100vh-2rem)] min-h-[calc(100dvh-2rem)] rounded-none sm:rounded-2xl md:rounded-3xl border-0 sm:border-2 sm:border-[#242730] relative overflow-hidden flex flex-col notebook-sheet-shadow notebook-inner-sheet transition-colors duration-300 ${paperStyleConfig.className}`}
        style={{
          backgroundColor: paperStyleConfig.bgHex
        }}
      >
        {/* Binder Perforations / Spiral Holes at the very top */}
        <div className="w-full h-3.5 opacity-35 notebook-binder-holes shrink-0 select-none hidden sm:block" />

        {/* =========================================================================
            PART 7: GAME CONTROLS INTEGRATED NATURALLY INTO NOTEBOOK SHEET MARGINS
            No external dashboard - cleanly stamped into the notebook sheet header.
            ========================================================================= */}
        <header className="px-3 sm:px-6 pt-2 pb-2.5 border-b-2 border-[#242730] shrink-0 select-none">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Top-Left: Notebook Sheet Title & Paper Style Watermark */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E8557] animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display font-black text-sm sm:text-base text-[#23252A] tracking-tight truncate">
                    ODD WAR • {room.name}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#5C6069]">
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    Sheet: <strong>{paperStyleConfig.name}</strong>
                  </span>
                  <span>•</span>
                  <span>{room.bookPageCount || 100} Pages</span>
                </div>
              </div>
            </div>

            {/* Top-Center: Authoritative Turn Stamp & Prominent Action Trigger */}
            <div className="flex items-center gap-2 order-3 sm:order-2 w-full sm:w-auto justify-between sm:justify-center">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 font-mono text-xs font-black shadow-xs shrink-0 ${
                  isMyTurn
                    ? 'bg-[#2E8557] border-[#242730] text-white animate-pulse'
                    : 'bg-black/5 border-[#242730]/30 text-[#4A4F5B]'
                }`}
              >
                <span>TURN #{turnNumber}</span>
                <span>•</span>
                <span>{isMyTurn ? 'YOUR TURN' : `${activePlayer.nickname}'s Turn`}</span>
              </div>

              {/* ACTION BUTTON: OPEN BOOK (Visible when it's your turn to flip) */}
              {isAwaitingBook && (
                <button
                  type="button"
                  onClick={handleOpenBook}
                  disabled={bookActionLoading || isFlipping}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-[#D59926] hover:bg-[#B8811B] text-[#242730] font-mono font-black text-xs shadow-sketch cursor-pointer active:scale-95 transition-all border border-[#242730]"
                >
                  <Sparkles className="w-4 h-4 text-[#242730]" />
                  <span>OPEN MAGICAL BOOK</span>
                </button>
              )}

              {/* ACTION BUTTON: DRAW ON ROW (Visible if odd row eligible) */}
              {isMyTurn && eligibleRowNumber !== null && (
                <div className="flex items-center gap-1.5">
                  {canAttackOpponents && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#CE4242]/10 border border-[#CE4242]/30 text-[10px] font-mono text-[#CE4242] font-bold animate-pulse">
                      <Target className="w-3 h-3 text-[#CE4242]" />
                      Tap opponent row to attack
                    </span>
                  )}
                  {(!eligibleAction || eligibleAction.type !== 'ATTACK') && (
                    <button
                      type="button"
                      onClick={() => handleOpenDrawingModal(eligibleRowNumber)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-[#2E8557] hover:bg-[#1C5236] text-white font-mono font-black text-xs shadow-sketch cursor-pointer active:scale-95 transition-all border border-[#242730]"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>
                        {eligibleAction?.type === 'CHOICE_LOAD_OR_ATTACK'
                          ? `LOAD BULLET ON ROW ${eligibleRowNumber}`
                          : `DRAW ON ROW ${eligibleRowNumber}`}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Top-Right: Ink Library Stamp Code, Sound Toggle & Leave Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 order-2 sm:order-3 shrink-0">
              {/* Library Stamped Room Code */}
              <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded border border-[#242730]/40 bg-black/5 font-mono text-xs text-[#242730]">
                <span className="text-[10px] text-[#5C6069] hidden xs:inline">CODE:</span>
                <span className="font-bold tracking-wider">{room.code}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  title="Copy code"
                  className="p-1 hover:bg-black/10 rounded transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#2E8557]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Procedural Sound Effects Toggle */}
              <button
                type="button"
                onClick={handleToggleSound}
                title={isSoundMuted ? 'Unmute game sounds' : 'Mute game sounds'}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded border border-[#242730]/40 bg-black/5 hover:bg-black/10 text-[#242730] transition-colors cursor-pointer"
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4 text-[#CE4242]" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Leave Match Button (Prompts confirmation) */}
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(true)}
                title="Leave match"
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded border border-[#242730]/40 bg-black/5 hover:bg-[#FDF2F2] hover:text-[#CE4242] text-[#5C6069] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* =========================================================================
            COMBAT AIMING STRIP: Appears seamlessly when targeting an opponent row
            ========================================================================= */}
        {selectedTarget && targetOpponent && (
          <div className="px-3 sm:px-6 py-2 bg-[#FFF3F3] border-b-2 border-[#CE4242] flex items-center justify-between gap-3 text-xs font-mono shrink-0 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#CE4242] animate-ping" />
              <span className="text-[#CE4242] font-bold uppercase">TARGET ACQUIRED:</span>
              <span className="font-display font-black text-[#242730] truncate">
                {targetOpponent.nickname} — Row {selectedTarget.rowNumber}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearTarget}
                className="px-2.5 py-1 rounded border border-[#D5CFC3] hover:bg-white text-[#5C6069] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFireShot}
                disabled={isFiringShot}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#CE4242] hover:bg-[#B03535] text-white font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isFiringShot ? 'FIRING...' : 'FIRE SHOT!'}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            PART 3 & PART 4: THE NOTEBOOK BATTLEFIELD ARENA
            Continuous vertical columns with 45% (Home on Left) and 55% (Opponents on Right).
            ========================================================================= */}
        <main className="flex-1 p-2 sm:p-4 md:p-6 flex flex-col min-h-0">
          <NotebookBattlefieldArena
            players={room.players}
            currentPlayerId={currentPlayer.playerId}
            selectedRowNumber={selectedRowNumber}
            onSelectRow={handleSelectRow}
            onOpenDrawing={handleOpenDrawingModal}
            eligibleRowNumber={eligibleRowNumber}
            isTargetableOpponent={canAttackOpponents}
            selectedTarget={selectedTarget}
            onSelectTarget={handleSelectTarget}
          />
        </main>

        {/* =========================================================================
            BOTTOM MARGIN: QUICK TICKER & NOTEBOOK INSCRIPTION FOOTER
            ========================================================================= */}
        <footer className="px-3 sm:px-6 py-2 border-t border-[#242730]/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#5C6069] shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#23252A]">Notebook Rules:</span>
            <span>Head → Body → Gun → Bullet (3 Bullets = Armed)</span>
          </div>

          {/* Pass turn option if active and waiting */}
          {isMyTurn && room.status === 'PLAYING' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePassTurn}
                className="text-[#8C929D] hover:text-[#242730] underline cursor-pointer"
              >
                Pass Turn
              </button>
            </div>
          )}
        </footer>
      </div>

      {/* =========================================================================
          PART 5: CINEMATIC MAGICAL BOOK POPUP OVERLAY OVER THE SAME NOTEBOOK SHEET
          ========================================================================= */}
      <MagicalBookOverlay
        isOpen={isBookOverlayOpen}
        isFlipping={isFlipping}
        outcome={lastOutcome}
        bookPageCount={room.bookPageCount || 100}
        activePlayerNickname={activePlayer?.nickname}
        isCurrentPlayer={isMyTurn}
        onClose={() => setIsBookOverlayOpen(false)}
      />

      {/* =========================================================================
          PART 6: DRAWING POPUP OVERLAY (STYLED AS AN OVERLAPPING NOTEBOOK PAPER)
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

      {/* 2D Shooting Projectile Animation Overlay across notebook sheet */}
      <ShootingAnimationOverlay
        isActive={isShootingActive}
        onAnimationComplete={() => setIsShootingActive(false)}
      />

      {/* Victory Celebration Modal */}
      <VictoryModal
        isOpen={isVictoryModalOpen || room.status === 'FINISHED'}
        winnerNickname={winnerNickname}
        winnerId={room?.gameState?.winnerId}
        isCurrentUserWinner={isCurrentUserWinner}
        totalShotsFired={totalShotsFired}
        onPlayAgain={() => navigate(`/rooms/${room.code}/waiting`)}
        onReturnToLobby={() => navigate('/lobby')}
      />

      {/* Toast notifications */}
      <AnimatePresence>
        {feedbackToast && (
          <GameFeedbackToast
            toast={feedbackToast}
            onDismiss={() => setFeedbackToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Leave match confirmation modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl border-2 border-[#242730] bg-[#FAF6EE] p-5 shadow-2xl text-center paper-style-classic-blue"
          >
            <h3 className="font-display font-bold text-lg text-[#23252A] mb-2">
              Leave Notebook Match?
            </h3>
            <p className="font-mono text-xs text-[#5C6069] mb-5">
              Returning to the lobby will disconnect your pencil warrior from this sheet.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Keep Playing
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  navigate('/lobby');
                }}
                className="bg-[#CE4242] hover:bg-[#B03535] text-white"
              >
                Leave Match
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
