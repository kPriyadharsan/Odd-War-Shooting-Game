import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, ArrowRight, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import {
  NotebookBackground,
  Button,
  Card,
  Input
} from '../../components/ui/index.js';
import { roomApi } from '../../services/roomApi.js';
import { getPlayerSession } from '../../store/playerSession.js';

export const JoinRoomPage = () => {
  const navigate = useNavigate();
  const player = getPlayerSession();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter a valid room code (e.g. ODD482).');
      return;
    }

    setIsSubmitting(true);
    try {
      const room = await roomApi.joinRoom({
        code: cleanCode,
        password: password.trim() || undefined,
        player
      });

      navigate(`/rooms/${room.code}/waiting`);
    } catch (err) {
      setError(err.message || 'Could not join room');
      setIsSubmitting(false);
    }
  };

  return (
    <NotebookBackground showMargin={true} className="py-4 sm:py-12">
      <div className="max-w-xl mx-auto pl-9 sm:pl-16 md:pl-20 pr-3 sm:pr-8">
        
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
            <Lock className="w-3.5 h-3.5 text-[#CE4242]" />
            <span>Private Passcode Entry</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-handwriting font-bold tracking-tight text-[#23252A]">
            Join with Room Code
          </h1>

          <p className="mt-2 text-sm text-[#5C6069] font-sans">
            Enter the 6-character room code shared by your friend, along with their secret pencil password.
          </p>
        </header>

        {/* Join Card */}
        <Card variant="sketch" padding="lg">
          <form onSubmit={handleJoin} className="space-y-6">
            
            {/* Room Code Input */}
            <div>
              <Input
                label="Room Code"
                placeholder="e.g. ODD7X9"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                helperText="6-character code"
                autoFocus
              />
            </div>

            {/* Room Password Input */}
            <div>
              <Input
                label="Room Password"
                type="password"
                placeholder="Enter room password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Leave empty if joining a public room by code"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#CE4242] text-[#CE4242] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 flex items-center justify-between">
              <Link to="/rooms/public" className="text-xs font-handwriting text-[#2B68B4] hover:underline">
                Or browse public rooms &rarr;
              </Link>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                icon={ArrowRight}
                iconPosition="right"
                className="px-6"
              >
                Join Room
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </NotebookBackground>
  );
};

export default JoinRoomPage;
