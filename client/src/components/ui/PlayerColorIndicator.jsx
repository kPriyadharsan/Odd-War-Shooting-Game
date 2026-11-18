import React from 'react';
import { motion } from 'framer-motion';

export const PLAYER_COLORS = {
  red: {
    id: 'red',
    name: 'Red Ink',
    hex: '#CE4242',
    bgClass: 'bg-[#CE4242]',
    borderClass: 'border-[#CE4242]',
    lightBg: 'bg-[#FDF2F2]',
    ringClass: 'ring-[#CE4242]'
  },
  blue: {
    id: 'blue',
    name: 'Blue Ink',
    hex: '#2B68B4',
    bgClass: 'bg-[#2B68B4]',
    borderClass: 'border-[#2B68B4]',
    lightBg: 'bg-[#F0F5FB]',
    ringClass: 'ring-[#2B68B4]'
  },
  green: {
    id: 'green',
    name: 'Chalk Green',
    hex: '#2E8557',
    bgClass: 'bg-[#2E8557]',
    borderClass: 'border-[#2E8557]',
    lightBg: 'bg-[#F0F7F3]',
    ringClass: 'ring-[#2E8557]'
  },
  yellow: {
    id: 'yellow',
    name: 'Pencil Yellow',
    hex: '#D59926',
    bgClass: 'bg-[#D59926]',
    borderClass: 'border-[#D59926]',
    lightBg: 'bg-[#FCF8EE]',
    ringClass: 'ring-[#D59926]'
  },
  charcoal: {
    id: 'charcoal',
    name: 'Graphite',
    hex: '#242730',
    bgClass: 'bg-[#242730]',
    borderClass: 'border-[#242730]',
    lightBg: 'bg-[#F2F3F5]',
    ringClass: 'ring-[#242730]'
  }
};

export const PlayerColorIndicator = ({
  color = 'red', // 'red' | 'blue' | 'green' | 'yellow' | 'charcoal'
  variant = 'badge', // 'swatch' | 'badge' | 'avatar'
  label,
  selected = false,
  onClick,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = ''
}) => {
  const colorData = PLAYER_COLORS[color] || PLAYER_COLORS.red;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size] || 'w-6 h-6';

  // Swatch variant: circular colored pencil dot with paper ring
  if (variant === 'swatch') {
    return (
      <motion.button
        type="button"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        title={colorData.name}
        className={`relative rounded-full border-2 ${
          selected ? 'border-[#23252A] ring-2 ring-[#23252A]/20' : 'border-[#D5CFC3]'
        } p-0.5 bg-[#FFFDF9] transition-all cursor-pointer ${className}`}
      >
        <span
          className={`block rounded-full ${colorData.bgClass} ${sizeClasses}`}
        />
      </motion.button>
    );
  }

  // Avatar ring variant
  if (variant === 'avatar') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full border-2 ${colorData.borderClass} ${colorData.lightBg} p-1 ${className}`}
      >
        <span className={`rounded-full ${colorData.bgClass} ${sizeClasses}`} />
      </div>
    );
  }

  // Badge variant: pill with swatch dot and name
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full border text-xs font-medium bg-[#FFFDF9] transition-all ${
        selected
          ? 'border-[#23252A] shadow-sketch-sm'
          : 'border-[#D5CFC3] hover:border-[#9C9486]'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${colorData.bgClass}`} />
      <span className="text-[#23252A]">{label || colorData.name}</span>
    </div>
  );
};

export default PlayerColorIndicator;
