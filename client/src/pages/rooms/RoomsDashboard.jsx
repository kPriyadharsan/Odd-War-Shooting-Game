import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe2,
  PlusCircle,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  BookOpen,
  RefreshCw,
  LogIn,
  AlertCircle,
  KeyRound,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  NotebookBackground,
  Button,
  Card,
  Input
} from '../../components/ui/index.js';
import { getPlayerSession } from '../../store/playerSession.js';
import { getColorFamily } from '../../config/colors.js';
import { roomApi } from '../../services/roomApi.js';
import { soundEffects } from '../../services/soundEffects.js';

export const RoomsDashboard = () => {
  const navigate = useNavigate();
  const player = getPlayerSession();
  const color = getColorFamily(player.primaryColor);

  const [directCode, setDirectCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  // Fetch real public rooms from backend with error handling
  const loadPublicRooms = async () => {
    setIsLoadingRooms(true);
    setRoomsError(null);
    try {
      const rooms = await roomApi.listPublicRooms();
      setPublicRooms(Array.isArray(rooms) ? rooms : []);
    } catch (err) {
      setRoomsError(err.message || 'Unable to connect to game room directory');
      setPublicRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadPublicRooms();
  }, []);

  // Quick join via direct code with optional password support
  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    setCodeError(null);
    const clean = directCode.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      setCodeError('Enter a valid room code (at least 4 characters).');
      return;
    }

    // If password toggle is open and password entered, authenticate join via roomApi first
    if (showPasswordInput && password.trim()) {
      setIsJoining(true);
      try {
        const room = await roomApi.joinRoom({
          code: clean,
          password: password.trim(),
          player
        });
        soundEffects.playButtonClick();
        navigate(`/rooms/${room.code}/waiting`);
      } catch (err) {
        setCodeError(err.message || 'Incorrect room password or room full.');
        setIsJoining(false);
      }
    } else {
      soundEffects.playButtonClick();
      navigate(`/rooms/${clean}/waiting`);
    }
  };

  const handleRoomClick = (roomCode) => {
    soundEffects.playButtonClick();
    navigate(`/rooms/${roomCode}/waiting`);
  };

  return (
    <NotebookBackground showMargin={true} className="py-3 xs:py-4 sm:py-8 md:py-10">
      <div className="max-w-6xl mx-auto px-3.5 xs:px-4 sm:pl-16 md:pl-20 sm:pr-8">
        
        {/* =========================================================================
            MOBILE LAYOUT (Dedicated experience for screens < 768px / md breakpoint)
            Optimized for single-screen viewports, compact hierarchy, 44px+ touch targets
            ========================================================================= */}
        <div className="block md:hidden">
          
          {/* 1. Compact Mobile Header */}
          <header className="mb-2.5 pb-2 border-b border-[#D5CFC3]/80">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-[#EFE8DA] border border-[#D5CFC3] text-[10px] font-mono text-[#5C6069]">
                <Sparkles className="w-3 h-3 text-[#2B68B4]" />
                <span className="font-semibold">Battle Lobby</span>
              </div>
              <div className="text-[10px] font-mono text-[#8E949F]">
                ODD WAR v1.0
              </div>
            </div>

            <h1 className="text-2xl xs:text-3xl font-handwriting font-bold tracking-tight text-[#23252A] mt-1 leading-tight">
              ODD WAR Arena Lobby
            </h1>
            <p className="text-xs text-[#5C6069] font-sans truncate mt-0.5">
              Assemble your squad, enter a secret code, or launch a battle sheet.
            </p>
          </header>

          {/* 2. Section A: Compact Player Identity Bar (~52px) */}
          <div className="mb-3 p-2 xs:p-2.5 rounded-xl bg-[#FFFDF9] border border-[#23252A]/20 shadow-sketch-sm flex items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-full border-2 border-[#23252A] flex items-center justify-center font-handwriting font-bold text-base text-white shadow-sketch-sm shrink-0"
                style={{ backgroundColor: color.hex }}
              >
                {player.nickname ? player.nickname.charAt(0).toUpperCase() : 'W'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-handwriting font-bold text-lg text-[#23252A] truncate leading-none">
                    {player.nickname}
                  </span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 border"
                    style={{
                      backgroundColor: color.lightHex || '#F0F5FB',
                      color: color.hex,
                      borderColor: `${color.hex}40`
                    }}
                  >
                    {color.name}
                  </span>
                </div>

                <div className="text-[10px] font-sans text-[#5C6069] truncate mt-0.5 flex items-center gap-1">
                  {player.isCustomized ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E8557] animate-pulse shrink-0" />
                      <span className="text-[#2E8557] font-medium truncate">Ready for combat</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D59926] shrink-0" />
                      <span className="text-[#96630D] truncate">Default warrior &bull; Tap to customize</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Link
              to="/profile-setup"
              className="shrink-0 min-h-[40px] min-w-[40px] px-2.5 py-1.5 rounded-lg border border-[#D5CFC3] hover:border-[#23252A] bg-[#FAF6EC] hover:bg-[#EFE8DA] text-[#23252A] flex items-center justify-center gap-1 text-xs font-mono font-medium shadow-sketch-sm transition-colors"
              aria-label="Edit warrior profile"
            >
              <User className="w-3.5 h-3.5 text-[#23252A]" />
              <span className="text-[11px] font-semibold">{player.isCustomized ? 'Edit' : 'Setup'}</span>
            </Link>
          </div>

          {/* 3. Section B: High-Priority "Join with Code" Card */}
          <div className="mb-3 p-3 xs:p-3.5 rounded-xl bg-[#FFFDF9] border-2 border-[#CE4242]/35 shadow-paper">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-[#FDF2F2] border border-[#CE4242]/30 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-[#CE4242]" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#23252A]">
                  Join with Code
                </span>
              </div>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#FCFAF3] border border-[#D5CFC3] text-[#CE4242] font-bold">
                SECRET CODE
              </span>
            </div>

            <form onSubmit={handleJoin} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={directCode}
                  onChange={(e) => {
                    setDirectCode(e.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                  placeholder="ODD..."
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  enterKeyHint="go"
                  className="flex-1 min-h-[46px] px-3 rounded-lg border-2 border-[#23252A] bg-[#FCFAF5] font-mono font-bold text-center text-base uppercase text-[#23252A] tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-[#2B68B4] transition-all"
                  aria-label="6-character room code"
                />

                <button
                  type="submit"
                  disabled={isJoining}
                  className="min-h-[46px] min-w-[76px] px-4 rounded-lg bg-[#23252A] text-white font-mono font-bold text-xs uppercase hover:bg-black transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sketch-sm active:translate-y-0.5 disabled:opacity-50"
                  aria-label="Join room"
                >
                  {isJoining ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Join</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Progressive Disclosure Toggle for Password */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordInput((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5C6069] hover:text-[#23252A] transition-colors py-1 cursor-pointer"
                  aria-expanded={showPasswordInput}
                >
                  <KeyRound className="w-3 h-3 text-[#CE4242]" />
                  <span>{showPasswordInput ? 'Hide private room password' : 'Have a private room password?'}</span>
                  {showPasswordInput ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {showPasswordInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-1.5"
                  >
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter secret pencil password"
                      maxLength={32}
                      className="w-full min-h-[42px] px-3 rounded-lg border border-[#D5CFC3] bg-[#FCFAF5] font-sans text-xs text-[#23252A] focus:outline-none focus:border-[#23252A] focus:ring-1 focus:ring-[#23252A]/20"
                      aria-label="Room password"
                    />
                  </motion.div>
                )}
              </div>

              {codeError && (
                <div className="flex items-center gap-1.5 p-2 rounded-md bg-[#FDF2F2] border border-[#CE4242]/30 text-[11px] font-mono text-[#CE4242]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{codeError}</span>
                </div>
              )}
            </form>
          </div>

          {/* 4. Section C & D: Balanced Secondary Action Tiles (Side-by-Side 2-Column Grid) */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            
            {/* Tile 1: Create Arena */}
            <div
              onClick={() => {
                soundEffects.playButtonClick();
                navigate('/rooms/create');
              }}
              className="p-3 rounded-xl bg-[#FFFDF9] border-2 border-[#2E8557]/40 shadow-paper hover:border-[#23252A] active:scale-[0.98] transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F7F3] border border-[#2E8557]/30 flex items-center justify-center text-[#2E8557]">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#FCFAF3] border border-[#D5CFC3] text-[#2E8557] font-bold">
                    HOST
                  </span>
                </div>

                <h2 className="text-lg font-handwriting font-bold text-[#23252A] leading-tight">
                  Create Arena
                </h2>
                <p className="text-[11px] text-[#5C6069] font-sans mt-0.5 line-clamp-2">
                  Start a battle with 2–4 players.
                </p>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  className="w-full min-h-[42px] px-2 rounded-lg bg-[#2E8557] hover:bg-[#236844] text-white font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-sketch-sm transition-colors cursor-pointer"
                >
                  <span>Host Room</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Tile 2: Public Rooms */}
            <div
              onClick={() => {
                soundEffects.playButtonClick();
                navigate('/rooms/public');
              }}
              className="p-3 rounded-xl bg-[#FFFDF9] border-2 border-[#2B68B4]/40 shadow-paper hover:border-[#23252A] active:scale-[0.98] transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F5FB] border border-[#2B68B4]/30 flex items-center justify-center text-[#2B68B4]">
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#FCFAF3] border border-[#D5CFC3] text-[#2B68B4] font-bold">
                    {publicRooms.length} ACTIVE
                  </span>
                </div>

                <h2 className="text-lg font-handwriting font-bold text-[#23252A] leading-tight">
                  Public Rooms
                </h2>
                <p className="text-[11px] text-[#5C6069] font-sans mt-0.5 line-clamp-2">
                  Join open sheets instantly.
                </p>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  className="w-full min-h-[42px] px-2 rounded-lg bg-[#2B68B4] hover:bg-[#20518d] text-white font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-sketch-sm transition-colors cursor-pointer"
                >
                  <span>Browse</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Section D: Live Public Rooms Quick Feed (Clean, contained notebook sheet) */}
          <div className="mb-3 p-3 rounded-xl bg-[#FFFDF9] border border-[#D5CFC3] shadow-sketch-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-[#2B68B4]" />
                <span className="text-xs font-mono font-bold text-[#23252A] uppercase">
                  Open Battle Sheets
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 44px hit-box refresh button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadPublicRooms();
                  }}
                  className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-[#5C6069] hover:text-[#23252A] active:scale-95 transition-all cursor-pointer"
                  title="Refresh open rooms"
                  aria-label="Refresh public rooms"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                </button>

                <Link
                  to="/rooms/public"
                  className="text-[11px] font-mono text-[#2B68B4] font-semibold hover:underline flex items-center gap-0.5"
                >
                  <span>All ({publicRooms.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* State Handling for Rooms: Loading / Error / Empty / List */}
            {isLoadingRooms ? (
              <div className="space-y-1.5 py-1">
                <div className="h-10 rounded-lg bg-[#EFE8DA]/60 animate-pulse border border-[#D5CFC3]/50" />
                <div className="h-10 rounded-lg bg-[#EFE8DA]/40 animate-pulse border border-[#D5CFC3]/30" />
              </div>
            ) : roomsError ? (
              <div className="p-2.5 rounded-lg bg-[#FDF2F2] border border-[#CE4242]/30 flex items-center justify-between text-xs font-mono text-[#CE4242]">
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{roomsError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadPublicRooms}
                  className="min-h-[44px] px-2 text-[10px] font-bold uppercase underline hover:text-black cursor-pointer shrink-0"
                >
                  Retry
                </button>
              </div>
            ) : publicRooms.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs font-mono text-[#5C6069] bg-[#FCFAF3] rounded-lg border border-dashed border-[#D5CFC3]">
                <BookOpen className="w-4 h-4 text-[#8E949F] mx-auto mb-1" />
                <span>No open battles right now. Host the first one!</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {publicRooms.slice(0, 2).map((rm) => (
                  <div
                    key={rm.code}
                    onClick={() => handleRoomClick(rm.code)}
                    className="p-2 min-h-[44px] rounded-lg bg-[#FCFAF3] border border-[#D5CFC3] hover:border-[#23252A] flex items-center justify-between text-xs cursor-pointer active:bg-[#FAF6EC] transition-colors"
                  >
                    <div className="min-w-0 pr-2 truncate font-sans font-bold text-[#23252A]">
                      {rm.name}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EFE8DA] text-[#2E8557] font-bold">
                        {rm.players?.length || 1}/{rm.maxPlayers || 4}P
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#2B68B4] flex items-center gap-0.5">
                        Join <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Compact Mobile Security & Platform Note */}
          <div className="p-2.5 rounded-lg bg-[#FCFAF3] border border-[#D5CFC3] flex items-center justify-between text-[10px] font-mono text-[#5C6069]">
            <div className="flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E8557] shrink-0" />
              <span className="truncate">2–4 Players &bull; Real-Time Sync</span>
            </div>
            <div className="flex items-center gap-1 text-[#8E949F] shrink-0">
              <BookOpen className="w-3 h-3 text-[#2B68B4]" />
              <span>100/200 Pages</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DESKTOP LAYOUT (Preserved & refined 3-column architecture for >= 768px / md)
            ========================================================================= */}
        <div className="hidden md:block">
          
          {/* Header */}
          <header className="mb-6 sm:mb-8 border-b border-[#D5CFC3] pb-4 sm:pb-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#EFE8DA] border border-[#D5CFC3] text-xs font-mono text-[#5C6069] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#2B68B4]" />
              <span>Multiplayer Battle Lobby</span>
            </div>

            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-handwriting font-bold tracking-tight text-[#23252A]">
              ODD WAR Arena Lobby
            </h1>

            <p className="mt-2 text-sm sm:text-base text-[#5C6069] max-w-2xl font-sans">
              Assemble your squad, hop into open classroom sheets, or launch your own vertical territory.
            </p>
          </header>

          {/* 1. Player Welcome & Active Identity Ribbon */}
          <Card variant="taped" padding="md" className="mb-8 border-2 border-[#23252A]/20">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div
                  className="w-12 h-12 rounded-full border-2 border-[#23252A] flex items-center justify-center font-handwriting font-bold text-xl text-white shadow-sketch-sm shrink-0"
                  style={{ backgroundColor: color.hex }}
                >
                  {player.nickname ? player.nickname.charAt(0).toUpperCase() : 'W'}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-handwriting font-bold text-xl sm:text-2xl text-[#23252A]">
                      {player.nickname}
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border"
                      style={{
                        backgroundColor: color.lightHex || '#F0F5FB',
                        color: color.hex,
                        borderColor: `${color.hex}40`
                      }}
                    >
                      {color.name} Squad
                    </span>
                  </div>
                  <div className="text-xs text-[#5C6069] font-sans mt-0.5">
                    {player.isCustomized ? (
                      <span className="text-[#2E8557] font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E8557] animate-pulse" />
                        Player call-sign active &bull; Ready for combat
                      </span>
                    ) : (
                      <span className="text-[#96630D]">
                        Default identity assigned &bull; Choose your custom name and color family
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link to="/profile-setup" className="shrink-0 w-auto">
                <Button
                  variant={player.isCustomized ? 'secondary' : 'primary'}
                  size="sm"
                  icon={User}
                  className="w-auto shadow-sketch-sm"
                >
                  {player.isCustomized ? 'Edit Call-Sign' : 'Set Up Warrior'}
                </Button>
              </Link>
            </div>
          </Card>

          {/* 2. Three Main Action Cards */}
          <div className="grid grid-cols-3 gap-5 sm:gap-6 mb-10">
            
            {/* Card 1: Create Room */}
            <Card
              variant="default"
              padding="lg"
              className="flex flex-col justify-between hover:border-[#23252A] transition-all group border-2 border-[#2E8557]/40 hover:shadow-paper-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EFE8DA] border border-[#D5CFC3] flex items-center justify-center group-hover:bg-[#2E8557] group-hover:text-white transition-colors">
                    <PlusCircle className="w-6 h-6 text-[#2E8557] group-hover:text-white" />
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FCFAF3] border border-[#D5CFC3] text-[#2E8557] font-bold">
                    HOST ARENA
                  </span>
                </div>

                <h3 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
                  Create a Room
                </h3>

                <p className="text-xs sm:text-sm text-[#5C6069] leading-relaxed font-sans mb-6">
                  Open a fresh notebook page. Configure 100 or 200 pages, choose 2–4 players, and set Public or Private access.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  soundEffects.playButtonClick();
                  navigate('/rooms/create');
                }}
                className="w-full shadow-sketch-sm"
              >
                Host Room
              </Button>
            </Card>

            {/* Card 2: Join with Code (Inline Entry) */}
            <Card
              variant="default"
              padding="lg"
              className="flex flex-col justify-between hover:border-[#23252A] transition-all group border-2 border-[#CE4242]/30 hover:shadow-paper-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EFE8DA] border border-[#D5CFC3] flex items-center justify-center group-hover:bg-[#CE4242] group-hover:text-white transition-colors">
                    <Lock className="w-6 h-6 text-[#CE4242] group-hover:text-white" />
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FCFAF3] border border-[#D5CFC3] text-[#CE4242] font-bold">
                    SECRET CODE
                  </span>
                </div>

                <h3 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
                  Join with Code
                </h3>

                <p className="text-xs text-[#5C6069] leading-relaxed font-sans mb-4">
                  Enter a 6-character room code from a classmate to join their waiting room:
                </p>

                {/* Inline Room Code Form */}
                <form onSubmit={handleJoin} className="space-y-2 mb-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={directCode}
                      onChange={(e) => {
                        setDirectCode(e.target.value.toUpperCase());
                        setCodeError(null);
                      }}
                      placeholder="ODD..."
                      maxLength={6}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="text"
                      enterKeyHint="go"
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-[#23252A] bg-[#FCFAF5] font-mono font-bold text-center text-sm uppercase text-[#23252A] tracking-wider focus:outline-none focus:ring-2 focus:ring-[#2B68B4]"
                      aria-label="6-character room code"
                    />
                    <button
                      type="submit"
                      disabled={isJoining}
                      className="px-4 py-2 min-h-[44px] rounded-lg bg-[#23252A] text-white font-mono font-bold text-xs hover:bg-black transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isJoining ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Join'}
                    </button>
                  </div>

                  {/* Password progressive disclosure */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPasswordInput((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5C6069] hover:text-[#23252A] transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3 text-[#CE4242]" />
                      <span>{showPasswordInput ? 'Hide private room password' : 'Have a private room password?'}</span>
                    </button>

                    {showPasswordInput && (
                      <div className="pt-2">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter secret pencil password"
                          maxLength={32}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#D5CFC3] bg-[#FCFAF5] font-sans text-xs text-[#23252A] focus:outline-none focus:border-[#23252A]"
                        />
                      </div>
                    )}
                  </div>

                  {codeError && (
                    <p className="text-[11px] font-mono text-[#CE4242] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{codeError}</span>
                    </p>
                  )}
                </form>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  soundEffects.playButtonClick();
                  navigate('/rooms/join');
                }}
                className="w-full mt-2"
              >
                Advanced Join with Password
              </Button>
            </Card>

            {/* Card 3: Browse Public Rooms */}
            <Card
              variant="default"
              padding="lg"
              className="flex flex-col justify-between hover:border-[#23252A] transition-all group border-2 border-[#2B68B4]/40 hover:shadow-paper-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EFE8DA] border border-[#D5CFC3] flex items-center justify-center group-hover:bg-[#2B68B4] group-hover:text-white transition-colors">
                    <Globe2 className="w-6 h-6 text-[#2B68B4] group-hover:text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Minimum 44px hit-area refresh button */}
                    <button
                      type="button"
                      onClick={loadPublicRooms}
                      className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center rounded-lg hover:bg-[#EFE8DA] text-[#5C6069] transition-colors cursor-pointer"
                      title="Refresh live rooms"
                      aria-label="Refresh live rooms"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                    </button>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FCFAF3] border border-[#D5CFC3] text-[#2B68B4] font-bold">
                      {publicRooms.length} ACTIVE
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
                  Public Rooms
                </h3>

                <p className="text-xs sm:text-sm text-[#5C6069] leading-relaxed font-sans mb-4">
                  Discover active open sheets, check current player counts (2–4), and jump straight into battle.
                </p>

                {/* State Handling: Loading, Error, Empty, or List */}
                {isLoadingRooms ? (
                  <div className="space-y-1.5 mb-4">
                    <div className="h-9 rounded-lg bg-[#EFE8DA]/60 animate-pulse border border-[#D5CFC3]/50" />
                    <div className="h-9 rounded-lg bg-[#EFE8DA]/40 animate-pulse border border-[#D5CFC3]/30" />
                  </div>
                ) : roomsError ? (
                  <div className="p-2 mb-4 rounded-lg bg-[#FDF2F2] border border-[#CE4242]/30 flex items-center justify-between text-xs font-mono text-[#CE4242]">
                    <span className="truncate pr-1">{roomsError}</span>
                    <button
                      type="button"
                      onClick={loadPublicRooms}
                      className="min-h-[44px] px-2 text-[10px] uppercase font-bold underline cursor-pointer shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                ) : publicRooms.length === 0 ? (
                  <div className="p-3 mb-4 rounded-lg bg-[#FCFAF3] border border-dashed border-[#D5CFC3] text-center text-xs font-mono text-[#5C6069]">
                    <BookOpen className="w-4 h-4 text-[#8E949F] mx-auto mb-1" />
                    <span>No open battles right now. Host the first one!</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 mb-4">
                    {publicRooms.slice(0, 2).map((rm) => (
                      <div
                        key={rm.code}
                        onClick={() => handleRoomClick(rm.code)}
                        className="p-2 rounded-lg bg-[#FCFAF3] border border-[#D5CFC3] hover:border-[#23252A] flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-1 truncate font-sans font-bold text-[#23252A]">
                          {rm.name}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EFE8DA] text-[#2E8557] font-bold shrink-0">
                          {rm.players?.length || 1}/{rm.maxPlayers || 4}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  soundEffects.playButtonClick();
                  navigate('/rooms/public');
                }}
                className="w-full shadow-sketch-sm"
              >
                Browse Public Rooms
              </Button>
            </Card>
          </div>

          {/* 3. Security & Fair-Play Notes */}
          <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#D5CFC3] flex flex-row items-center justify-between gap-4 text-xs font-mono text-[#5C6069]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2E8557] shrink-0" />
              <span>2–4 Players Supported &bull; Real-Time Socket.IO Synchronization &bull; Authoritative Game Server</span>
            </div>
            <div className="flex items-center gap-2 text-[#8E949F]">
              <BookOpen className="w-3.5 h-3.5 text-[#2B68B4]" />
              <span>100 / 200 Pages</span>
            </div>
          </div>
        </div>

      </div>
    </NotebookBackground>
  );
};

export default RoomsDashboard;
