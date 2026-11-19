import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects.js';

/**
 * SoundControls Component (Tasks 08 & 12)
 * Provides sound mute toggle and interactive volume slider with persistent storage.
 */
export const SoundControls = ({ className = '' }) => {
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted);
  const [volume, setVolume] = useState(soundEffects.volume);
  const [showSlider, setShowSlider] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsMuted(soundEffects.isMuted);
    setVolume(soundEffects.volume);
  }, []);

  // Close popup slider on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSlider(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMute = (e) => {
    e.stopPropagation();
    const next = soundEffects.toggleMute();
    setIsMuted(next);
    if (!next) {
      soundEffects.playButtonClick();
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEffects.setVolume(val);
    if (isMuted && val > 0) {
      soundEffects.toggleMute();
      setIsMuted(false);
    }
  };

  const percent = Math.round(volume * 100);

  return (
    <div ref={containerRef} className={`relative flex items-center ${className}`}>
      <div className="flex items-center gap-1 bg-[#FAF6EE] border border-[#23252A]/20 rounded-lg p-0.5 shadow-xs">
        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          aria-label={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          className={`p-1.5 rounded-md transition-colors flex items-center justify-center cursor-pointer ${
            isMuted
              ? 'bg-[#FDF2F2] text-[#CE4242]'
              : 'text-[#242730] hover:bg-[#F4EFE6]'
          }`}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : volume < 0.4 ? (
            <Volume1 className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Volume popover trigger / indicator */}
        <button
          type="button"
          onClick={() => setShowSlider((prev) => !prev)}
          title="Adjust Volume"
          className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#5C6069] hover:text-[#242730] transition-colors cursor-pointer select-none"
        >
          {isMuted ? '0%' : `${percent}%`}
        </button>
      </div>

      {/* Floating Volume Slider Card */}
      {showSlider && (
        <div className="absolute right-0 top-full mt-2 z-50 p-3 rounded-xl border-2 border-[#242730] bg-[#FFFDF9] shadow-paper-md w-44 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#242730] font-bold">
            <span>Audio Volume</span>
            <span>{isMuted ? 'Muted' : `${percent}%`}</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 bg-[#E2DDCF] rounded-lg appearance-none cursor-pointer accent-[#242730]"
          />

          <div className="flex justify-between items-center pt-1 border-t border-[#D5CFC3] text-[9px] font-mono text-[#8C929D]">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
};
