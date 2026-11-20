import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card.jsx';

export const HowItWorksStepCard = ({
  stepNumber,
  title,
  description,
  illustrationType,
  index = 0
}) => {
  return (
    <Card
      variant="default"
      padding="lg"
      className="flex flex-col justify-between h-full group hover:border-[#23252A] transition-all"
    >
      <div>
        {/* Step number badge in handwritten font */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-mono font-bold px-2.5 py-1 rounded-md bg-[#EFE8DA] text-[#23252A] border border-[#D5CFC3]">
            {stepNumber}
          </span>
          <span className="text-xs font-handwriting text-[#5C6069]">
            Step {index + 1} of 6
          </span>
        </div>

        {/* Hand-drawn SVG Illustration for the step */}
        <div className="w-full h-36 rounded-xl bg-[#FCFAF3] border border-dashed border-[#D5CFC3] flex items-center justify-center p-3 mb-5 group-hover:border-[#9C9486] transition-colors">
          {/* Step 1: Create or join a room */}
          {illustrationType === 'create-join' && (
            <svg viewBox="0 0 160 100" className="w-full h-full" fill="none">
              <rect x="25" y="15" width="110" height="70" rx="6" fill="#FFFDF9" stroke="#23252A" strokeWidth="1.8" />
              <line x1="45" y1="15" x2="45" y2="85" stroke="#F0A8A8" strokeWidth="1.2" />
              <line x1="45" y1="32" x2="125" y2="32" stroke="#E5DFD3" strokeWidth="1" />
              <line x1="45" y1="50" x2="125" y2="50" stroke="#E5DFD3" strokeWidth="1" />
              <line x1="45" y1="68" x2="125" y2="68" stroke="#E5DFD3" strokeWidth="1" />
              <g transform="translate(60, 38)">
                <rect x="0" y="0" width="55" height="24" rx="4" fill="#2E8557" />
                <text x="27.5" y="16" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="10" fontWeight="bold" fill="#FFFFFF">NEW ROOM</text>
              </g>
              <g transform="translate(105, 20)">
                <circle cx="8" cy="8" r="7" stroke="#23252A" strokeWidth="1.2" fill="#EFE8DA" />
                <path d="M 5 8 L 11 8 M 8 5 L 8 11" stroke="#23252A" strokeWidth="1.2" />
              </g>
            </svg>
          )}

          {/* Step 2: Invite friends */}
          {illustrationType === 'invite-friends' && (
            <svg viewBox="0 0 160 100" className="w-full h-full" fill="none">
              <rect x="25" y="20" width="110" height="60" rx="8" fill="#FFFDF9" stroke="#23252A" strokeWidth="1.8" />
              <g transform="translate(38, 32)">
                <text x="0" y="10" fontFamily="'Space Mono', monospace" fontSize="9" fill="#8C929D">ROOM CODE:</text>
                <rect x="0" y="14" width="84" height="22" rx="4" fill="#FCFAF3" stroke="#23252A" strokeWidth="1.4" strokeDasharray="3 2" />
                <text x="42" y="29" textAnchor="middle" fontFamily="'Space Mono', monospace" fontSize="12" fontWeight="bold" fill="#23252A" letterSpacing="2">ODD777</text>
              </g>
              <g transform="translate(118, 48)">
                <circle cx="0" cy="0" r="10" fill="#2B68B4" />
                <path d="M -4 0 L -1 3 L 4 -3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          )}

          {/* Step 3: Open the magical book */}
          {(illustrationType === 'open-book' || illustrationType === 'pick-number') && (
            <svg viewBox="0 0 160 100" className="w-full h-full" fill="none">
              {/* Paper notebook sheet */}
              <rect x="25" y="10" width="110" height="80" rx="6" fill="#FFFDF9" stroke="#23252A" strokeWidth="1.8" />
              <line x1="45" y1="10" x2="45" y2="90" stroke="#F0A8A8" strokeWidth="1.2" />
              <line x1="45" y1="28" x2="130" y2="28" stroke="#E5DFD3" strokeWidth="1" />
              <line x1="45" y1="46" x2="130" y2="46" stroke="#E5DFD3" strokeWidth="1" />
              <line x1="45" y1="64" x2="130" y2="64" stroke="#E5DFD3" strokeWidth="1" />

              {/* Random odd numbers circled */}
              <g transform="translate(60, 20)">
                <circle cx="10" cy="10" r="11" stroke="#2B68B4" strokeWidth="1.8" strokeDasharray="2 2" />
                <text x="10" y="14" textAnchor="middle" fontFamily="'Patrick Hand', cursive" fontSize="13" fontWeight="bold" fill="#2B68B4">1</text>
              </g>

              <g transform="translate(95, 20)">
                <circle cx="10" cy="10" r="11" stroke="#D5CFC3" strokeWidth="1.2" />
                <text x="10" y="14" textAnchor="middle" fontFamily="'Patrick Hand', cursive" fontSize="13" fill="#8E949F">3</text>
              </g>

              {/* Selected odd number (5) with pencil scribble highlight */}
              <g transform="translate(75, 48)">
                <circle cx="12" cy="12" r="14" stroke="#CE4242" strokeWidth="2.2" fill="#FDF2F2" />
                <text x="12" y="17" textAnchor="middle" fontFamily="'Patrick Hand', cursive" fontSize="16" fontWeight="bold" fill="#CE4242">5</text>
              </g>

              <g transform="translate(110, 52)">
                <circle cx="8" cy="8" r="9" stroke="#D5CFC3" strokeWidth="1.2" />
                <text x="8" y="12" textAnchor="middle" fontFamily="'Patrick Hand', cursive" fontSize="11" fill="#8E949F">7</text>
              </g>
            </svg>
          )}

          {/* Step 4: Draw your character */}
          {(illustrationType === 'draw-character' || illustrationType === 'build-fighter') && (
            <svg viewBox="0 0 160 100" className="w-full h-full" fill="none">
              {/* Construction guide lines */}
              <line x1="20" y1="50" x2="140" y2="50" stroke="#E5DFD3" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="80" y1="15" x2="80" y2="85" stroke="#E5DFD3" strokeWidth="1" strokeDasharray="3 3" />

              {/* Head + Helmet with label line */}
              <circle cx="80" cy="30" r="10" stroke="#23252A" strokeWidth="2" fill="#FFFDF9" />
              <path d="M 76 29 L 84 29" stroke="#2B68B4" strokeWidth="2" />
              <path d="M 90 28 L 115 22" stroke="#9C9486" strokeWidth="1" strokeDasharray="2 2" />
              <text x="118" y="24" fontFamily="'Patrick Hand', cursive" fontSize="11" fill="#5C6069">Helmet</text>

              {/* Torso & Armor */}
              <line x1="80" y1="40" x2="80" y2="60" stroke="#23252A" strokeWidth="2.2" />
              <path d="M 74 46 L 86 46" stroke="#2E8557" strokeWidth="2.5" />

              {/* Weapon */}
              <path d="M 80 48 L 102 48 L 105 45" stroke="#23252A" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 103 48 L 125 58" stroke="#9C9486" strokeWidth="1" strokeDasharray="2 2" />
              <text x="127" y="62" fontFamily="'Patrick Hand', cursive" fontSize="11" fill="#5C6069">Blaster</text>

              {/* Legs */}
              <line x1="80" y1="60" x2="72" y2="78" stroke="#23252A" strokeWidth="2" />
              <line x1="80" y1="60" x2="88" y2="78" stroke="#23252A" strokeWidth="2" />
            </svg>
          )}

          {/* Step 5: Battle opponents */}
          {(illustrationType === 'battle-opponents' || illustrationType === 'battle-friends') && (
            <svg viewBox="0 0 160 100" className="w-full h-full" fill="none">
              {/* Bullet cartridges loaded */}
              <g transform="translate(20, 25)">
                <rect x="0" y="0" width="8" height="18" rx="2" stroke="#23252A" strokeWidth="1.5" fill="#D59926" />
                <rect x="12" y="0" width="8" height="18" rx="2" stroke="#23252A" strokeWidth="1.5" fill="#D59926" />
                <rect x="24" y="0" width="8" height="18" rx="2" stroke="#23252A" strokeWidth="1.5" fill="#D59926" />
                <text x="16" y="32" textAnchor="middle" fontFamily="'Patrick Hand', cursive" fontSize="11" fill="#5C6069">3 Bullets</text>
              </g>

              {/* Tracer trajectory arc */}
              <path d="M 58 45 Q 85 20 115 50" stroke="#CE4242" strokeWidth="2.5" strokeDasharray="5 3" strokeLinecap="round" />

              {/* Impact burst crosshair */}
              <g transform="translate(120, 50)">
                <circle cx="0" cy="0" r="14" stroke="#CE4242" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1="-18" y1="0" x2="18" y2="0" stroke="#CE4242" strokeWidth="1.8" />
                <line x1="0" y1="-18" x2="0" y2="18" stroke="#CE4242" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#CE4242" />
              </g>
            </svg>
          )}

          {/* Step 6: Become the last player standing */}
          {illustrationType === 'last-standing' && (
            <svg viewBox="0 0 160 100" className="w-full h-full" fill="none">
              {/* Golden victory crown / laurel on ruled paper */}
              <g transform="translate(55, 20)">
                <path d="M 5 45 L 15 15 L 25 32 L 35 15 L 45 45 Z" fill="#FFD166" stroke="#23252A" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="15" cy="15" r="3" fill="#CE4242" />
                <circle cx="25" cy="32" r="3" fill="#2B68B4" />
                <circle cx="35" cy="15" r="3" fill="#2E8557" />
                <rect x="3" y="45" width="44" height="6" rx="2" fill="#23252A" />
              </g>
              <g transform="translate(80, 78)">
                <text x="0" y="0" textAnchor="middle" fontFamily="'Patrick Hand', cursive" fontSize="13" fontWeight="bold" fill="#23252A">VICTORY!</text>
              </g>
            </svg>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-handwriting font-bold text-[#23252A] mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#5C6069] leading-relaxed font-sans">
          {description}
        </p>
      </div>

      <div className="pt-4 mt-6 border-t border-[#D5CFC3] flex items-center justify-between text-[11px] font-mono text-[#8E949F]">
        <span>RULE ENGINE</span>
        <span className="text-[#2B68B4]">ODD LOGIC</span>
      </div>
    </Card>
  );
};

export default HowItWorksStepCard;
