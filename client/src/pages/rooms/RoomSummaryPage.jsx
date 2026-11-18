import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Users,
  Shield,
  ArrowLeft,
  LogOut,
  Sparkles,
  Lock,
  Globe2,
  Crown,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  NotebookBackground,
  Button,
  IconButton,
  Card,
  LoadingIndicator
} from '../../components/ui/index.js';
import { roomApi } from '../../services/roomApi.js';
import { getPlayerSession } from '../../store/playerSession.js';
import { getColorFamily } from '../../config/colors.js';

export const RoomSummaryPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const currentPlayer = getPlayerSession();

  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const fetchRoom = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await roomApi.getRoomByCode(code);
      setRoom(data);
    } catch (err) {
      setError(err.message || 'Room not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [code]);

  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await roomApi.leaveRoom({
        code: room.code,
        playerId: currentPlayer.playerId
      });
      navigate('/rooms');
    } catch (err) {
      setError(err.message || 'Failed to leave room');
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return (
      <NotebookBackground showMargin={true} className="py-20 flex items-center justify-center">
        <LoadingIndicator size="lg" label="Loading battle sheet..." />
      </NotebookBackground>
    );
  }

  if (error || !room) {
    return (
      <NotebookBackground showMargin={true} className="py-12">
        <div className="max-w-xl mx-auto px-4 pl-12 sm:pl-20">
          <Card variant="taped" padding="lg" className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#FDF2F2] border border-[#CE4242] text-[#CE4242] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
              Room Not Available
            </h2>
            <p className="text-sm text-[#5C6069] mb-6">
              {error || 'This battle room does not exist or has been cancelled.'}
            </p>
            <Link to="/rooms">
              <Button variant="primary">Return to Room Directory</Button>
            </Link>
          </Card>
        </div>
      </NotebookBackground>
    );
  }

  return (
    <NotebookBackground showMargin={true} className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pl-12 sm:pl-20">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#5C6069] hover:text-[#23252A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Room Directory</span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            icon={LogOut}
            onClick={handleLeave}
            disabled={isLeaving}
            isLoading={isLeaving}
            className="text-[#CE4242] hover:bg-[#FDF2F2]"
          >
            Leave Room
          </Button>
        </div>

        {/* Room Header Card */}
        <Card variant="default" padding="lg" className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D5CFC3]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {room.isPrivate ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#FDF2F2] text-[#CE4242] border border-[#CE4242]/30">
                    <Lock className="w-3 h-3" />
                    <span>Private Room</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F0F7F3] text-[#2E8557] border border-[#2E8557]/30">
                    <Globe2 className="w-3 h-3" />
                    <span>Public Room</span>
                  </span>
                )}
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#EFE8DA] text-[#5C6069] border border-[#D5CFC3]">
                  STATUS: {room.status}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-handwriting font-bold text-[#23252A]">
                {room.name}
              </h1>

              <p className="text-xs text-[#5C6069] mt-1 font-sans">
                Hosted by <strong className="text-[#23252A]">{room.hostNickname}</strong>
              </p>
            </div>

            {/* Room Code Display with Copy Button */}
            <div className="p-3.5 rounded-xl bg-[#FCFAF3] border-2 border-[#23252A] shadow-sketch-sm flex items-center gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E949F]">
                  ROOM CODE
                </div>
                <div className="text-2xl font-mono font-bold tracking-widest text-[#23252A]">
                  {room.code}
                </div>
              </div>

              <IconButton
                icon={copied ? Check : Copy}
                variant="secondary"
                size="sm"
                title="Copy room code"
                onClick={handleCopyCode}
                className={copied ? 'text-[#2E8557] border-[#2E8557]' : ''}
              />
            </div>
          </div>

          {/* Player Roster Section */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-handwriting font-bold text-[#23252A] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2B68B4]" />
                <span>Squad Members ({room.playerCount} / {room.maxPlayers})</span>
              </h3>

              <IconButton
                icon={RefreshCw}
                variant="ghost"
                size="sm"
                title="Refresh player list"
                onClick={fetchRoom}
              />
            </div>

            {/* 2-4 Slot Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: room.maxPlayers }).map((_, slotIdx) => {
                const playerEntry = room.players?.find((p) => p.slotIndex === slotIdx);

                if (playerEntry) {
                  const pColor = getColorFamily(playerEntry.primaryColor);
                  const isCurrent = playerEntry.playerId === currentPlayer.playerId;

                  return (
                    <div
                      key={slotIdx}
                      className={`p-4 rounded-xl border flex flex-col justify-between min-h-[120px] transition-all ${
                        isCurrent
                          ? 'border-2 border-[#23252A] bg-[#FFFDF9] shadow-sketch-sm'
                          : 'border-[#D5CFC3] bg-[#FCFAF3]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[#8E949F]">
                          SLOT {slotIdx + 1}
                        </span>
                        {playerEntry.isHost && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FCF8EE] text-[#D59926] border border-[#D59926]/40 font-bold">
                            <Crown className="w-3 h-3" />
                            <span>HOST</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2.5 my-1">
                        <div
                          className="w-7 h-7 rounded-full border border-black/20 flex items-center justify-center font-bold text-white text-xs"
                          style={{ backgroundColor: pColor.hex }}
                        >
                          {playerEntry.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="font-handwriting font-bold text-lg text-[#23252A] truncate">
                            {playerEntry.nickname}
                          </div>
                          <div className="text-[10px] font-mono text-[#5C6069]">
                            {pColor.name}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#D5CFC3]/60 text-[10px] font-mono text-right text-[#2E8557]">
                        JOINED &bull; READY
                      </div>
                    </div>
                  );
                }

                // Empty Slot Card
                return (
                  <div
                    key={slotIdx}
                    className="p-4 rounded-xl border border-dashed border-[#D5CFC3] bg-[#FCFAF3]/60 flex flex-col items-center justify-center min-h-[120px] text-center"
                  >
                    <span className="text-[10px] font-mono text-[#8E949F] mb-1">
                      SLOT {slotIdx + 1}
                    </span>
                    <span className="text-sm font-handwriting text-[#8E949F]">
                      Awaiting Warrior...
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Informational Card regarding Task 06 */}
        <Card variant="ruled" padding="md">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#2B68B4] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5C6069] font-sans space-y-1">
              <strong className="text-[#23252A] block font-semibold text-sm">
                Room Management Foundation Active (Task 05)
              </strong>
              <p>
                You are registered in this room session. Passwords are securely verified and stored via bcrypt hashes, 
                capacity limits (2–4 players) are enforced on the server, and unique room codes are collision-tested.
              </p>
              <p className="text-[11px] font-mono text-[#8E949F] pt-1">
                Real-time Socket.IO room synchronization & interactive waiting-room lobby will launch in Task 06.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </NotebookBackground>
  );
};

export default RoomSummaryPage;
