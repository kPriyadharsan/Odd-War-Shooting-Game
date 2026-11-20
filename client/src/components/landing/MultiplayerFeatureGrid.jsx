import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Globe2, Lock, Palette, Zap, Pencil } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { PlayerColorIndicator, PLAYER_COLORS } from '../ui/PlayerColorIndicator.jsx';

export const MultiplayerFeatureGrid = () => {
  const [activeColor, setActiveColor] = useState('blue');

  const features = [
    {
      icon: Users,
      iconColor: 'text-[#2B68B4]',
      badge: '2–4 Players',
      title: 'Multiplayer Skirmishes',
      description: 'Intense free-for-all paper skirmishes tuned for 2, 3, or 4 players in fast, competitive rounds.'
    },
    {
      icon: Globe2,
      iconColor: 'text-[#2E8557]',
      badge: 'Open & Secret',
      title: 'Public & Private Rooms',
      description: 'Hop into open community battle sheets or lock a private notebook page with your own password.'
    },
    {
      icon: Zap,
      iconColor: 'text-[#D59926]',
      badge: '30Hz Sync',
      title: 'Real-Time Multiplayer',
      description: 'Authoritative Socket.IO engine synchronizes every page flip, pencil stroke, and combat shot instantly.'
    },
    {
      icon: Palette,
      iconColor: 'text-[#8E44AD]',
      badge: '5 Squads',
      title: 'Custom Player Colors',
      description: 'Choose from Red, Green, Blue, Yellow, or Black color families with automatic unique room shades.'
    },
    {
      icon: Pencil,
      iconColor: 'text-[#CE4242]',
      badge: 'Hand-Drawn',
      title: 'Character Battles',
      description: 'Sketch your warrior stage by stage with natural pencil graphite strokes and eliminate enemy rows.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 5 Feature cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
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
