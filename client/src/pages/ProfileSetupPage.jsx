import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import {
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Calendar,
  ShieldCheck,
  RefreshCw,
  X,
  Mail,
  Shield,
  Pencil,
  ChevronRight
} from 'lucide-react';

import {
  NotebookBackground,
  Button,
  Input
} from '../components/ui/index.js';

import {
  CharacterPreview,
  CharacterPopupPreview
} from '../components/profile/CharacterPreview.jsx';

import { ColorFamilySelector } from '../components/profile/ColorFamilySelector.jsx';
import { ScrollableDobPicker } from '../components/profile/ScrollableDobPicker.jsx';

import {
  validateNickname,
  validateDob
} from '../utils/validation.js';

import {
  loadProfileDraft,
  saveProfileDraft
} from '../store/gameStore.js';

import { COLOR_FAMILIES } from '../config/colors.js';
import { soundEffects } from '../services/soundEffects.js';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../services/authApi.js';

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif';

export const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const {
    user,
    isAuthenticated,
    updateProfile
  } = useAuth();

  const isEditingExisting = Boolean(
    user && user.isProfileComplete
  );

  // --------------------------------------------------
  // INITIAL PROFILE VALUES
  // --------------------------------------------------

  const [nickname, setNickname] = useState(() => {
    if (
      user?.nickname &&
      !user.nickname.startsWith('Warrior_') &&
      !user.nickname.startsWith('Player_')
    ) {
      return user.nickname;
    }

    return loadProfileDraft().nickname || '';
  });

  const [colorFamily, setColorFamily] = useState(
    () => user?.primaryColor ||
      loadProfileDraft().primaryColor ||
      'BLUE'
  );

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
    available: false,
    message: ''
  });

  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  // --------------------------------------------------
  // SYNCHRONIZE AUTHENTICATED USER
  // --------------------------------------------------

  useEffect(() => {
    if (!user) return;

    if (
      user.nickname &&
      !user.nickname.startsWith('Warrior_') &&
      !user.nickname.startsWith('Player_')
    ) {
      setNickname(prev => prev || user.nickname);
    }

    if (user.primaryColor) {
      setColorFamily(user.primaryColor);
    }

    if (user.dob) {
      try {
        const formatted = new Date(user.dob)
          .toISOString()
          .split('T')[0];

        setDob(prev => prev || formatted);
      } catch {
        // Ignore invalid server DOB
      }
    }
  }, [user]);

  // --------------------------------------------------
  // NICKNAME AVAILABILITY
  // Debounced + protects against stale responses
  // --------------------------------------------------

  const checkNickname = useCallback(async (clean) => {
    const requestId = ++requestIdRef.current;

    try {
      const response = await authApi.checkNicknameAvailability(clean);

      if (requestId !== requestIdRef.current) return;

      setNicknameAvailability({
        checked: true,
        checking: false,
        available: response.available,
        message: response.message ||
          (response.available
            ? 'Nickname available'
            : 'Nickname already taken')
      });

    } catch {
      if (requestId !== requestIdRef.current) return;

      // Let the server perform final validation during submission.
      setNicknameAvailability({
        checked: true,
        checking: false,
        available: true,
        message: 'Could not verify right now'
      });
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceTimerRef.current);

    const clean = nickname.trim();
    const validation = validateNickname(clean);

    const isCurrentNickname =
      user?.nickname &&
      clean.toLowerCase() === user.nickname.toLowerCase();

    if (!validation.isValid) {
      requestIdRef.current++;

      setNicknameAvailability({
        checked: false,
        checking: false,
        available: false,
        message: ''
      });

      return;
    }

    if (isCurrentNickname) {
      requestIdRef.current++;

      setNicknameAvailability({
        checked: true,
        checking: false,
        available: true,
        message: 'Your current nickname'
      });

      return;
    }

    setNicknameAvailability({
      checked: false,
      checking: true,
      available: false,
      message: ''
    });

    debounceTimerRef.current = setTimeout(() => {
      checkNickname(clean);
    }, 450);

    return () => {
      clearTimeout(debounceTimerRef.current);
      requestIdRef.current++;
    };

  }, [nickname, user?.nickname, checkNickname]);

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const nicknameVal = useMemo(
    () => validateNickname(nickname),
    [nickname]
  );

  const dobVal = useMemo(
    () => validateDob(dob),
    [dob]
  );

  const isCurrentNickname =
    user?.nickname &&
    nickname.trim().toLowerCase() === user.nickname.toLowerCase();

  const isFormValid =
    nicknameVal.isValid &&
    dobVal.isValid &&
    nicknameAvailability.checked &&
    !nicknameAvailability.checking &&
    (nicknameAvailability.available || isCurrentNickname);

  const nicknameStatus = useMemo(() => {
    if (!nickname.trim() || !nicknameVal.isValid) return null;

    if (nicknameAvailability.checking) {
      return {
        label: 'Checking availability',
        type: 'loading'
      };
    }

    if (!nicknameAvailability.checked) return null;

    if (nicknameAvailability.available) {
      return {
        label: nicknameAvailability.message === 'Your current nickname'
          ? 'Current nickname'
          : 'Available',
        type: 'success'
      };
    }

    return {
      label: 'Already taken',
      type: 'error'
    };

  }, [nickname, nicknameVal.isValid, nicknameAvailability]);

  // --------------------------------------------------
  // RANDOM PROFILE GENERATOR
  // --------------------------------------------------

  const handleRandomize = () => {
    const prefixes = [
      'Shadow', 'Pencil', 'Chalk', 'Graphite',
      'Ink', 'Speedy', 'Bullet', 'Sharp',
      'Swift', 'Blaze'
    ];

    const titles = [
      'Warrior', 'Sniper', 'Pilot', 'Ranger',
      'Captain', 'Scout', 'Commander', 'Ninja'
    ];

    const randomName =
      prefixes[Math.floor(Math.random() * prefixes.length)] +
      titles[Math.floor(Math.random() * titles.length)];

    const colorKeys = Object.keys(COLOR_FAMILIES);

    const randomColor =
      colorKeys[Math.floor(Math.random() * colorKeys.length)];

    soundEffects.playButtonClick();

    setNickname(randomName);
    setColorFamily(randomColor);

    setTouched(prev => ({
      ...prev,
      nickname: true
    }));

    setServerError('');
    setSuccessMessage('');
  };

  // --------------------------------------------------
  // PROFILE SUBMISSION
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    soundEffects.playButtonClick();

    setTouched({
      nickname: true,
      dob: true
    });

    setServerError('');
    setSuccessMessage('');

    if (!nicknameVal.isValid) {
      setServerError(nicknameVal.error);
      return;
    }

    if (!dobVal.isValid) {
      setServerError(dobVal.error);
      return;
    }

    if (
      !nicknameAvailability.available &&
      !isCurrentNickname
    ) {
      setServerError(
        'This nickname is already taken. Please choose another.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const profileData = {
        nickname: nicknameVal.trimmed,
        primaryColor: colorFamily,
        dob: dobVal.isoString
      };

      if (isAuthenticated) {
        const updated = await updateProfile(profileData);

        if (!updated || !updated.isProfileComplete) {
          throw new Error(
            'Server could not confirm profile completion.'
          );
        }

        saveProfileDraft({
          nickname: nicknameVal.trimmed,
          primaryColor: colorFamily
        });

        soundEffects.playMagicShimmer();

        setSuccessMessage(
          'Player identity created successfully!'
        );

        const destination =
          location.state?.from?.pathname || '/lobby';

        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 900);

      } else {
        saveProfileDraft({
          nickname: nicknameVal.trimmed,
          primaryColor: colorFamily
        });

        soundEffects.playMagicShimmer();

        setSuccessMessage(
          'Guest profile saved successfully!'
        );

        setTimeout(() => {
          navigate('/lobby', { replace: true });
        }, 700);
      }

    } catch (error) {
      console.error(
        '[ProfileSetupPage] Submission failed:',
        error
      );

      setServerError(
        error.message ||
        'Unable to save your profile. Please try again.'
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------
  // REUSABLE STATUS BANNER
  // --------------------------------------------------

  const Banner = ({ type, children, onClose }) => {
    const success = type === 'success';

    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          flex items-start gap-2
          p-2 sm:p-3 rounded-xl border
          text-xs
          ${success
            ? 'bg-[#F0F7F3] border-[#B8D9C4] text-[#246B43]'
            : 'bg-[#FDF2F2] border-[#E8BDBD] text-[#B52E2E]'
          }
        `}
      >
        {success ? (
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        )}

        <span className="flex-1 leading-snug">
          {children}
        </span>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    );
  };

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <NotebookBackground
      showMargin={false}
      className="
        min-h-[calc(100vh-3.5rem)] min-h-[calc(100dvh-3.5rem)]
        flex flex-col
        overflow-x-hidden overflow-y-auto
        py-2 sm:py-4 lg:py-8
        lg:overflow-visible
      "
    >
      <div
        className="
          w-full max-w-6xl mx-auto
          flex-1
          flex flex-col
          px-2.5 sm:px-6 lg:px-8
          py-2 sm:py-3 lg:py-0
        "
        style={{ fontFamily: FONT_STACK }}
      >

        {/* ============================================ */}
        {/* DESKTOP HEADER (lg only) */}
        {/* ============================================ */}
        <header className="hidden lg:flex items-center justify-between gap-3 shrink-0 pb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D5CFC3] bg-[#FAF6EC] text-xs font-medium text-[#5C6069]">
            <Shield className="w-3.5 h-3.5" />
            Player identity station
          </div>
          <span className="text-xs font-mono text-[#8A857D]">
            ODD WAR · ONBOARDING
          </span>
        </header>

        {/* ============================================ */}
        {/* ACCOUNT INFORMATION + FLOATING PREVIEW */}
        {/* ============================================ */}
        <div className="relative mb-2 sm:mb-3 shrink-0">
          {isAuthenticated && user ? (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                flex items-center gap-2.5 sm:gap-3
                p-2 sm:p-2.5
                rounded-xl
                bg-[#FAF6EC]
                border border-[#DED7C9]
                pr-[146px] xs:pr-[154px] sm:pr-3
                min-h-[54px]
              "
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || 'Google account'}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#D5CFC3] shrink-0"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#23252A] text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                  {user.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-[#23252A] truncate leading-tight">
                  {user.displayName || 'Google Account'}
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#77736C] mt-0.5">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-[#278052] bg-[#EAF5ED] px-2 py-1 rounded-full shrink-0">
                <ShieldCheck className="w-3 h-3" />
                Connected
              </div>
            </motion.div>
          ) : (
            <div className="
              flex items-center gap-2.5 sm:gap-3
              p-2 sm:p-2.5
              rounded-xl
              bg-[#FAF6EC]
              border border-[#DED7C9]
              pr-[146px] xs:pr-[154px] sm:pr-3
              min-h-[54px]
            ">
              <div className="w-9 h-9 rounded-full bg-[#23252A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                G
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-[#23252A] truncate leading-tight">
                  Guest Warrior
                </div>
                <div className="text-[10px] text-[#77736C] truncate mt-0.5">
                  Set your battlefield identity
                </div>
              </div>
            </div>
          )}

          {/* Floating Character Preview Card — Upper Right (Mobile only) */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 lg:hidden">
            <CharacterPopupPreview
              nickname={nickname}
              colorFamily={colorFamily}
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* FEEDBACK MESSAGES */}
        {/* ============================================ */}
        {serverError && (
          <div className="mb-2 shrink-0">
            <Banner
              type="error"
              onClose={() => setServerError('')}
            >
              {serverError}
            </Banner>
          </div>
        )}

        {successMessage && (
          <div className="mb-2 shrink-0">
            <Banner type="success">
              {successMessage}
            </Banner>
          </div>
        )}

        {/* ============================================ */}
        {/* MAIN CONTENT GRID / FLEX CONTAINER */}
        {/* ============================================ */}
        <div className="
          flex-1 min-h-0
          flex flex-col
          lg:grid lg:grid-cols-12
          lg:gap-8
          lg:items-start
        ">

          {/* LEFT: PROFILE FORM */}
          <div className="flex-1 min-h-0 flex flex-col lg:col-span-7 min-w-0">
            <form
              onSubmit={handleSubmit}
              className="
                flex-1
                flex flex-col
                rounded-2xl
                border border-[#DED7C9]
                bg-[#FFFEFA]
                shadow-[0_4px_20px_rgba(35,37,42,0.04)]
                overflow-visible
              "
            >

              {/* FORM SECTIONS (Balanced vertical flow on mobile) */}
              <div className="
                flex-1
                flex flex-col justify-between
                p-2.5 sm:p-5 lg:p-6
                space-y-3 sm:space-y-4
              ">

                {/* ------------------------------------ */}
                {/* 01. NICKNAME */}
                {/* ------------------------------------ */}
                <section className="shrink-0">
                  <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#23252A]">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#EAF0F8] text-[#2B68B4] flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0">
                        01
                      </span>
                      <span>Game nickname</span>
                      <span className="text-[#CE4242]">*</span>
                    </div>

                    <span className="text-[10px] font-mono text-[#969087] shrink-0">
                      {nickname.length}/24
                    </span>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-[#8A857D] ml-6 sm:ml-8 -mt-0.5 mb-1 sm:mb-1.5">
                    This is how other players will know you.
                  </p>

                  <Input
                    id="player-nickname"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setTouched(prev => ({
                        ...prev,
                        nickname: true
                      }));
                      setServerError('');
                    }}
                    placeholder="Enter your player nickname"
                    maxLength={24}
                    autoFocus={false}
                    error={
                      touched.nickname && !nicknameVal.isValid
                        ? nicknameVal.error
                        : null
                    }
                    className="
                      [&_input]:min-h-[38px] sm:[&_input]:min-h-[44px]
                      [&_input]:py-1.5 sm:[&_input]:py-2.5
                      [&_input]:text-xs sm:[&_input]:text-sm
                      [&_input]:rounded-xl
                    "
                  />

                  {/* Nickname availability status + Suggest one */}
                  <div className="min-h-[20px] mt-1 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      {nicknameStatus && (
                        <div className={`
                          flex items-center gap-1
                          text-[10px] font-medium
                          ${nicknameStatus.type === 'success'
                            ? 'text-[#278052]'
                            : nicknameStatus.type === 'error'
                              ? 'text-[#CE4242]'
                              : 'text-[#858078]'
                          }
                        `}>
                          {nicknameStatus.type === 'loading' ? (
                            <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                          ) : nicknameStatus.type === 'success' ? (
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                          )}
                          <span className="truncate">{nicknameStatus.label}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleRandomize}
                      className="
                        flex items-center gap-1
                        text-[10px] sm:text-[11px] font-semibold
                        text-[#2B68B4]
                        hover:text-[#174B8C]
                        transition-colors
                        shrink-0
                      "
                    >
                      <RefreshCw className="w-3 h-3 shrink-0" />
                      Suggest one
                    </button>
                  </div>
                </section>

                {/* DIVIDER */}
                <div className="border-t border-[#EAE5DA] my-1 sm:my-2 shrink-0" />

                {/* ------------------------------------ */}
                {/* 02. CHARACTER COLOUR */}
                {/* ------------------------------------ */}
                <section className="shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#23252A] mb-0.5 sm:mb-1">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#F3EDF9] text-[#8452A5] flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0">
                      02
                    </span>
                    <span>Character colour</span>
                    <span className="text-[#CE4242]">*</span>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-[#8A857D] ml-6 sm:ml-8 mb-1 sm:mb-1.5">
                    Choose your signature pencil shade.
                  </p>

                  <ColorFamilySelector
                    selectedColor={colorFamily}
                    onSelectColor={(id) => {
                      setColorFamily(id);
                      setServerError('');
                    }}
                  />
                </section>

                {/* DIVIDER */}
                <div className="border-t border-[#EAE5DA] my-1 sm:my-2 shrink-0" />

                {/* ------------------------------------ */}
                {/* 03. DATE OF BIRTH */}
                {/* ------------------------------------ */}
                <section className="shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#23252A] mb-0.5 sm:mb-1">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#EAF4F0] text-[#39866B] flex items-center justify-center text-[10px] sm:text-[11px] font-bold shrink-0">
                      03
                    </span>
                    <span>Date of birth</span>
                    <span className="text-[#CE4242]">*</span>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-[#8A857D] ml-6 sm:ml-8 mb-1 sm:mb-1.5">
                    Select your date using the scrolling wheels.
                  </p>

                  <div className="
                    w-full rounded-xl
                    bg-[#FAF9F5]
                    border border-[#EEEAE1]
                    py-0 sm:py-1
                  ">
                    <ScrollableDobPicker
                      value={dob}
                      onChange={(newDob) => {
                        setDob(newDob);
                        setTouched(prev => ({
                          ...prev,
                          dob: true
                        }));
                        setServerError('');
                      }}
                    />
                  </div>

                  {touched.dob && !dobVal.isValid && (
                    <p className="
                      mt-1 text-[10px] sm:text-[11px]
                      text-[#CE4242]
                      flex items-center gap-1
                    ">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {dobVal.error}
                    </p>
                  )}
                </section>

              </div>

              {/* ====================================== */}
              {/* FORM FOOTER / SUBMIT BUTTON ANCHOR */}
              {/* ====================================== */}
              <div className="
                shrink-0 mt-auto
                p-2 sm:p-3 lg:p-4
                border-t border-[#EAE5DA]
                bg-[#FFFEFA]
                flex flex-col-reverse sm:flex-row
                items-center justify-between gap-2
                pb-[max(0.625rem,env(safe-area-inset-bottom))]
              ">
                {isEditingExisting ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/profile')}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto text-xs py-1.5"
                  >
                    Cancel
                  </Button>
                ) : (
                  <div className="
                    hidden sm:flex items-center gap-1.5
                    text-[10px] font-medium
                    text-[#969087]
                  ">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Your identity is ready to be created
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!isFormValid || isSubmitting}
                  icon={ArrowRight}
                  iconPosition="right"
                  className="
                    w-full sm:w-auto
                    min-h-[44px]
                    px-6
                    text-xs sm:text-sm
                    font-bold
                    shadow-sketch-dark
                  "
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </span>
                  ) : isEditingExisting ? (
                    'SAVE CHANGES'
                  ) : (
                    'CREATE PLAYER PROFILE'
                  )}
                </Button>
              </div>

            </form>
          </div>

          {/* ========================================== */}
          {/* RIGHT: DESKTOP CHARACTER PREVIEW (lg only) */}
          {/* ========================================== */}
          <aside className="
            hidden lg:flex
            lg:col-span-5
            flex-col items-center
            sticky top-8
            min-w-0
          ">
            <div className="
              w-full rounded-2xl
              border border-[#DED7C9]
              bg-[#FFFEFA]
              p-5
              shadow-[0_4px_20px_rgba(35,37,42,0.04)]
            ">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#23252A]">
                    Your player preview
                  </h2>
                  <p className="text-[11px] text-[#8A857D] mt-0.5">
                    Your identity in ODD WAR
                  </p>
                </div>
                <Sparkles className="w-4 h-4 text-[#B18A4D]" />
              </div>

              <CharacterPreview
                nickname={nickname || 'Your Warrior'}
                colorFamily={colorFamily}
              />

              <div className="mt-5 pt-4 border-t border-[#EAE5DA]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#23252A]">
                  <Pencil className="w-3.5 h-3.5 text-[#2B68B4]" />
                  Your battlefield identity
                </div>
                <p className="text-[11px] text-[#858078] leading-relaxed mt-1.5">
                  Your nickname and selected pencil colour
                  will represent you across ODD WAR matches.
                </p>
              </div>
            </div>
          </aside>

        </div>

        {/* ============================================ */}
        {/* BOTTOM BRANDING (Desktop only) */}
        {/* ============================================ */}
        <footer className="
          hidden lg:flex
          items-center justify-between
          mt-4 pt-3
          border-t border-[#D5CFC3]/60
          text-[10px] text-[#969087]
          shrink-0
        ">
          <span>ODD WAR · PLAYER REGISTRATION</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            PLAYER IDENTITY
          </span>
        </footer>

      </div>
    </NotebookBackground>
  );
};

export default ProfileSetupPage;
