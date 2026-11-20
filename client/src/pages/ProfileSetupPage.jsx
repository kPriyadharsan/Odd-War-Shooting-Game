import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Calendar,
  Lock,
  ShieldCheck,
  RefreshCw,
  X,
  Mail
} from 'lucide-react';
import {
  NotebookBackground,
  Button,
  Card,
  Input
} from '../components/ui/index.js';
import { CharacterPreview } from '../components/profile/CharacterPreview.jsx';
import { ColorFamilySelector } from '../components/profile/ColorFamilySelector.jsx';
import { validateNickname, validateDob } from '../utils/validation.js';
import { loadProfileDraft, saveProfileDraft } from '../store/gameStore.js';
import { COLOR_FAMILIES } from '../config/colors.js';
import { soundEffects } from '../services/soundEffects.js';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../services/authApi.js';

export const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { user, isAuthenticated, updateProfile } = useAuth();

  const isEditingExisting = Boolean(user && user.isProfileComplete);

  // Initial field states: NEVER prefill nickname with user.displayName!
  // If user already has a game nickname (from existing complete/partial profile), preserve it.
  const [nickname, setNickname] = useState(() => {
    if (user?.nickname && !user.nickname.startsWith('Warrior_') && !user.nickname.startsWith('Player_')) {
      return user.nickname;
    }
    const draft = loadProfileDraft();
    return draft.nickname || '';
  });

  const [colorFamily, setColorFamily] = useState(() => {
    return user?.primaryColor || loadProfileDraft().primaryColor || 'BLUE';
  });

  const [dob, setDob] = useState(() => {
    if (user?.dob) {
      try {
        return new Date(user.dob).toISOString().split('T')[0];
      } catch {
        return '';
      }
    }
    return '';
  });

  const [touched, setTouched] = useState({
    nickname: false,
    dob: false
  });

  const [nicknameAvailability, setNicknameAvailability] = useState({
    checked: false,
    checking: false,
    available: true,
    message: ''
  });

  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Synchronize existing valid fields if user loads after mount
  useEffect(() => {
    if (user) {
      if (user.nickname && !user.nickname.startsWith('Warrior_') && !user.nickname.startsWith('Player_')) {
        setNickname(prev => prev || user.nickname);
      }
      if (user.primaryColor) {
        setColorFamily(user.primaryColor);
      }
      if (user.dob) {
        try {
          const formatted = new Date(user.dob).toISOString().split('T')[0];
          setDob(prev => prev || formatted);
        } catch {
          // ignore
        }
      }
    }
  }, [user]);

  // Real-time debounced nickname availability check
  const debounceTimerRef = useRef(null);
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const clean = nickname.trim();
    const validation = validateNickname(clean);

    if (!validation.isValid) {
      setNicknameAvailability({ checked: false, checking: false, available: false, message: '' });
      return;
    }

    // If nickname is identical to user's current nickname, it is available
    if (user?.nickname && clean.toLowerCase() === user.nickname.toLowerCase()) {
      setNicknameAvailability({ checked: true, checking: false, available: true, message: 'Current nickname' });
      return;
    }

    setNicknameAvailability(prev => ({ ...prev, checking: true }));

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await authApi.checkNicknameAvailability(clean);
        setNicknameAvailability({
          checked: true,
          checking: false,
          available: res.available,
          message: res.message || (res.available ? 'Nickname is available' : 'Nickname is already taken')
        });
      } catch {
        setNicknameAvailability({ checked: false, checking: false, available: true, message: '' });
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [nickname, user?.nickname]);

  // Validations
  const nicknameVal = validateNickname(nickname);
  const dobVal = validateDob(dob);
  const isFormValid = nicknameVal.isValid && dobVal.isValid && (nicknameAvailability.available || (user?.nickname && nickname.trim().toLowerCase() === user.nickname.toLowerCase()));

  const handleRandomize = () => {
    const prefixes = ['Shadow', 'Pencil', 'Chalk', 'Graphite', 'Ink', 'Speedy', 'Bullet', 'Sharp', 'Swift', 'Blaze'];
    const titles = ['Warrior', 'Sniper', 'Pilot', 'Ranger', 'Captain', 'Scout', 'Commander', 'Ninja'];
    const randName = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${titles[Math.floor(Math.random() * titles.length)]}`;
    const colorKeys = Object.keys(COLOR_FAMILIES);
    const randColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];

    setNickname(randName);
    setColorFamily(randColor);
    setTouched(prev => ({ ...prev, nickname: true }));
    setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    soundEffects.playButtonClick();
    setTouched({ nickname: true, dob: true });
    setServerError(null);

    if (!nicknameVal.isValid) {
      setServerError(nicknameVal.error);
      return;
    }

    if (!dobVal.isValid) {
      setServerError(dobVal.error);
      return;
    }

    if (!nicknameAvailability.available && !(user?.nickname && nickname.trim().toLowerCase() === user.nickname.toLowerCase())) {
      setServerError('The chosen nickname is already taken. Please choose another.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isAuthenticated) {
        // Authenticated Google user: save to server
        const updated = await updateProfile({
          nickname: nicknameVal.trimmed,
          primaryColor: colorFamily,
          dob: dobVal.isoString
        });

        if (!updated || !updated.isProfileComplete) {
          throw new Error('Server could not confirm profile completion.');
        }

        soundEffects.playMagicShimmer();
        setSuccessMessage('Player identity created successfully! Entering the battlefield...');

        // Save local copy
        saveProfileDraft({
          nickname: nicknameVal.trimmed,
          primaryColor: colorFamily
        });

        setTimeout(() => {
          const destination = location.state?.from?.pathname || '/lobby';
          navigate(destination, { replace: true });
        }, 800);
      } else {
        // Guest user: save to local store
        saveProfileDraft({
          nickname: nicknameVal.trimmed,
          primaryColor: colorFamily
        });
        soundEffects.playMagicShimmer();
        setSuccessMessage('Guest profile saved! Entering the battlefield...');
        setTimeout(() => {
          navigate('/lobby', { replace: true });
        }, 500);
      }
    } catch (err) {
      console.error('[ProfileSetupPage] Submission failed:', err);
      setServerError(err.message || 'Failed to save profile. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Max selectable date is today
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <NotebookBackground showMargin={true} className="py-4 sm:py-10">
      <div className="max-w-5xl mx-auto pl-8 sm:pl-16 md:pl-20 pr-3 sm:pr-8">
        
        {/* Onboarding Header */}
        <header className="mb-6 sm:mb-8 border-b border-[#D5CFC3] pb-4 sm:pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#EFE8DA] border border-[#D5CFC3] text-xs font-mono text-[#5C6069] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#2B68B4]" />
            <span>
              {isEditingExisting ? 'Player Settings & Customization' : 'Mandatory Warrior Onboarding'}
            </span>
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-handwriting font-bold tracking-tight text-[#23252A]">
            {isEditingExisting ? 'Edit Player Profile' : 'WELCOME TO ODD WARS'}
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[#5C6069] max-w-2xl font-sans">
            {isEditingExisting
              ? 'Update your game call-sign nickname, pencil shade, and date of birth.'
              : 'Create your player identity before entering the battlefield.'}
          </p>
        </header>

        {/* Separate Google Identity Card */}
        {isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-[#FAF6EC] border border-[#D5CFC3] shadow-sketch-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || 'Google Account'}
                  className="w-10 h-10 rounded-full border border-[#23252A] shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#23252A] text-white flex items-center justify-center font-bold text-sm">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-semibold text-xs text-[#23252A]">
                    {user.displayName || 'Google Account Holder'}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-mono text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#5C6069] mt-0.5">
                  <Mail className="w-3 h-3 text-[#6B7280]" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#8E949F] sm:text-right max-w-xs">
              <span className="text-[#2B68B4] font-semibold">Separate Identity:</span> Your Google name and email are kept private and never used as your public battle nickname.
            </div>
          </motion.div>
        )}

        {/* Error Alert Banner */}
        {serverError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-[#FDF2F2] border-2 border-[#CE4242] text-[#CE4242] text-xs sm:text-sm flex items-start gap-3 shadow-sketch-sm"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Action Required:</span>
              <span>{serverError}</span>
            </div>
            <button
              onClick={() => setServerError(null)}
              className="text-[#CE4242] hover:text-[#991B1B] p-1"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-[#F0F7F3] border-2 border-[#2E8557] text-[#2E8557] text-sm flex items-center gap-3 shadow-sketch-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </motion.div>
        )}

        {/* Main 2-Column Grid: Form Controls (Left) + Live Character Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-start">
          
          {/* Left Column: Form with all 3 required fields on ONE screen */}
          <div className="lg:col-span-7 space-y-6">
            <Card variant="default" padding="lg">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* ========================================================= */}
                {/* FIELD 1: GAME NICKNAME                                   */}
                {/* ========================================================= */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="player-nickname"
                      className="text-xs uppercase tracking-wider font-semibold text-[#23252A] flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-[#2B68B4]" />
                      <span>1. Game Nickname</span>
                      <span className="text-[#CE4242] font-bold">*</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {nicknameAvailability.checking && (
                        <span className="text-[10px] font-mono text-[#5C6069] flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Checking...
                        </span>
                      )}
                      {nicknameAvailability.checked && !nicknameAvailability.checking && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                            nicknameAvailability.available
                              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                              : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                          }`}
                        >
                          {nicknameAvailability.available ? '✓ Available' : '✕ Taken'}
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono ${
                          nickname.length > 24
                            ? 'text-[#CE4242] font-bold'
                            : 'text-[#8E949F]'
                        }`}
                      >
                        {nickname.length}/24
                      </span>
                    </div>
                  </div>

                  <Input
                    id="player-nickname"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setTouched(prev => ({ ...prev, nickname: true }));
                      setServerError(null);
                    }}
                    placeholder="Enter your custom call-sign (e.g. SharpShooter)"
                    maxLength={24}
                    error={touched.nickname && !nicknameVal.isValid ? nicknameVal.error : null}
                    autoFocus={!isEditingExisting}
                  />

                  {/* Real-time trimming feedback indicator */}
                  {nicknameVal.hasLeadingTrailingSpaces && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#D59926] font-sans">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Spaces at beginning/end will be trimmed automatically.</span>
                    </div>
                  )}

                  <div className="mt-2 text-[11px] font-sans text-[#5C6069] flex items-center justify-between">
                    <span>2–24 characters (letters, numbers, spaces, - and _)</span>
                    <button
                      type="button"
                      onClick={handleRandomize}
                      className="text-xs font-handwriting text-[#2B68B4] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Random Suggestion</span>
                    </button>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* FIELD 2: CHARACTER COLOUR                                */}
                {/* ========================================================= */}
                <div className="pt-5 border-t border-[#D5CFC3]">
                  <div className="mb-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#23252A] flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#2B68B4]" />
                      <span>2. Character Colour</span>
                      <span className="text-[#CE4242] font-bold">*</span>
                    </span>
                  </div>

                  <ColorFamilySelector
                    selectedColor={colorFamily}
                    onSelectColor={(id) => {
                      setColorFamily(id);
                      setServerError(null);
                    }}
                  />
                </div>

                {/* ========================================================= */}
                {/* FIELD 3: DATE OF BIRTH (DOB)                             */}
                {/* ========================================================= */}
                <div className="pt-5 border-t border-[#D5CFC3]">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="player-dob"
                      className="text-xs uppercase tracking-wider font-semibold text-[#23252A] flex items-center gap-2"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#2B68B4]" />
                      <span>3. Date of Birth (DOB)</span>
                      <span className="text-[#CE4242] font-bold">*</span>
                    </label>

                    <span className="text-[11px] font-mono text-[#059669] flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Strictly Private
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id="player-dob"
                      type="date"
                      value={dob}
                      max={maxDate}
                      min="1900-01-01"
                      onChange={(e) => {
                        setDob(e.target.value);
                        setTouched(prev => ({ ...prev, dob: true }));
                        setServerError(null);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border-2 font-mono text-sm bg-white text-[#23252A] focus:outline-none transition-all shadow-sketch-sm ${
                        touched.dob && !dobVal.isValid
                          ? 'border-[#CE4242] bg-[#FEF2F2]'
                          : 'border-[#23252A] focus:border-[#2B68B4]'
                      }`}
                    />
                  </div>

                  {touched.dob && !dobVal.isValid && (
                    <p className="mt-1.5 text-xs text-[#CE4242] font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{dobVal.error}</span>
                    </p>
                  )}

                  {/* Privacy statement box */}
                  <div className="mt-3 p-2.5 rounded-lg bg-[#FAF6EC] border border-[#D5CFC3] text-[11px] font-sans text-[#5C6069] flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#2B68B4] shrink-0 mt-0.5" />
                    <span>
                      <strong>Privacy Guarantee:</strong> Date of birth is collected for player account security and profile verification purposes. It is stored securely, kept strictly confidential, and <em>never</em> displayed to opponents or in public leaderboards.
                    </span>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* SUBMISSION & ACTIONS                                      */}
                {/* ========================================================= */}
                <div className="pt-6 border-t border-[#D5CFC3] flex flex-col sm:flex-row items-center justify-between gap-3">
                  {isEditingExisting ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate('/profile')}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  ) : (
                    <div className="text-xs font-mono text-[#8E949F]">
                      ALL 3 DETAILS REQUIRED
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting || !isFormValid}
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full sm:w-auto shadow-sketch-dark"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Profile...</span>
                      </span>
                    ) : isEditingExisting ? (
                      'SAVE CHANGES'
                    ) : (
                      'CREATE MY PLAYER PROFILE'
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Column: Live 2D Hand-Drawn Character Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="sticky top-20 w-full space-y-4">
              <CharacterPreview
                nickname={nickname || 'Your Warrior'}
                colorFamily={colorFamily}
              />

              <Card variant="ruled" padding="sm" className="text-center">
                <div className="font-handwriting font-bold text-sm text-[#23252A]">
                  Authoritative Pencil Station
                </div>
                <div className="font-mono text-[10px] text-[#5C6069] mt-0.5">
                  Your nickname, color, and stats will synchronize across all ODD WARS matches.
                </div>
              </Card>
            </div>
          </div>
        </div>

      </div>
    </NotebookBackground>
  );
};

export default ProfileSetupPage;
