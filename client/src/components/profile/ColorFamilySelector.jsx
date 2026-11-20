import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { COLOR_LIST } from '../../config/colors.js';
import { soundEffects } from '../../services/soundEffects.js';

export const ColorFamilySelector = ({
  selectedColor = 'BLUE',
  onSelectColor,
  className = ''
}) => {
  return (
    <div className={`space-y-1 sm:space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs font-mono text-[#2B68B4] font-bold">
          {selectedColor} SELECTED
        </span>
      </div>

      {/* 5 Color family cards - compact single row on mobile, full cards on desktop */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {COLOR_LIST.map((family) => {
          const isSelected = selectedColor.toUpperCase() === family.id;
          return (
            <motion.button
              key={family.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                soundEffects.playButtonClick();
                onSelectColor(family.id);
              }}
              className={`
                relative p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-center sm:text-left
                flex flex-col items-center sm:items-start justify-center sm:justify-between
                transition-all duration-200 select-none min-h-[46px] sm:min-h-[105px] cursor-pointer
                ${isSelected
                  ? 'border-[#23252A] bg-white shadow-md ring-2 ring-[#23252A]/20'
                  : 'border-[#E5E1D8] bg-[#FCFAF5] hover:border-[#B8B1A5] hover:bg-white'
                }
              `}
            >
              {/* Top row: Color circle and selection indicator */}
              <div className="flex items-center justify-center sm:justify-between w-full mb-0.5 sm:mb-3">
                {/* Primary Color Swatch */}
                <div
                  className={`
                    w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full
                    border border-black/10 shadow-sm flex items-center justify-center
                    transition-transform duration-200
                    ${isSelected ? 'scale-110 shadow-[0_0_8px_rgba(0,0,0,0.2)]' : ''}
                  `}
                  style={{ backgroundColor: family.hex }}
                >
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                  )}
                </div>

                {/* Minimal selected indicator on desktop */}
                <div
                  className={`
                    hidden sm:flex w-5 h-5 shrink-0 rounded-full
                    items-center justify-center transition-all duration-200
                    ${isSelected
                      ? 'bg-[#23252A] text-white'
                      : 'border border-[#D5CFC3] bg-transparent'
                    }
                  `}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
              </div>

              {/* Color information */}
              <div className="min-w-0 w-full text-center sm:text-left">
                <div className="font-semibold text-[10px] sm:text-[15px] text-[#23252A] leading-tight truncate">
                  {family.name}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorFamilySelector;
