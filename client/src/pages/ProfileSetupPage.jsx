
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
  ShieldCheck,
  RefreshCw,
  X,
  Mail,
  Shield,
  Pencil,
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
  // STATUS BANNER
  // --------------------------------------------------

  const Banner = ({ type, children, onClose }) => {
    const success = type === 'success';

    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          flex items-start gap-2
          p-2.5 rounded-xl border
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

        <span className="flex-1 leading-relaxed">{children}</span>

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
    /*
     * MOBILE LAYOUT STRATEGY:
     * - Outer: card-ruled bg, h-dvh on mobile, auto on lg
     * - Inner wrapper: flex-col, h-full on mobile
     * - Form area: overflow-y-auto (internal scroll) with pb for button
     * - Submit button: always pinned at bottom via flex structure
     * - No page-level overflow/scrolling on mobile
     */
    <div
      className="
        card-ruled w-full
        flex flex-col
        h-[100dvh] overflow-hidden
        lg:min-h-screen lg:h-auto lg:overflow-visible
      "
      style={{ fontFamily: FONT_STACK }}
    >

      {/* ══════════════════════════════════════════════
          MOBILE: HEADER STRIP (account info + preview)
          ══════════════════════════════════════════════ */}
      <div className="
        shrink-0
        px-3 pt-3 pb-2
        lg:hidden
      ">
        {/* Account info row + preview card side by side */}
        <div className="relative flex items-center gap-2.5">

          {/* Google account info */}
          {isAuthenticated && user ? (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="
                flex items-center gap-2.5
                flex-1 min-w-0
                p-2 rounded-xl
                bg-[#FAF6EC]
                border border-[#DED7C9]
              "
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || 'Google account'}
                  className="w-9 h-9 rounded-full object-cover border border-[#D5CFC3] shrink-0"
                />
              ) : (
                <div className="
                  w-9 h-9 rounded-full shrink-0
                  bg-[#23252A] text-white
                  flex items-center justify-center
                  font-bold text-sm
                ">
                  {user.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#23252A] truncate">
                  {user.displayName || 'Google Account'}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#77736C] mt-0.5">
                  <Mail className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              <div className="
                flex items-center gap-1
                text-[9px] font-semibold text-[#278052]
                bg-[#EAF5ED] px-1.5 py-0.5 rounded-full shrink-0
              ">
                <ShieldCheck className="w-2.5 h-2.5" />
                OK
              </div>
            </motion.div>
          ) : (
            /* Guest placeholder */
            <div className="
              flex items-center gap-2 flex-1 min-w-0
              p-2 rounded-xl bg-[#FAF6EC] border border-[#DED7C9]
            ">
              <div className="w-9 h-9 rounded-full bg-[#EFE8DA] flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-[#5C6069]" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#23252A]">Guest Player</div>
                <div className="text-[10px] text-[#8A857D]">Set up your identity</div>
              </div>
            </div>
          )}

          {/* Character popup preview — absolute right, same row */}
          <div className="relative shrink-0" style={{ width: 165, height: 64 }}>
            <CharacterPopupPreview
              nickname={nickname}
              colorFamily={colorFamily}
            />
          </div>
        </div>

        {/* Error / success banner below account row */}
        {(serverError || successMessage) && (
          <div className="mt-2">
            {serverError && (
              <Banner type="error" onClose={() => setServerError('')}>
                {serverError}
              </Banner>
            )}
            {successMessage && (
              <Banner type="success">
                {successMessage}
              </Banner>
            )}
          </div>
        )}
      </div>


      {/* ══════════════════════════════════════════════
          DESKTOP LAYOUT (lg+): full-page column
          ══════════════════════════════════════════════ */}
      <div className="
        hidden lg:block
        shrink-0
        max-w-6xl mx-auto w-full px-8
        pt-10 pb-4
      ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#D5CFC3] bg-[#FAF6EC] text-xs font-medium text-[#5C6069]">
            <Shield className="w-3.5 h-3.5" />
            Player identity
          </div>
        </div>

        {/* Desktop account info */}
        {isAuthenticated && user && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              flex items-center gap-3
              p-3 mt-4 mb-2
              rounded-xl
              bg-[#FAF6EC]
              border border-[#DED7C9]
            "
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName || 'Google account'}
                className="w-10 h-10 rounded-full object-cover border border-[#D5CFC3]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#23252A] text-white flex items-center justify-center font-bold text-sm">
                {user.email?.charAt(0).toUpperCase() || 'G'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#23252A] truncate">
                {user.displayName || 'Google Account'}
              </div>
              <div className="flex items-center gap-1 text-xs text-[#77736C] mt-0.5">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-semibold text-[#278052] bg-[#EAF5ED] px-2 py-1 rounded-full shrink-0">
              <ShieldCheck className="w-3 h-3" />
              Connected
            </div>
          </motion.div>
        )}

        {/* Desktop feedback banners */}
        {serverError && (
          <div className="mb-3">
            <Banner type="error" onClose={() => setServerError('')}>
              {serverError}
            </Banner>
          </div>
        )}
        {successMessage && (
          <div className="mb-3">
            <Banner type="success">{successMessage}</Banner>
          </div>
        )}
      </div>


      {/* ══════════════════════════════════════════════
          CONTENT GRID  (flex-1 to fill remaining height)
          ══════════════════════════════════════════════ */}
      <div className="
        flex-1 min-h-0
        lg:max-w-6xl lg:mx-auto lg:w-full
        lg:px-8 lg:pb-10
        grid grid-cols-1 lg:grid-cols-12
        lg:gap-8 lg:items-start
      ">

        {/* ── LEFT / MOBILE: PROFILE FORM ─────────── */}
        <div className="
          lg:col-span-7
          min-w-0 min-h-0 h-full
          flex flex-col
        ">
          <form
            onSubmit={handleSubmit}
            className="
              h-full min-h-0
              flex flex-col
              lg:rounded-2xl lg:border lg:border-[#DED7C9]
              lg:bg-[#FFFEFA]
              lg:shadow-[0_4px_20px_rgba(35,37,42,0.04)]
              lg:overflow-hidden
            "
          >

            {/*
             * SCROLLABLE FORM BODY
             * On mobile: this area scrolls internally if needed.
             * On desktop: fills the card.
             */}
            <div className="
              flex-1 min-h-0 overflow-y-auto
              px-3 pt-1 pb-2
              sm:px-5 sm:pt-4 sm:pb-3
              lg:p-6
              space-y-3 lg:space-y-6
            ">

              {/* ─── 01. NICKNAME ──────────────────── */}
              <section>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#23252A]">
                      <span className="w-5 h-5 rounded-md bg-[#EAF0F8] text-[#2B68B4] flex items-center justify-center text-[10px] font-bold">
                        01
                      </span>
                      Game nickname
                      <span className="text-[#CE4242]">*</span>
                    </div>

                    <p className="text-[10px] text-[#8A857D] ml-7 mt-0.5">
                      How other players will know you.
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-[#969087] shrink-0">
                    {nickname.length}/24
                  </span>
                </div>

                <Input
                  id="player-nickname"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setTouched(prev => ({ ...prev, nickname: true }));
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
                  className="[&_input]:min-h-[42px] [&_input]:rounded-xl [&_input]:text-sm"
                />

                {/* Availability status row */}
                <div className="min-h-5 mt-1 flex items-center justify-between gap-2">
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
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : nicknameStatus.type === 'success' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <span>{nicknameStatus.label}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#2B68B4] hover:text-[#174B8C] transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Suggest one
                  </button>
                </div>

                <p className="text-[10px] text-[#99938A] mt-0.5">
                  2–24 characters · Letters, numbers, - and _
                </p>
              </section>


              {/* DIVIDER */}
              <div className="border-t border-[#EAE5DA]" />


              {/* ─── 02. CHARACTER COLOUR ──────────── */}
              <section>
                <div className="mb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#23252A]">
                    <span className="w-5 h-5 rounded-md bg-[#F3EDF9] text-[#8452A5] flex items-center justify-center text-[10px] font-bold">
                      02
                    </span>
                    Character colour
                    <span className="text-[#CE4242]">*</span>
                  </div>

                  <p className="text-[10px] text-[#8A857D] ml-7 mt-0.5">
                    Choose your signature pencil shade.
                  </p>
                </div>

                <ColorFamilySelector
                  selectedColor={colorFamily}
                  onSelectColor={(id) => {
                    setColorFamily(id);
                    setServerError('');
                  }}
                />
              </section>


              {/* DIVIDER */}
              <div className="border-t border-[#EAE5DA]" />


              {/* ─── 03. DATE OF BIRTH ─────────────── */}
              <section>
                <div className="mb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#23252A]">
                    <span className="w-5 h-5 rounded-md bg-[#EAF4F0] text-[#39866B] flex items-center justify-center text-[10px] font-bold">
                      03
                    </span>
                    Date of birth
                    <span className="text-[#CE4242]">*</span>
                  </div>

                  <p className="text-[10px] text-[#8A857D] ml-7 mt-0.5">
                    Scroll the wheels to select your date.
                  </p>
                </div>

                <div className="
                  w-full rounded-xl
                  bg-[#FAF9F5]
                  border border-[#EEEAE1]
                ">
                  <ScrollableDobPicker
                    value={dob}
                    onChange={(newDob) => {
                      setDob(newDob);
                      setTouched(prev => ({ ...prev, dob: true }));
                      setServerError('');
                    }}
                  />
                </div>

                {touched.dob && !dobVal.isValid && (
                  <p className="mt-1.5 text-[10px] text-[#CE4242] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {dobVal.error}
                  </p>
                )}
              </section>

            </div>
            {/* END scrollable form body */}


            {/* ══════════════════════════════════════
                SUBMIT FOOTER — always at bottom
                ══════════════════════════════════════ */}
            <div className="
              shrink-0 z-20
              px-3 py-2.5
              sm:px-5 sm:py-3
              lg:px-6 lg:py-4
              border-t border-[#EAE5DA]
              bg-[#FFFEFA]/95
              backdrop-blur-md
              flex flex-col-reverse sm:flex-row
              items-center justify-between gap-2
            ">
              {isEditingExisting ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/profile')}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto text-xs"
                >
                  Cancel
                </Button>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-[#969087]">
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
                  min-h-[42px] sm:min-h-[46px]
                  px-6
                  text-xs sm:text-sm
                  font-bold
                  shadow-sketch-dark
                "
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
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


        {/* ── RIGHT: DESKTOP CHARACTER PREVIEW ───── */}
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
      {/* END content grid */}


      {/* ══════════════════════════════════════════════
          DESKTOP FOOTER BRANDING
          ══════════════════════════════════════════════ */}
      <footer className="
        hidden lg:flex
        shrink-0
        max-w-6xl mx-auto w-full
        px-8 pb-6 pt-4
        items-center justify-between
        border-t border-[#D5CFC3]/60
        text-[10px] text-[#969087]
      ">
        <span>ODD WAR · PLAYER REGISTRATION</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          PLAYER IDENTITY
        </span>
      </footer>

    </div>
  );
};

export default ProfileSetupPage;
