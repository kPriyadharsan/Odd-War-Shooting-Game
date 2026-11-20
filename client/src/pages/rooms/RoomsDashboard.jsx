import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  AlertCircle
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
  const [codeError, setCodeError] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // Fetch real public rooms from backend
  const loadPublicRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const rooms = await roomApi.listPublicRooms();
      setPublicRooms(Array.isArray(rooms) ? rooms : []);
    } catch (err) {
      setPublicRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadPublicRooms();
  }, []);

  // Quick join via direct code
  const handleQuickJoin = (e) => {
    e.preventDefault();
    setCodeError(null);
    const clean = directCode.trim().toUpperCase();
    if (clean.length < 4) {
      setCodeError('Room code must be at least 4 characters.');
      return;
    }
    soundEffects.playButtonClick();
    navigate(`/rooms/${clean}/waiting`);
  };

  return (
    <NotebookBackground showMargin={true} className="py-4 sm:py-10">
      <div className="max-w-6xl mx-auto pl-9 sm:pl-16 md:pl-20 pr-3 sm:pr-8">
        
        {/* Header */}
        <header className="mb-6 sm:mb-8 border-b border-[#D5CFC3] pb-4 sm:pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#EFE8DA] border border-[#D5CFC3] text-xs font-mono text-[#5C6069] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#2B68B4]" />
            <span>Multiplayer Battle Lobby</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-handwriting font-bold tracking-tight text-[#23252A]">
            ODD WARS Arena Lobby
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[#5C6069] max-w-2xl font-sans">
            Assemble your squad, hop into open classroom sheets, or launch your own vertical territory.
          </p>
        </header>

        {/* 1. Player Welcome & Active Identity Ribbon */}
        <Card variant="taped" padding="md" className="mb-8 border-2 border-[#23252A]/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div
                className="w-12 h-12 rounded-full border-2 border-[#23252A] flex items-center justify-center font-handwriting font-bold text-xl text-white shadow-sketch-sm shrink-0"
                style={{ backgroundColor: color.hex }}
              >
                {player.nickname.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-handwriting font-bold text-xl sm:text-2xl text-[#23252A]">
                    {player.nickname}
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                    style={{ backgroundColor: color.lightBg, color: color.hex }}
                  >
                    {color.name} Squad
                  </span>
                </div>
                <div className="text-xs text-[#5C6069] font-sans mt-0.5">
                  {player.isCustomized ? (
                    <span className="text-[#2E8557] font-medium">Player call-sign active &bull; Ready for combat</span>
                  ) : (
                    <span className="text-[#96630D]">Default identity assigned &bull; Choose your custom name and color family</span>
                  )}
                </div>
              </div>
            </div>

            <Link to="/profile-setup" className="shrink-0 w-full sm:w-auto">
              <Button
                variant={player.isCustomized ? 'secondary' : 'primary'}
                size="sm"
                icon={User}
                className="w-full sm:w-auto shadow-sketch-sm"
              >
                {player.isCustomized ? 'Edit Call-Sign' : 'Set Up Warrior'}
              </Button>
            </Link>
          </div>
        </Card>

        {/* 2. Three Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-10">
          
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

              {/* Inline Room Code Input */}
              <form onSubmit={handleQuickJoin} className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={directCode}
                    onChange={(e) => {
                      setDirectCode(e.target.value.toUpperCase());
                      setCodeError(null);
                    }}
                    placeholder="ODD..."
                    maxLength={10}
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-[#23252A] bg-[#FCFAF5] font-mono font-bold text-center text-sm uppercase text-[#23252A] tracking-wider focus:outline-none focus:ring-2 focus:ring-[#2B68B4]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#23252A] text-white font-mono font-bold text-xs hover:bg-black transition-colors cursor-pointer shrink-0"
                  >
                    Join
                  </button>
                </div>
                {codeError && (
                  <p className="text-[11px] font-mono text-[#CE4242]">{codeError}</p>
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
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={loadPublicRooms}
                    className="p-1 rounded hover:bg-[#EFE8DA] text-[#5C6069] transition-colors"
                    title="Refresh live rooms"
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

              {/* Quick Preview of open rooms if available */}
              {publicRooms.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {publicRooms.slice(0, 2).map((rm) => (
                    <div
                      key={rm.code}
                      onClick={() => navigate(`/rooms/${rm.code}/waiting`)}
                      className="p-2 rounded-lg bg-[#FCFAF3] border border-[#D5CFC3] hover:border-[#23252A] flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 pr-1 truncate font-display font-bold text-[#23252A]">
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
        <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#D5CFC3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-[#5C6069]">
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
    </NotebookBackground>
  );
};

export default RoomsDashboard;
