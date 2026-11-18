import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe2,
  Lock,
  ArrowLeft,
  BookOpen,
  Users,
  Sparkles,
  Eye,
  EyeOff,
  Crown
} from 'lucide-react';
import {
  NotebookBackground,
  Button,
  Card,
  Input
} from '../../components/ui/index.js';
import { roomApi } from '../../services/roomApi.js';
import { getPlayerSession } from '../../store/playerSession.js';
import { getColorFamily } from '../../config/colors.js';

export const CreateRoomPage = () => {
  const navigate = useNavigate();
  const player = getPlayerSession();
  const color = getColorFamily(player.primaryColor);

  const [roomType, setRoomType] = useState('public'); // 'public' | 'private'
  const [name, setName] = useState(`${player.nickname}'s Arena`);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [bookPageCount, setBookPageCount] = useState(100); // 100 | 200
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError('Room name must be at least 3 characters.');
      return;
    }

    if (roomType === 'private' && password.trim().length < 3) {
      setError('Private room password must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      let createdRoom = null;
      if (roomType === 'private') {
        createdRoom = await roomApi.createPrivateRoom({
          name: name.trim(),
          password: password.trim(),
          maxPlayers,
          bookPageCount,
          player
        });
      } else {
        createdRoom = await roomApi.createPublicRoom({
          name: name.trim(),
          maxPlayers,
          bookPageCount,
          player
        });
      }

      // Navigate to room summary
      navigate(`/rooms/${createdRoom.code}`);
    } catch (err) {
      setError(err.message || 'Failed to create room.');
      setIsSubmitting(false);
    }
  };

  return (
    <NotebookBackground showMargin={true} className="py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pl-12 sm:pl-20">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#5C6069] hover:text-[#23252A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Room Hub</span>
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8 border-b border-[#D5CFC3] pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#EFE8DA] border border-[#D5CFC3] text-xs font-mono text-[#5C6069] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#2E8557]" />
            <span>Host An Arena</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-handwriting font-bold tracking-tight text-[#23252A]">
            Create a Battle Sheet
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[#5C6069] font-sans">
            Set up your room name, choose capacity, pick your book page count, and configure private passwords.
          </p>
        </header>

        {/* Form Card */}
        <Card variant="default" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Room Type Toggle (Public vs Private) */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-[#5C6069] block mb-2">
                Room Access Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRoomType('public');
                    setError(null);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 select-none cursor-pointer ${
                    roomType === 'public'
                      ? 'border-2 border-[#23252A] bg-[#FFFDF9] shadow-sketch'
                      : 'border-[#D5CFC3] bg-[#FCFAF3] hover:border-[#9C9486]'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${roomType === 'public' ? 'bg-[#2B68B4] text-white' : 'bg-[#EFE8DA] text-[#5C6069]'}`}>
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-handwriting font-bold text-lg text-[#23252A]">
                      Public Room
                    </div>
                    <div className="text-xs text-[#5C6069] mt-0.5">
                      Listed in public directory for anyone to join
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRoomType('private');
                    setError(null);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 select-none cursor-pointer ${
                    roomType === 'private'
                      ? 'border-2 border-[#23252A] bg-[#FFFDF9] shadow-sketch'
                      : 'border-[#D5CFC3] bg-[#FCFAF3] hover:border-[#9C9486]'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${roomType === 'private' ? 'bg-[#CE4242] text-white' : 'bg-[#EFE8DA] text-[#5C6069]'}`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-handwriting font-bold text-lg text-[#23252A]">
                      Private Room
                    </div>
                    <div className="text-xs text-[#5C6069] mt-0.5">
                      Protected with room code & secret password
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Room Name Input */}
            <div>
              <Input
                label="Room Name"
                placeholder="e.g. 5th Period Crossfire"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={32}
                helperText="3 to 32 characters"
              />
            </div>

            {/* 3. Password Input (Conditional for Private) */}
            {roomType === 'private' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <div className="relative">
                  <Input
                    label="Secret Room Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter 3-32 character password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    helperText="Never stored or displayed in plain text (bcrypt hashed)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-8 text-[#8E949F] hover:text-[#23252A]"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* 4. Book Page Count (100 vs 200 Pages) - Host Configured */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-[#5C6069] flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#2B68B4]" />
                  <span>Book Page Count (Game Engine Setting)</span>
                </span>
                <span className="text-[11px] font-mono font-normal text-[#8E949F]">100 or 200 Pages</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBookPageCount(100)}
                  className={`p-3.5 rounded-xl border text-left transition-all select-none cursor-pointer ${
                    bookPageCount === 100
                      ? 'border-2 border-[#23252A] bg-[#FFFDF9] shadow-sketch'
                      : 'border-[#D5CFC3] bg-[#FCFAF3] hover:border-[#9C9486]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-handwriting font-bold text-2xl text-[#23252A]">
                      100 Pages
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFE8DA] text-[#5C6069]">
                      STANDARD
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6069] font-sans">
                    Standard exercise book. Server draws pages 1–100.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setBookPageCount(200)}
                  className={`p-3.5 rounded-xl border text-left transition-all select-none cursor-pointer ${
                    bookPageCount === 200
                      ? 'border-2 border-[#23252A] bg-[#FFFDF9] shadow-sketch'
                      : 'border-[#D5CFC3] bg-[#FCFAF3] hover:border-[#9C9486]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-handwriting font-bold text-2xl text-[#23252A]">
                      200 Pages
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FCF8EE] text-[#D59926] font-bold">
                      EXTENDED
                    </span>
                  </div>
                  <p className="text-xs text-[#5C6069] font-sans">
                    Thick notebook. Server draws pages 1–200.
                  </p>
                </button>
              </div>
            </div>

            {/* 5. Player Capacity Selector (2-4 players) */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-[#5C6069] flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#2E8557]" />
                  <span>Maximum Players</span>
                </span>
                <span className="text-[11px] font-mono font-normal text-[#8E949F]">2 to 4 Players</span>
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[2, 3, 4].map((count) => {
                  const isSelected = maxPlayers === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setMaxPlayers(count)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#23252A] bg-[#FFFDF9] shadow-sketch'
                          : 'border-[#D5CFC3] bg-[#FCFAF3] hover:border-[#9C9486]'
                      }`}
                    >
                      <div className="font-handwriting font-bold text-2xl text-[#23252A]">
                        {count} Players
                      </div>
                      <div className="text-[10px] font-mono text-[#5C6069]">
                        {count === 4 ? 'Full Squad' : count === 2 ? 'Duel (1v1)' : 'Trio Skirmish'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Host Identity Badge */}
            <div className="p-3.5 rounded-xl bg-[#FCFAF3] border border-[#D5CFC3] flex items-center justify-between text-xs font-mono">
              <span className="text-[#5C6069] flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#D59926]" />
                <span>Host Commander:</span>
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color.hex }}
                />
                <strong className="text-[#23252A]">{player.nickname}</strong>
                <span className="text-[10px] text-[#8E949F]">({color.name})</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#CE4242] text-[#CE4242] text-xs font-sans">
                {error}
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-[#D5CFC3] flex items-center justify-between">
              <Link to="/rooms">
                <Button variant="ghost">Cancel</Button>
              </Link>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="shadow-sketch-dark px-8"
              >
                Create Room
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </NotebookBackground>
  );
};

export default CreateRoomPage;
