/**
 * ODD WAR Procedural Sound Effects & Audio Manager (Task 12)
 *
 * Implemented using Web Audio API:
 * - 100% original, copyright-free procedural synthesis (no external mp3 dependencies or asset 404s).
 * - Master volume (0.0 to 1.0) and mute toggling with localStorage persistence.
 * - Call debouncing / throttling to prevent cacophony or audio clipping on rapid interactions.
 * - Gentle envelope shapers to prevent speaker pops/clicks.
 */

class SoundEffectsService {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volume = 0.7;
    this.lastPlayedTimestamps = {};

    if (typeof window !== 'undefined') {
      try {
        this.isMuted = (localStorage.getItem('odd_war_sound_muted') ?? localStorage.getItem('odd_wars_sound_muted')) === 'true';
        const savedVol = localStorage.getItem('odd_war_sound_volume') ?? localStorage.getItem('odd_wars_sound_volume');
        this.volume = savedVol !== null ? parseFloat(savedVol) : 0.7;
      } catch (e) {}
    }
  }

  /**
   * Initializes or resumes the AudioContext on first user interaction.
   */
  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('odd_war_sound_volume', this.volume.toString());
    } catch (e) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('odd_war_sound_muted', this.isMuted.toString());
    } catch (e) {}
    return this.isMuted;
  }

  getEffectiveVolume() {
    return this.isMuted ? 0 : this.volume;
  }

  /**
   * Prevents playing the same sound multiple times within `thresholdMs`.
   */
  isThrottled(soundKey, thresholdMs = 60) {
    const now = Date.now();
    const last = this.lastPlayedTimestamps[soundKey] || 0;
    if (now - last < thresholdMs) return true;
    this.lastPlayedTimestamps[soundKey] = now;
    return false;
  }

  /**
   * 1. Button Click (Pencil tap on desk)
   */
  playButtonClick() {
    if (this.isThrottled('btn_click', 50)) return;
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(vol * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {}
  }

  /**
   * 2. Page Flip (Crisp notebook leaf rustle)
   */
  playPageFlip(speed = 1) {
    if (this.isThrottled('page_flip', Math.max(30, 70 / speed))) return;
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const dur = Math.max(0.04, 0.09 / speed);
      this.playPaperRustle(now, dur, vol * 0.25 * Math.min(speed, 1.3));
    } catch (e) {}
  }

  /**
   * 3. Book Entrance (Magical low-frequency whoosh)
   */
  playBookEntrance() {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.7);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.3, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  /**
   * 4. Book Open (Leather binding stretch & parchment settle)
   */
  playBookOpen() {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Low thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.3);

      gain.gain.setValueAtTime(vol * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      // Noise rustle
      this.playPaperRustle(now + 0.05, 0.25, vol * 0.28);
    } catch (e) {}
  }

  /**
   * 5. Magical Shimmer (High crystal bells / sparkles)
   */
  playMagicShimmer() {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [659.25, 880.0, 987.77, 1318.51, 1567.98]; // E5, A5, B5, E6, G6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(vol * 0.12, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.38);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.4);
      });
    } catch (e) {}
  }

  /**
   * 6. Final Result Reveal (Triumphant chord if odd, neutral chime if even)
   */
  playResultChime(isOdd = true) {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = isOdd
        ? [440, 554.37, 659.25, 880] // A Major chord
        : [392, 493.88, 587.33]; // G chord (soft)

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = isOdd ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime((vol * 0.22) / freqs.length, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isOdd ? 0.85 : 0.55));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + (isOdd ? 0.85 : 0.55));
      });
    } catch (e) {}
  }

  /**
   * 7. Pencil Drawing (Textured graphite friction on paper)
   */
  playPencilDrawing() {
    if (this.isThrottled('pencil_draw', 65)) return;
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      this.playPencilFriction(now, 0.07, vol * 0.18);
    } catch (e) {}
  }

  /**
   * 8. Stage Completion (Crisp pencil checkmark & ascending reward chime)
   */
  playStageComplete() {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Quick graphite tick
      this.playPencilFriction(now, 0.08, vol * 0.25);

      // 2. Ascending 3-note chime (F#5 -> A5 -> D6)
      const notes = [739.99, 880.0, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.05 + idx * 0.06);

        gain.gain.setValueAtTime(0, now + 0.05 + idx * 0.06);
        gain.gain.linearRampToValueAtTime(vol * 0.18, now + 0.05 + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05 + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + 0.05 + idx * 0.06);
        osc.stop(now + 0.05 + idx * 0.06 + 0.45);
      });
    } catch (e) {}
  }

  /**
   * 9. Gun Loading (Mechanical pencil click & spring reload)
   */
  playGunLoading() {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Click 1 (press down)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(300, now + 0.03);

      gain1.gain.setValueAtTime(vol * 0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.035);

      // Click 2 (spring lock)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(800, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 0.13);

      gain2.gain.setValueAtTime(vol * 0.3, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.15);
    } catch (e) {}
  }

  /**
   * 10. Gunshot Fire (Sharp paper cannon pop + low acoustic boom)
   */
  playGunshot() {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Pop / snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.18);

      gain.gain.setValueAtTime(vol * 0.48, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);

      // Paper crack noise
      this.playPaperRustle(now, 0.12, vol * 0.4);
    } catch (e) {}
  }

  /**
   * 11. Impact & Row Elimination (Harsh multi-strike pencil scribble)
   */
  playPencilStrike() {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Strike 1
      this.playPencilFriction(now, 0.18, vol * 0.55);
      // Strike 2 (cross-cut)
      this.playPencilFriction(now + 0.08, 0.2, vol * 0.5);
    } catch (e) {}
  }

  /**
   * 12. Player Eliminated (Dramatic descending minor cadence)
   */
  playPlayerEliminated() {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Descending minor notes (D4 -> C4 -> A3)
      const notes = [293.66, 261.63, 220.0];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);

        gain.gain.setValueAtTime(vol * 0.25, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.45);
      });
    } catch (e) {}
  }

  /**
   * 13. Victory Fanfare (Triumphant major chimes)
   */
  playVictoryFanfare() {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(vol * 0.28, now + idx * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.75);
      });
    } catch (e) {}
  }

  /**
   * Helper: Synthesized noise burst for paper flutter
   */
  playPaperRustle(startTime, duration, volume) {
    if (!this.ctx) return;
    try {
      const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      // Filter to paper rustle band (1500Hz - 4200Hz)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, startTime);
      filter.Q.setValueAtTime(1.8, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(startTime);
      whiteNoise.stop(startTime + duration);
    } catch (e) {}
  }

  /**
   * Helper: Synthesized noise burst for pencil lead graphite scratching
   */
  playPencilFriction(startTime, duration, volume) {
    if (!this.ctx) return;
    try {
      const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * (0.8 + 0.2 * Math.sin(i * 0.05));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Graphite scraping filter (3500Hz - 7000Hz)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(4500, startTime);
      filter.Q.setValueAtTime(2.2, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(startTime);
      noise.stop(startTime + duration);
    } catch (e) {}
  }
}

export const soundEffects = new SoundEffectsService();
