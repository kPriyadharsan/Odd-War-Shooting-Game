import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { User, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import {
  NotebookBackground,
  Button,
  Card,
  SectionHeading,
  Input
} from '../components/ui/index.js';
import { CharacterPreview } from '../components/profile/CharacterPreview.jsx';
import { ColorFamilySelector } from '../components/profile/ColorFamilySelector.jsx';
import { ProfileReviewModal } from '../components/profile/ProfileReviewModal.jsx';
import { validateNickname } from '../utils/validation.js';
import { loadProfileDraft, saveProfileDraft } from '../store/gameStore.js';
import { COLOR_FAMILIES } from '../config/colors.js';
import { soundEffects } from '../services/soundEffects.js';

export const ProfileSetupPage = () => {
  const shouldReduceMotion = useReducedMotion();

  // Load existing draft if present
  const [profileDraft, setProfileDraft] = useState(loadProfileDraft);
  const [nickname, setNickname] = useState(profileDraft.nickname || '');
  const [colorFamily, setColorFamily] = useState(profileDraft.primaryColor || 'BLUE');
  const [touched, setTouched] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);

  // Validate nickname
  const validation = validateNickname(nickname);

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
    setSaveSuccessMessage(null);
  };

  const handleContinue = (e) => {
    e.preventDefault();
    soundEffects.playButtonClick();
    setTouched(true);

    if (!validation.isValid) {
      return;
    }

    // Save draft
    const updated = saveProfileDraft({
      nickname: validation.trimmed,
      primaryColor: colorFamily
    });

    setProfileDraft(updated);
    setNickname(validation.trimmed); // apply clean trimmed nickname
    setIsReviewOpen(true);
  };

  const handleConfirmReview = () => {
    soundEffects.playMagicShimmer();
    setIsReviewOpen(false);
    setSaveSuccessMessage(`Warrior "${validation.trimmed}" is ready for battle in ${colorFamily} squad!`);
  };

  // Quick random generator for fun
  const handleRandomize = () => {
    const prefixes = ['Shadow', 'Pencil', 'Chalk', 'Graphite', 'Ink', 'Speedy', 'Bullet', 'Sharp'];
    const titles = ['Shooter', 'Warrior', 'Sniper', 'Pilot', 'Ranger', 'Captain', 'Scout'];
    const randName = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${titles[Math.floor(Math.random() * titles.length)]}`;
    const colorKeys = Object.keys(COLOR_FAMILIES);
    const randColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];

    setNickname(randName);
    setColorFamily(randColor);
    setTouched(true);
    setSaveSuccessMessage(null);
  };

  return (
    <NotebookBackground showMargin={true} className="py-4 sm:py-12">
      <div className="max-w-6xl mx-auto pl-9 sm:pl-16 md:pl-20 pr-3 sm:pr-8">
        
        {/* Header */}
        <header className="mb-6 sm:mb-10 border-b border-[#D5CFC3] pb-4 sm:pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#EFE8DA] border border-[#D5CFC3] text-xs font-mono text-[#5C6069] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#2B68B4]" />
            <span>Task 04: Player Profile & Character Selection</span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-handwriting font-bold tracking-tight text-[#23252A]">
            Create Your Player Identity
          </h1>

          <p className="mt-2 text-base sm:text-lg text-[#5C6069] max-w-2xl font-sans">
            "Every warrior needs a name and a color."
          </p>
        </header>

        {/* Success Alert Banner when confirmed */}
        {saveSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-[#F0F7F3] border-2 border-[#2E8557] text-[#2E8557] text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sketch-sm"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-medium">{saveSuccessMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-[#2E8557]/40">
                DRAFT SAVED
              </span>
              <button
                type="button"
                onClick={() => window.location.href = '/rooms'}
                className="px-3 py-1 rounded-lg bg-[#23252A] text-white text-xs font-sans font-medium hover:bg-[#2E8557] transition-colors cursor-pointer"
              >
                Proceed to Rooms &rarr;
              </button>
            </div>
          </motion.div>
        )}

        {/* Main 2-Column Grid: Left Controls, Right Character Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-7 space-y-6">
            <Card variant="default" padding="lg">
              <form onSubmit={handleContinue} className="space-y-6">
                
                {/* 1. Nickname Input Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="player-nickname"
                      className="text-xs uppercase tracking-wider font-semibold text-[#5C6069] flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Warrior Nickname</span>
                    </label>

                    <span
                      className={`text-xs font-mono ${
                        nickname.length > 16
                          ? 'text-[#CE4242] font-bold'
                          : 'text-[#8E949F]'
                      }`}
                    >
                      {nickname.length}/16
                    </span>
                  </div>

                  <Input
                    id="player-nickname"
                    value={nickname}
                    onChange={handleNicknameChange}
                    placeholder="e.g. PencilSniper"
                    maxLength={20}
                    error={touched && !validation.isValid ? validation.error : null}
                    autoFocus
                  />

                  {/* Real-time trimming feedback indicator */}
                  {validation.hasLeadingTrailingSpaces && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#D59926] font-sans">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Note: Leading or trailing spaces will be trimmed upon saving.</span>
                    </div>
                  )}

                  <div className="mt-2 text-[11px] font-sans text-[#8E949F] flex items-center justify-between">
                    <span>Rules: 3–16 characters (letters, numbers, spaces, - and _)</span>
                    <button
                      type="button"
                      onClick={handleRandomize}
                      className="text-xs font-handwriting text-[#2B68B4] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Randomize</span>
                    </button>
                  </div>
                </div>

                {/* 2. Character Color Family Selection */}
                <div className="pt-4 border-t border-[#D5CFC3]">
                  <ColorFamilySelector
                    selectedColor={colorFamily}
                    onSelectColor={(id) => {
                      setColorFamily(id);
                      setSaveSuccessMessage(null);
                    }}
                  />
                </div>

                {/* 3. Action Buttons */}
                <div className="pt-4 border-t border-[#D5CFC3] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs font-mono text-[#8E949F]">
                    LOCAL DRAFT READY
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full sm:w-auto shadow-sketch-dark"
                  >
                    Continue to Review
                  </Button>
                </div>
              </form>
            </Card>

            {/* Architecture Explanatory Card */}
            <Card variant="ruled" padding="md">
              <h4 className="text-sm font-handwriting font-bold text-[#23252A] mb-1">
                About Your Player Identity
              </h4>
              <p className="text-xs text-[#5C6069] leading-relaxed font-sans">
                In this preview stage, your nickname and primary color are stored in a client-side draft. 
                Google OAuth and persistent player profiles will be connected during the final integration stage, 
                allowing you to sync statistics and wins across devices.
              </p>
            </Card>
          </div>

          {/* Right Column: Live 2D Hand-Drawn Character Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="sticky top-24 w-full">
              <CharacterPreview
                nickname={nickname}
                colorFamily={colorFamily}
              />
            </div>
          </div>
        </div>

        {/* Review & Confirmation Modal */}
        <ProfileReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onConfirm={handleConfirmReview}
          profile={{
            nickname: validation.trimmed,
            primaryColor: colorFamily,
            updatedAt: new Date().toISOString()
          }}
        />
      </div>
    </NotebookBackground>
  );
};

export default ProfileSetupPage;
