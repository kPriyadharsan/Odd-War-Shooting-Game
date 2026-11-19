import React from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';
import { COLOR_LIST } from '../../config/colors.js';
import { soundEffects } from '../../services/soundEffects.js';

export const ColorFamilySelector = ({
  selectedColor = 'BLUE',
  onSelectColor,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-wider font-semibold text-[#5C6069] flex items-center gap-1.5">
          <span>Choose Primary Color Family</span>
          <span className="text-[11px] font-mono font-normal text-[#8E949F]">(5 Families)</span>
        </label>
        <span className="text-xs font-mono text-[#2B68B4]">
          {selectedColor} SELECTED
        </span>
      </div>

      {/* 5 Color family cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {COLOR_LIST.map((family) => {
          const isSelected = selectedColor.toUpperCase() === family.id;
          return (
            <motion.button
              key={family.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={() => {
                soundEffects.playButtonClick();
                onSelectColor(family.id);
              }}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all select-none min-h-[95px] cursor-pointer ${
                isSelected
                  ? 'border-2 border-[#23252A] bg-[#FFFDF9] shadow-sketch'
                  : 'border-[#D5CFC3] bg-[#FCFAF3] hover:border-[#9C9486] hover:bg-[#FFFDF9]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {/* Primary Color Swatch */}
                <div
                  className="w-6 h-6 rounded-full border border-[#23252A]/20 shadow-sm flex items-center justify-center"
                  style={{ backgroundColor: family.hex }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>

                {isSelected && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#23252A] text-[#F8F4EB]">
                    ACTIVE
                  </span>
                )}
              </div>

              <div>
                <div className="font-handwriting font-bold text-base text-[#23252A] leading-tight">
                  {family.name}
                </div>
                <div className="text-[10px] font-mono text-[#5C6069]">
                  {family.label}
                </div>
              </div>

              {/* Future Room Shades Preview Bar */}
              <div className="mt-2.5 pt-2 border-t border-[#D5CFC3]/60 flex items-center gap-1" title="Room shades preview">
                {family.shades.map((shade) => (
                  <span
                    key={shade.id}
                    className="flex-1 h-1.5 rounded-full"
                    style={{ backgroundColor: shade.hex }}
                    title={`${shade.name} (${shade.hex})`}
                  />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Architectural note for future room shade compatibility */}
      <div className="p-2.5 rounded-lg bg-[#EFE8DA]/50 border border-[#D5CFC3] text-[11px] font-sans text-[#5C6069] flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-[#2B68B4] shrink-0 mt-0.5" />
        <span>
          <strong>Room Shade Compatibility:</strong> Your choice sets your squad's primary color family. If multiple players in a 2–4 player room pick the same family, the room engine automatically assigns distinct shades (e.g. Navy, Medium, Sky, Pale).
        </span>
      </div>
    </div>
  );
};

export default ColorFamilySelector;
