import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Target, Shield, Zap, Sparkles } from 'lucide-react';
import { animatePencilStroke } from '../../animations/strokeAnimations.js';
import { Button } from '../ui/Button.jsx';

/**
 * HeroNotebookIllustration Component
 * Renders an authentic school notebook battlefield with hand-drawn pencil fighters,
 * odd-numbered battle stations (1, 3, 5, 7, 9), bullet trajectory paths, and pencil annotations.
 */
export const HeroNotebookIllustration = ({ className = '' }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeNumber, setActiveNumber] = useState(5);
  const containerRef = useRef(null);
  const pathRefs = useRef([]);

  const addPathRef = (el) => {
    if (el && !pathRefs.current.includes(el)) {
      pathRefs.current.push(el);
    }
  };

  const runPencilDrawing = () => {
    if (pathRefs.current.length === 0) return;
    setIsAnimating(true);
    animatePencilStroke(pathRefs.current, {
      duration: 1.1,
      stagger: 0.12,
      ease: 'power2.out',
      onComplete: () => setIsAnimating(false)
    });
  };

  useEffect(() => {
    runPencilDrawing();
  }, []);

  const oddPositions = [
    { num: 1, label: 'Base Alpha', x: 50, y: 55, color: '#2B68B4', role: 'Blue Base' },
    { num: 3, label: 'Bunker 3', x: 190, y: 70, color: '#2E8557', role: 'Cover Station' },
    { num: 5, label: 'Central Arena', x: 140, y: 140, color: '#D59926', role: 'Hotspot' },
    { num: 7, label: 'Ridge 7', x: 80, y: 215, color: '#CE4242', role: 'Red Outpost' },
    { num: 9, label: 'Sniper Nest', x: 230, y: 220, color: '#23252A', role: 'Perch' },
  ];

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-lg mx-auto bg-[#FCFAF3] border-2 border-[#23252A] rounded-2xl shadow-paper-lg overflow-hidden select-none ${className}`}
    >
      {/* Top notebook binding tape accent */}
      <div className="h-4 bg-[#EFE8DA] border-b border-[#D5CFC3] flex items-center justify-between px-4 text-[10px] font-mono text-[#5C6069]">
        <span>EXERCISE BOOK — MATH & DOODLES</span>
        <span className="text-[#CE4242] font-bold">PAGE 033 (ODD)</span>
      </div>

      {/* Ruled notebook sheet surface */}
      <div className="relative p-3 sm:p-6 card-ruled min-h-[340px] sm:min-h-[420px] flex flex-col justify-between">
        {/* Red notebook margin line on left */}
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 w-0.5 bg-[#F0A8A8]/60 pointer-events-none" />

        {/* Notebook top handwritten note */}
        <div className="flex items-center justify-between pl-6 sm:pl-10 text-xs font-handwriting text-[#5C6069] mb-2">
          <span className="flex items-center gap-1.5 font-bold text-[#23252A] truncate pr-1">
            <Target className="w-3.5 h-3.5 text-[#CE4242] shrink-0" />
            <span className="truncate">"Battle #12 — Odd Turns Rule!"</span>
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] bg-[#EFE8DA] px-2 py-0.5 rounded border border-[#D5CFC3] shrink-0">
            2–4 PLAYERS
          </span>
        </div>

        {/* The Battlefield SVG */}
        <div className="relative flex-1 flex items-center justify-center my-2">
          <svg
            viewBox="0 0 300 270"
            className="w-full h-full max-h-[320px] overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dashed connector grid between odd numbers */}
            <path
              ref={addPathRef}
              d="M 60 70 L 190 70 L 140 140 L 80 215 L 230 220 L 140 140 Z"
              stroke="#D5CFC3"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Bullet trajectory 1: Blue Fighter (Spot 1) aiming at Spot 7 */}
            <path
              ref={addPathRef}
              d="M 65 75 Q 110 120 78 200"
              stroke="#2B68B4"
              strokeWidth="2.5"
              strokeDasharray="6 3"
              strokeLinecap="round"
            />
            {/* Impact spark on trajectory */}
            <circle cx="78" cy="200" r="4" fill="#CE4242" />

            {/* Bullet trajectory 2: Red Fighter (Spot 7) return fire towards Spot 5 */}
            <path
              ref={addPathRef}
              d="M 85 210 Q 120 180 135 150"
              stroke="#CE4242"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Hand-drawn Odd Stations (1, 3, 5, 7, 9) */}
            {oddPositions.map((pos) => {
              const isActive = activeNumber === pos.num;
              return (
                <g
                  key={pos.num}
                  className="cursor-pointer transition-transform hover:scale-110"
                  onClick={() => setActiveNumber(pos.num)}
                >
                  {/* Outer hand-drawn sketch circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="20"
                    fill={isActive ? '#FFFDF9' : '#FCFAF3'}
                    stroke={pos.color}
                    strokeWidth={isActive ? '3' : '2'}
                    className="transition-colors"
                  />

                  {/* Inner accent ring */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="15"
                    stroke="#D5CFC3"
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />

                  {/* Odd Number label */}
                  <text
                    x={pos.x}
                    y={pos.y + 6}
                    textAnchor="middle"
                    fontFamily="'Patrick Hand', cursive, sans-serif"
                    fontSize="18"
                    fontWeight="bold"
                    fill={pos.color}
                  >
                    {pos.num}
                  </text>
                </g>
              );
            })}

            {/* Fighter 1 (Blue Player at Station 1): Hand-drawn pencil stick figure */}
            <g transform="translate(40, 22)">
              {/* Helmet/Head */}
              <circle
                ref={addPathRef}
                cx="15"
                cy="10"
                r="7"
                stroke="#23252A"
                strokeWidth="2"
                fill="#FFFDF9"
              />
              {/* Visor */}
              <path
                ref={addPathRef}
                d="M 12 9 L 18 9"
                stroke="#2B68B4"
                strokeWidth="2"
              />
              {/* Body */}
              <path
                ref={addPathRef}
                d="M 15 17 L 15 28"
                stroke="#23252A"
                strokeWidth="2"
              />
              {/* Gun / Arm */}
              <path
                ref={addPathRef}
                d="M 15 20 L 25 24 L 28 24"
                stroke="#23252A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Legs */}
              <path
                ref={addPathRef}
                d="M 15 28 L 10 36 M 15 28 L 20 36"
                stroke="#23252A"
                strokeWidth="2"
              />
            </g>

            {/* Fighter 2 (Red Player at Station 7): Opponent stick fighter */}
            <g transform="translate(95, 195)">
              {/* Helmet/Head */}
              <circle
                ref={addPathRef}
                cx="15"
                cy="10"
                r="7"
                stroke="#23252A"
                strokeWidth="2"
                fill="#FFFDF9"
              />
              {/* Eye squint */}
              <path
                ref={addPathRef}
                d="M 13 9 L 16 11 M 13 11 L 16 9"
                stroke="#CE4242"
                strokeWidth="1.5"
              />
              {/* Body */}
              <path
                ref={addPathRef}
                d="M 15 17 L 15 27"
                stroke="#23252A"
                strokeWidth="2"
              />
              {/* Aiming Bazooka / Rifle */}
              <path
                ref={addPathRef}
                d="M 15 20 L 7 17 L 2 17"
                stroke="#23252A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Legs */}
              <path
                ref={addPathRef}
                d="M 15 27 L 11 35 M 15 27 L 19 35"
                stroke="#23252A"
                strokeWidth="2"
              />
            </g>

            {/* Pencil scribble smoke / muzzle flash */}
            <path
              ref={addPathRef}
              d="M 68 47 Q 73 43 78 48 T 83 45"
              stroke="#D5CFC3"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Center #5 Crown / Loot box doodle */}
            <g transform="translate(130, 105)">
              <rect
                x="2"
                y="6"
                width="16"
                height="12"
                stroke="#D59926"
                strokeWidth="1.8"
                fill="#FFFDF9"
                rx="2"
              />
              <path d="M 2 10 L 18 10" stroke="#D59926" strokeWidth="1.5" />
              <path d="M 10 6 L 10 18" stroke="#D59926" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        {/* Bottom illustration control bar */}
        <div className="flex items-center justify-between pt-3 border-t border-[#D5CFC3] pl-8 sm:pl-10">
          <div className="text-xs font-sans text-[#5C6069] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2E8557] animate-pulse" />
            <span>Station Selected:</span>
            <span className="font-handwriting font-bold text-base text-[#23252A]">
              #{activeNumber} ({oddPositions.find((p) => p.num === activeNumber)?.label})
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={runPencilDrawing}
            disabled={isAnimating}
            title="Re-draw pencil strokes"
          >
            Re-Draw
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroNotebookIllustration;
