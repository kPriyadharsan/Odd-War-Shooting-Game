import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe2, PlusCircle, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import {
  NotebookBackground,
  Button,
  Card,
  SectionHeading,
  PlayerColorIndicator
} from '../../components/ui/index.js';
import { getPlayerSession } from '../../store/playerSession.js';
import { getColorFamily } from '../../config/colors.js';

export const RoomsDashboard = () => {
  const navigate = useNavigate();
  const player = getPlayerSession();
  const color = getColorFamily(player.primaryColor);

  return (
    <NotebookBackground showMargin={true} className="py-4 sm:py-12">
      <div className="max-w-6xl mx-auto pl-9 sm:pl-16 md:pl-20 pr-3 sm:pr-8">
        
        {/* Header */}
        <header className="mb-6 sm:mb-10 border-b border-[#D5CFC3] pb-4 sm:pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#EFE8DA] border border-[#D5CFC3] text-xs font-mono text-[#5C6069] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#2B68B4]" />
            <span>Multiplayer Battle Lobbies</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-handwriting font-bold tracking-tight text-[#23252A]">
            Battle Rooms & Arenas
          </h1>

          <p className="mt-2 text-base sm:text-lg text-[#5C6069] max-w-2xl font-sans">
            Gather your squad, browse open paper sheets, or join with a secret code.
          </p>
        </header>

        {/* Current Active Player Identity Ribbon */}
        <Card variant="taped" padding="md" className="mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div
                className="w-10 h-10 rounded-full border-2 border-[#23252A] flex items-center justify-center font-handwriting font-bold text-lg text-white shadow-sm"
                style={{ backgroundColor: color.hex }}
              >
                {player.nickname.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-handwriting font-bold text-xl text-[#23252A]">
                    {player.nickname}
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: color.lightBg, color: color.hex }}
                  >
                    {color.name} Squad
                  </span>
                </div>
                <div className="text-xs text-[#5C6069] font-sans">
                  {player.isCustomized ? 'Player profile active' : 'Default identity active'}
                </div>
              </div>
            </div>

            <Link to="/profile-setup">
              <Button variant="secondary" size="sm" icon={User}>
                Customize Call-Sign
              </Button>
            </Link>
          </div>
        </Card>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Card 1: Browse Public Rooms */}
          <Card
            variant="default"
            padding="lg"
            className="flex flex-col justify-between hover:border-[#23252A] transition-all group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EFE8DA] border border-[#D5CFC3] flex items-center justify-center mb-4 group-hover:bg-[#2B68B4] group-hover:text-white transition-colors">
                <Globe2 className="w-6 h-6 text-[#2B68B4] group-hover:text-white" />
              </div>

              <span className="text-[10px] font-mono uppercase text-[#5C6069] tracking-wider block mb-1">
                PUBLIC QUEUE
              </span>

              <h3 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
                Browse Public Rooms
              </h3>

              <p className="text-xs sm:text-sm text-[#5C6069] leading-relaxed font-sans mb-6">
                Discover active open sheets, check current player counts (2–4), and jump straight into battle.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/rooms/public')}
              className="w-full shadow-sketch-sm"
            >
              Browse Rooms
            </Button>
          </Card>

          {/* Card 2: Create a Room */}
          <Card
            variant="default"
            padding="lg"
            className="flex flex-col justify-between hover:border-[#23252A] transition-all group border-2"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EFE8DA] border border-[#D5CFC3] flex items-center justify-center mb-4 group-hover:bg-[#2E8557] group-hover:text-white transition-colors">
                <PlusCircle className="w-6 h-6 text-[#2E8557] group-hover:text-white" />
              </div>

              <span className="text-[10px] font-mono uppercase text-[#5C6069] tracking-wider block mb-1">
                HOST AN ARENA
              </span>

              <h3 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
                Create a Room
              </h3>

              <p className="text-xs sm:text-sm text-[#5C6069] leading-relaxed font-sans mb-6">
                Open a new notebook page. Choose Public for open battles or Private with a password.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/rooms/create')}
              className="w-full shadow-sketch-sm"
            >
              Create Room
            </Button>
          </Card>

          {/* Card 3: Join Private Room */}
          <Card
            variant="default"
            padding="lg"
            className="flex flex-col justify-between hover:border-[#23252A] transition-all group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#EFE8DA] border border-[#D5CFC3] flex items-center justify-center mb-4 group-hover:bg-[#CE4242] group-hover:text-white transition-colors">
                <Lock className="w-6 h-6 text-[#CE4242] group-hover:text-white" />
              </div>

              <span className="text-[10px] font-mono uppercase text-[#5C6069] tracking-wider block mb-1">
                SECRET SQUAD PASS
              </span>

              <h3 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
                Join with Code
              </h3>

              <p className="text-xs sm:text-sm text-[#5C6069] leading-relaxed font-sans mb-6">
                Got a 6-character room code and password from a classmate? Enter directly into their sector.
              </p>
            </div>

            <Button
              variant="secondary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/rooms/join')}
              className="w-full"
            >
              Enter Code
            </Button>
          </Card>
        </div>

        {/* Security & Lifecycle Notes */}
        <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#D5CFC3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-[#5C6069]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2E8557]" />
            <span>2–4 Players Supported &bull; Hashed Passwords &bull; Server-Authoritative Capacity</span>
          </div>
          <span className="text-[#8E949F]">Online Session System</span>
        </div>
      </div>
    </NotebookBackground>
  );
};

export default RoomsDashboard;
