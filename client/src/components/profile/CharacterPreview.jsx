
import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { getColorFamily } from '../../config/colors.js';

/**
 * Reusable 2D Hand-Drawn Pencil Character SVG
 */
export const CharacterSvg = ({
  colorHex = '#2563eb',
  className = 'w-full h-full'
}) => (
  <svg
    viewBox="0 0 200 240"
    className={`overflow-visible select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Ground pencil sketch shadow */}
    <ellipse
      cx="100"
      cy="215"
      rx="50"
      ry="8"
      fill="#EFE8DA"
      stroke="#D5CFC3"
      strokeWidth="1.5"
      strokeDasharray="4 3"
    />

    {/* Helmet / Headgear */}
    <circle
      cx="100"
      cy="65"
      r="26"
      stroke="#23252A"
      strokeWidth="3"
      fill="#FFFDF9"
    />

    {/* Helmet Dome & Color Band */}
    <path
      d="M 76 60 C 78 40, 122 40, 124 60"
      stroke={colorHex}
      strokeWidth="4.5"
      strokeLinecap="round"
    />

    <path
      d="M 80 50 C 90 44, 110 44, 120 50"
      stroke={colorHex}
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Visor / Goggles */}
    <rect
      x="84"
      y="60"
      width="32"
      height="12"
      rx="4"
      stroke="#23252A"
      strokeWidth="2.5"
      fill={colorHex}
    />

    {/* Visor Glint */}
    <line
      x1="88"
      y1="64"
      x2="96"
      y2="64"
      stroke="#FFFDF9"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Pencil Smile / Mask line */}
    <path
      d="M 94 80 Q 100 84 106 80"
      stroke="#23252A"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Body / Torso */}
    <line
      x1="100"
      y1="91"
      x2="100"
      y2="148"
      stroke="#23252A"
      strokeWidth="3.5"
    />

    {/* Armor Vest Outline */}
    <path
      d="M 84 102 L 116 102 L 110 138 L 90 138 Z"
      stroke="#23252A"
      strokeWidth="2.5"
      fill="#FFFDF9"
    />

    {/* Color Chest Insignia */}
    <path
      d="M 95 108 L 105 108 L 105 118 L 100 124 L 95 118 Z"
      fill={colorHex}
      stroke={colorHex}
      strokeWidth="1.5"
    />

    {/* Belt */}
    <rect
      x="88"
      y="138"
      width="24"
      height="6"
      rx="1"
      stroke="#23252A"
      strokeWidth="2"
      fill="#EFE8DA"
    />

    {/* Left Arm */}
    <path
      d="M 86 106 L 68 124 L 54 118"
      stroke="#23252A"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Blaster Weapon */}
    <g transform="translate(32, 98)">
      <rect
        x="0"
        y="10"
        width="26"
        height="8"
        rx="2"
        stroke="#23252A"
        strokeWidth="2.5"
        fill="#FFFDF9"
      />

      <rect
        x="6"
        y="12"
        width="10"
        height="4"
        rx="1"
        fill={colorHex}
      />

      <path
        d="M 16 18 L 14 26"
        stroke="#23252A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <line
        x1="0"
        y1="14"
        x2="-3"
        y2="14"
        stroke={colorHex}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>

    {/* Right Arm */}
    <path
      d="M 114 106 L 132 120 L 128 134"
      stroke="#23252A"
      strokeWidth="3"
      strokeLinecap="round"
    />

    <circle cx="128" cy="135" r="4" fill="#23252A" />

    {/* Legs */}
    <path
      d="M 94 148 L 84 186 L 74 190"
      stroke="#23252A"
      strokeWidth="3"
      strokeLinecap="round"
    />

    <path
      d="M 106 148 L 116 186 L 126 190"
      stroke="#23252A"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Boot Color Accents */}
    <circle cx="76" cy="188" r="3.5" fill={colorHex} />
    <circle cx="124" cy="188" r="3.5" fill={colorHex} />
  </svg>
);


/**
 * Compact Mobile On-Screen Popup Live Character Preview
 */
export const CharacterPopupPreview = ({
  nickname = 'Warrior',
  colorFamily = 'BLUE',
  onClick,
  className = ''
}) => {
  const color = getColorFamily(colorFamily);
  const displayName = nickname.trim() || 'Warrior';

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed z-[99999] px-2 py-1 rounded-xl border-2 bg-[#FCFAF3] shadow-sketch-sm flex items-center gap-2 select-none cursor-pointer transition-all ${className}`}
      style={{
        borderColor: color.hex,
        boxShadow: `0 0 10px ${color.hex}30`,

        // MANUAL POSITION CONTROLS
        // Preserves your original position on larger screens.
        // Adjusts only when the viewport is too narrow.
        top: '100px',
        left: 'min(270px, calc(100vw - 145px))'
      }}
    >
      {/* Preview Badge */}
      <div
        className="absolute -top-2 left-3 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold text-white uppercase tracking-wider shadow-sm flex items-center gap-0.5"
        style={{ backgroundColor: color.hex }}
      >
        <span>Preview</span>
      </div>

      {/* Mini Character SVG */}
      <motion.div
        className="w-10 h-12 xs:w-11 xs:h-13 flex items-center justify-center shrink-0"
        animate={{ y: [0, -2, 0] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <CharacterSvg colorHex={color.hex} />
      </motion.div>

      {/* Color & Nickname Info */}
      <div className="flex flex-col min-w-0 pr-1">
        <span
          className="text-[9px] font-mono font-bold uppercase tracking-wider truncate max-w-[70px]"
          style={{ color: color.hex }}
        >
          {color.name}
        </span>

        <span className="text-xs font-handwriting font-bold text-[#23252A] truncate max-w-[75px]">
          {displayName}
        </span>
      </div>
    </motion.div>
  );
};


/**
 * Desktop Character Preview Card
 */
export const CharacterPreview = ({
  nickname = 'Warrior',
  colorFamily = 'BLUE',
  className = ''
}) => {
  const color = getColorFamily(colorFamily);
  const displayName = nickname.trim() || 'Pencil Warrior';

  return (
    <div
      className={`relative w-full max-w-sm mx-auto bg-[#FCFAF3] border-2 border-[#23252A] rounded-2xl p-6 shadow-paper-lg flex flex-col items-center select-none ${className}`}
    >
      

      {/* Character Preview */}
      <motion.div
        className="relative w-48 h-56 sm:w-56 sm:h-64 my-2 flex items-center justify-center card-ruled rounded-xl border border-dashed border-[#D5CFC3] p-4"
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <CharacterSvg colorHex={color.hex} />

        {/* Live Preview Badge */}
        <div className="absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFE8DA] text-[#5C6069] border border-[#D5CFC3]">
          2D PENCIL RIG
        </div>
      </motion.div>

      {/* Nameplate */}
      <div className="w-full mt-3 p-3 rounded-xl bg-[#FFFDF9] border border-[#23252A] shadow-sketch-sm text-center">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E949F]">
          CALL-SIGN
        </div>

        <div className="text-xl sm:text-2xl font-handwriting font-bold text-[#23252A] truncate">
          {displayName}
        </div>

        <div className="text-xs font-mono mt-0.5" style={{ color: color.hex }}>
          {color.name.toUpperCase()} SQUAD
        </div>
      </div>
    </div>
  );
};

export default CharacterPreview;
