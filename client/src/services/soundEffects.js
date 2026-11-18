/**
 * ODD WARS Procedural Sound Effects Engine (Task 08)
 *
 * Implemented using standard Web Audio API:
 * - 100% original, zero-dependency, copyright-free procedural sound synthesis.
 * - Zero network asset latency or external mp3 file failures.
 * - Supports mute and master volume controls with persistence.
 */

class SoundEffectsService {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('odd_wars_sound_muted') === 'true';
    const savedVol = localStorage.getItem('odd_wars_sound_volume');
    this.volume = savedVol !== null ? parseFloat(savedVol) : 0.7;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
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
    localStorage.setItem('odd_wars_sound_volume', this.volume.toString());
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('odd_wars_sound_muted', this.isMuted.toString());
    return this.isMuted;
  }

  getEffectiveVolume() {
    return this.isMuted ? 0 : this.volume;
  }

  /**
   * Sound 1: Book Entrance (Magical low-frequency whoosh)
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
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.7);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.35, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  /**
   * Sound 2: Book Opening (Parchment creak and gentle thump)
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

      gain.gain.setValueAtTime(vol * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);

      // Noise rustle
      this.playPaperRustle(now + 0.05, 0.25, vol * 0.3);
    } catch (e) {}
  }

  /**
   * Sound 3: Rapid Page Flipping Rustle
   */
  playPageFlip(speed = 1) {
    const vol = this.getEffectiveVolume();
    if (vol <= 0) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      this.playPaperRustle(now, 0.08 / speed, vol * 0.25 * Math.min(speed, 1.5));
    } catch (e) {}
  }

  /**
   * Sound 4: Magical Shimmer (High crystal bells / sparkles)
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
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(vol * 0.15, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.45);
      });
    } catch (e) {}
  }

  /**
   * Sound 5: Final Result Reveal (Triumphant chord if odd, neutral chime if even)
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
        gain.gain.linearRampToValueAtTime((vol * 0.25) / freqs.length, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isOdd ? 0.9 : 0.6));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + (isOdd ? 0.9 : 0.6));
      });
    } catch (e) {}
  }

  /**
   * Helper: Synthesized noise burst for paper flutter
   */
  playPaperRustle(startTime, duration, volume) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Filter to paper rustle band (1500Hz - 4500Hz)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, startTime);
    filter.Q.setValueAtTime(1.5, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + duration);
  }
}

export const soundEffects = new SoundEffectsService();
