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
  AlertCircle,
  BookOpen,
  Sliders,
  Layers
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
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);

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

  const isCurrentPlayerHost = room?.hostId === currentPlayer.playerId;

  const handleUpdatePageCount = async (newPageCount) => {
    if (!isCurrentPlayerHost || isUpdatingSettings) return;
    setIsUpdatingSettings(true);
    setSettingsMessage(null);
    try {
      const updated = await roomApi.updateRoomSettings({
        code: room.code,
        hostPlayerId: currentPlayer.playerId,
        settings: { bookPageCount: newPageCount }
      });
      setRoom(updated);
      setSettingsMessage(`Book page count updated to ${newPageCount} pages.`);
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleUpdateCapacity = async (newCapacity) => {
    if (!isCurrentPlayerHost || isUpdatingSettings) return;
    setIsUpdatingSettings(true);
    setSettingsMessage(null);
    try {
      const updated = await roomApi.updateRoomSettings({
        code: room.code,
        hostPlayerId: currentPlayer.playerId,
        settings: { maxPlayers: newCapacity }
      });
      setRoom(updated);
      setSettingsMessage(`Room capacity set to ${newCapacity} players.`);
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update capacity');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  if (isLoading) {
    return (
      <NotebookBackground showMargin={true} className="py-20 flex items-center justify-center">
        <LoadingIndicator size="lg" label="Loading battle sheet..." />
      </NotebookBackground>
    );
  }

  if (error && !room) {
    return (
      <NotebookBackground showMargin={true} className="py-6 sm:py-12">
        <div className="max-w-xl mx-auto pl-9 sm:pl-16 md:pl-20 pr-3 sm:pr-8">
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
    <NotebookBackground showMargin={true} className="py-4 sm:py-12">
      <div className="max-w-4xl mx-auto pl-9 sm:pl-16 md:pl-20 pr-3 sm:pr-8">
        
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
              {/* Type and Status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {room.isPrivate ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#FDF2F2] text-[#CE4242] border border-[#CE4242]/30 font-semibold">
                    <Lock className="w-3 h-3" />
                    <span>Private Room</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F0F7F3] text-[#2E8557] border border-[#2E8557]/30 font-semibold">
                    <Globe2 className="w-3 h-3" />
                    <span>Public Room</span>
                  </span>
                )}

                {/* Book Page Count Badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#FCFAF3] text-[#2B68B4] border border-[#2B68B4]/40 font-bold">
                  <BookOpen className="w-3 h-3" />
                  <span>{room.bookPageCount || 100} Pages</span>
                </span>

                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#EFE8DA] text-[#5C6069] border border-[#D5CFC3]">
                  STATUS: {room.status}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-handwriting font-bold text-[#23252A]">
                {room.name}
              </h1>

              <div className="flex items-center gap-2 text-xs text-[#5C6069] mt-1 font-sans">
                <Crown className="w-3.5 h-3.5 text-[#D59926]" />
                <span>
                  Host Commander: <strong className="text-[#23252A]">{room.hostNickname}</strong>
                  {isCurrentPlayerHost && ' (You)'}
                </span>
              </div>
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

          {/* Direct link to live waiting room */}
          <div className="mb-4">
            <Link
              to={`/rooms/${room.code}/waiting`}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2E8557] hover:bg-[#1C5236] text-white font-mono font-bold text-sm shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enter Multiplayer Waiting Room</span>
            </Link>
          </div>

          {/* Host Settings Controls (Only editable by Host in WAITING state) */}
          <div className="py-4 border-b border-[#D5CFC3] bg-[#FCFAF3]/50 rounded-xl px-4 my-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <span className="text-xs font-mono font-semibold uppercase text-[#5C6069] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#2B68B4]" />
                <span>Notebook Game Configuration {isCurrentPlayerHost ? '(Host Controls)' : '(Configured by Host)'}</span>
              </span>

              {settingsMessage && (
                <span className="text-xs font-mono text-[#2E8557] animate-pulse">
                  {settingsMessage}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Setting 1: Book Page Count (100 vs 200) */}
              <div className="p-3 rounded-lg bg-[#FFFDF9] border border-[#D5CFC3] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#23252A] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#2B68B4]" />
                    <span>Book Page Count</span>
                  </div>
                  <div className="text-[11px] text-[#5C6069] mt-0.5">
                    Server random flips {room.bookPageCount || 100} pages
                  </div>
                </div>

                {isCurrentPlayerHost && room.status === 'WAITING' ? (
                  <div className="flex items-center gap-1 bg-[#EFE8DA] p-1 rounded-lg border border-[#D5CFC3]">
                    <button
                      type="button"
                      disabled={isUpdatingSettings}
                      onClick={() => handleUpdatePageCount(100)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                        (room.bookPageCount || 100) === 100
                          ? 'bg-[#23252A] text-white shadow-sm'
                          : 'text-[#5C6069] hover:text-[#23252A]'
                      }`}
                    >
                      100p
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingSettings}
                      onClick={() => handleUpdatePageCount(200)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                        room.bookPageCount === 200
                          ? 'bg-[#23252A] text-white shadow-sm'
                          : 'text-[#5C6069] hover:text-[#23252A]'
                      }`}
                    >
                      200p
                    </button>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-sm text-[#23252A] bg-[#EFE8DA] px-2.5 py-1 rounded border border-[#D5CFC3]">
                    {room.bookPageCount || 100} Pages
                  </span>
                )}
              </div>

              {/* Setting 2: Player Capacity (2, 3, 4) */}
              <div className="p-3 rounded-lg bg-[#FFFDF9] border border-[#D5CFC3] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#23252A] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#2E8557]" />
                    <span>Player Capacity</span>
                  </div>
                  <div className="text-[11px] text-[#5C6069] mt-0.5">
                    {room.playerCount} / {room.maxPlayers} slots filled
                  </div>
                </div>

                {isCurrentPlayerHost && room.status === 'WAITING' ? (
                  <div className="flex items-center gap-1 bg-[#EFE8DA] p-1 rounded-lg border border-[#D5CFC3]">
                    {[2, 3, 4].map((cap) => {
                      const isDisabled = cap < room.playerCount || isUpdatingSettings;
                      return (
                        <button
                          key={cap}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleUpdateCapacity(cap)}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                            room.maxPlayers === cap
                              ? 'bg-[#23252A] text-white shadow-sm'
                              : isDisabled
                              ? 'text-[#8E949F] opacity-40 cursor-not-allowed'
                              : 'text-[#5C6069] hover:text-[#23252A]'
                          }`}
                          title={cap < room.playerCount ? `Cannot reduce below current count (${room.playerCount})` : `Set capacity to ${cap}`}
                        >
                          {cap}P
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="font-mono font-bold text-sm text-[#23252A] bg-[#EFE8DA] px-2.5 py-1 rounded border border-[#D5CFC3]">
                    {room.maxPlayers} Players
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Player Roster & Independent Territory Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-handwriting font-bold text-[#23252A] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#2B68B4]" />
                  <span>Squad Territories ({room.playerCount} / {room.maxPlayers})</span>
                </h3>
                <p className="text-xs text-[#5C6069] font-sans">
                  Each warrior owns 1 independent vertical territory with rows 1, 3, 5, 7, 9.
                </p>
              </div>

              <IconButton
                icon={RefreshCw}
                variant="ghost"
                size="sm"
                title="Refresh player list"
                onClick={fetchRoom}
              />
            </div>

            {/* 2-4 Slot Grid with Independent Territories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: room.maxPlayers }).map((_, slotIdx) => {
                const playerEntry = room.players?.find((p) => p.slotIndex === slotIdx);

                if (playerEntry) {
                  const pColor = getColorFamily(playerEntry.primaryColor);
                  const isCurrent = playerEntry.playerId === currentPlayer.playerId;

                  return (
                    <div
                      key={slotIdx}
                      className={`p-4 rounded-xl border flex flex-col justify-between min-h-[145px] transition-all ${
                        isCurrent
                          ? 'border-2 border-[#23252A] bg-[#FFFDF9] shadow-sketch-sm'
                          : 'border-[#D5CFC3] bg-[#FCFAF3]'
                      }`}
                    >
                      <div>
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
                      </div>

                      {/* Independent Vertical Territory Indicator */}
                      <div className="pt-2 border-t border-[#D5CFC3]/60">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="text-[#5C6069] flex items-center gap-1">
                            <Layers className="w-3 h-3 text-[#2B68B4]" />
                            <span>Territory #{slotIdx + 1}</span>
                          </span>
                          <span className="text-[#2E8557] font-bold">READY</span>
                        </div>
                        <div className="text-[9px] font-mono text-[#8E949F] bg-[#EFE8DA]/60 px-1.5 py-0.5 rounded text-center">
                          Rows: 1, 3, 5, 7, 9
                        </div>
                      </div>
                    </div>
                  );
                }

                // Empty Slot Card
                return (
                  <div
                    key={slotIdx}
                    className="p-4 rounded-xl border border-dashed border-[#D5CFC3] bg-[#FCFAF3]/60 flex flex-col items-center justify-center min-h-[145px] text-center"
                  >
                    <span className="text-[10px] font-mono text-[#8E949F] mb-1">
                      SLOT {slotIdx + 1}
                    </span>
                    <span className="text-sm font-handwriting text-[#8E949F]">
                      Awaiting Warrior...
                    </span>
                    <span className="text-[9px] font-mono text-[#8E949F] mt-2 bg-[#EFE8DA]/40 px-2 py-0.5 rounded">
                      Territory #{slotIdx + 1} Unassigned
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Future Book Engine & Board Compatibility Note */}
        <Card variant="ruled" padding="md">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#2B68B4] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5C6069] font-sans space-y-1">
              <strong className="text-[#23252A] block font-semibold text-sm">
                Notebook Game Configuration & Compatibility Ready
              </strong>
              <p>
                <strong>Host Settings:</strong> Book page count ({room.bookPageCount || 100} pages) and player capacity ({room.maxPlayers} players) are verified and validated on the server.
              </p>
              <p>
                <strong>Board Engine Compatibility:</strong> Each player is allocated an independent vertical territory with rows 1, 3, 5, 7, 9.
              </p>
              <p>
                <strong>Book Engine Compatibility:</strong> The server-authoritative Book Engine is initialized to generate random pages [1..{room.bookPageCount || 100}] and map odd final digits to rows 1, 3, 5, 7, 9.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </NotebookBackground>
  );
};

export default RoomSummaryPage;
