import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects.js';

/**
 * SoundControls Component (Task 08)
 * Provides sound mute and volume toggling for the notebook audio effects.
 */
export const SoundControls = ({ className = '' }) => {
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted);

  useEffect(() => {
    setIsMuted(soundEffects.isMuted);
  }, []);

  const handleToggleMute = () => {
    const next = soundEffects.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleToggleMute}
        title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        aria-label={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
          isMuted
            ? 'bg-[#FDF2F2] border-[#CE4242]/30 text-[#CE4242]'
            : 'bg-[#FCFAF5] border-[#D5CFC3] text-[#242730] hover:bg-[#F4EFE6]'
        }`}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
};
