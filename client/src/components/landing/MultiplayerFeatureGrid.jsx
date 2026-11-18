import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Globe2, Lock, Palette, Zap } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { PlayerColorIndicator, PLAYER_COLORS } from '../ui/PlayerColorIndicator.jsx';

export const MultiplayerFeatureGrid = () => {
  const [activeColor, setActiveColor] = useState('blue');

  const features = [
    {
      icon: Users,
      iconColor: 'text-[#2B68B4]',
      badge: 'Lobby Limit',
      title: '2–4 Players Per Match',
      description: 'Intense free-for-all paper skirmishes tuned for fast, chaotic, and competitive rounds.'
    },
    {
      icon: Globe2,
      iconColor: 'text-[#2E8557]',
      badge: 'Fast Queue',
      title: 'Public Matchmaking',
      description: 'Jump directly into open battle sheets with other students and players worldwide.'
    },
    {
      icon: Lock,
      iconColor: 'text-[#CE4242]',
      badge: 'Secret Codes',
      title: 'Private Password Rooms',
      description: 'Generate a custom room code, set a pencil passcode, and duel exclusively with your friends.'
    },
    {
      icon: Zap,
      iconColor: 'text-[#D59926]',
      badge: 'Authoritative',
      title: 'Real-Time Battles',
      description: 'Low-latency Socket.IO simulation loop ensures every bullet and dodge registers precisely.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Feature cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <Card
              key={idx}
              variant="default"
              padding="md"
              className="flex flex-col justify-between hover:border-[#23252A] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EFE8DA] border border-[#D5CFC3] flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${feat.iconColor}`} />
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FCFAF3] border border-[#D5CFC3] text-[#5C6069]">
                    {feat.badge}
                  </span>
                </div>

                <h4 className="text-lg font-handwriting font-bold text-[#23252A] mb-1.5">
                  {feat.title}
                </h4>

                <p className="text-xs sm:text-sm text-[#5C6069] leading-relaxed font-sans">
                  {feat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D5CFC3] text-[10px] font-mono text-[#8E949F]">
                NETWORK READY
              </div>
            </Card>
          );
        })}
      </div>

      {/* 5th Highlight Feature: 5 Character Color Families */}
      <Card variant="taped" padding="lg" className="mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase text-[#2B68B4] mb-2">
              <Palette className="w-3.5 h-3.5" />
              <span>Identity & Team Swatches</span>
            </div>
            <h3 className="text-2xl font-handwriting font-bold text-[#23252A] mb-2">
              Five Hand-Drawn Character Color Families
            </h3>
            <p className="text-sm text-[#5C6069] leading-relaxed font-sans">
              Choose your colored pencil ink before entering the battle. Each player's bullets, 
              tracer lines, and annotations are distinguished on the notebook sheet in authentic ballpoint shades.
            </p>
          </div>

          {/* Interactive Color Selector Palette */}
          <div className="flex flex-col items-start md:items-end">
            <span className="text-xs font-mono text-[#5C6069] mb-3">
              Click to preview ink swatch:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {Object.keys(PLAYER_COLORS).map((key) => (
                <PlayerColorIndicator
                  key={key}
                  color={key}
                  variant="swatch"
                  size="lg"
                  selected={activeColor === key}
                  onClick={() => setActiveColor(key)}
                />
              ))}
            </div>

            <div className="mt-3 text-xs font-mono text-[#5C6069]">
              Selected: <strong className="text-[#23252A]">{PLAYER_COLORS[activeColor]?.name}</strong> ({PLAYER_COLORS[activeColor]?.hex})
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MultiplayerFeatureGrid;
