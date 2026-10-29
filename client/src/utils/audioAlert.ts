// Professional Web Audio API sound synthesizer for Binance Screener alerts
// Designed for high-energy attention-grabbing, rich harmonics, and zero-latency playback.

export type SoundType =
  | 'breakout'     // TradingView Breakout (Ascending Triad)
  | 'alarm_urgent' // Urgent Double Chirp (High Attention Grabber)
  | 'jackpot'      // Coin Rush (Rapid Metallic Clinks + Gold Bell)
  | 'laser_radar'  // Cyberpunk Sci-Fi Terminal Sweep
  | 'glass_chime'  // Resonant Crystal Glass (Apple style)
  | 'victory'      // Trade Fill Level-Up Fanfare
  | 'chime'        // Legacy alias for breakout
  | 'radar'        // Legacy alias for laser_radar
  | 'ping'         // Legacy alias for jackpot
  | 'bell';        // Legacy alias for glass_chime

class SoundPlayer {
  private ctx: AudioContext | null = null;

  public async ensureActive(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('[SoundPlayer] Resume error:', err);
      }
    }

    return this.ctx;
  }

  public unlockAudio(): void {
    this.ensureActive().catch(() => {});
  }

  public async playAlert(type: SoundType = 'breakout', volume: number = 0.85): Promise<void> {
    try {
      const ctx = await this.ensureActive();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      const clampedVol = Math.max(0.01, Math.min(1, volume));
      masterGain.gain.setValueAtTime(clampedVol, now);
      masterGain.connect(ctx.destination);

      // Normalise legacy keys
      let activeType: SoundType = type;
      if (type === 'chime') activeType = 'breakout';
      if (type === 'radar') activeType = 'laser_radar';
      if (type === 'ping') activeType = 'jackpot';
      if (type === 'bell') activeType = 'glass_chime';

      if (activeType === 'breakout') {
        // --- 1. TradingView Breakout: Energetic 4-Note Major Triad Arpeggio ---
        const notes = [
          { freq: 783.99, time: 0.00, dur: 0.16, vol: 0.65 }, // G5
          { freq: 1046.50, time: 0.07, dur: 0.18, vol: 0.75 }, // C6
          { freq: 1318.51, time: 0.14, dur: 0.22, vol: 0.85 }, // E6
          { freq: 1567.98, time: 0.21, dur: 0.45, vol: 1.00 }, // G6
        ];

        notes.forEach(({ freq, time, dur, vol }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle'; // Warm, full-bodied fundamental
          osc.frequency.setValueAtTime(freq, now + time);

          // Crystal harmonic overtone
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(freq * 2, now + time);

          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.linearRampToValueAtTime(vol * 0.7, now + time + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          gain2.gain.setValueAtTime(0.001, now + time);
          gain2.gain.linearRampToValueAtTime(vol * 0.35, now + time + 0.012);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + time + dur * 0.75);

          osc.connect(gain);
          osc2.connect(gain2);
          gain.connect(masterGain);
          gain2.connect(masterGain);

          osc.start(now + time);
          osc2.start(now + time);
          osc.stop(now + time + dur);
          osc2.stop(now + time + dur);
        });

      } else if (activeType === 'alarm_urgent') {
        // --- 2. Urgent High-Attention Double Chirp: Cuts through any background noise ---
        [0.00, 0.16].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2800, now + offset);

          // Fast frequency swoop upwards
          osc.frequency.setValueAtTime(950, now + offset);
          osc.frequency.exponentialRampToValueAtTime(1900, now + offset + 0.09);

          gain.gain.setValueAtTime(0.001, now + offset);
          gain.gain.linearRampToValueAtTime(0.85, now + offset + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start(now + offset);
          osc.stop(now + offset + 0.12);
        });

      } else if (activeType === 'jackpot') {
        // --- 3. Coin Rush / Jackpot: 3 fast metallic clinks + golden chord ---
        const clinks = [
          { f: 1975.5, t: 0.00, d: 0.12, vol: 0.6 }, // B6
          { f: 2349.3, t: 0.06, d: 0.12, vol: 0.7 }, // D7
          { f: 2793.8, t: 0.12, d: 0.14, vol: 0.8 }, // F7
          { f: 2093.0, t: 0.19, d: 0.55, vol: 0.85 }, // C7 root
          { f: 3136.0, t: 0.19, d: 0.60, vol: 1.0 }, // G7 high sparkle
        ];

        clinks.forEach(({ f, t, d, vol }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + t);

          gain.gain.setValueAtTime(0.001, now + t);
          gain.gain.linearRampToValueAtTime(vol * 0.8, now + t + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + t);
          osc.stop(now + t + d);
        });

      } else if (activeType === 'laser_radar') {
        // --- 4. Cyberpunk Laser Terminal FM Sweep ---
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        const mainGain = ctx.createGain();

        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(1400, now);
        carrier.frequency.exponentialRampToValueAtTime(450, now + 0.28);

        modulator.type = 'sawtooth';
        modulator.frequency.setValueAtTime(90, now);
        modulator.frequency.exponentialRampToValueAtTime(25, now + 0.28);

        modGain.gain.setValueAtTime(350, now);
        modGain.gain.exponentialRampToValueAtTime(15, now + 0.28);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        mainGain.gain.setValueAtTime(0.001, now);
        mainGain.gain.linearRampToValueAtTime(0.9, now + 0.008);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        carrier.connect(mainGain);
        mainGain.connect(masterGain);

        carrier.start(now);
        modulator.start(now);
        carrier.stop(now + 0.32);
        modulator.stop(now + 0.32);

      } else if (activeType === 'glass_chime') {
        // --- 5. Apple Crystal Glass: Multi-partial pristine bell ---
        const partials = [
          { freq: 1046.5, gain: 0.75, decay: 0.95 },
          { freq: 2888.3, gain: 0.40, decay: 0.65 },
          { freq: 5651.1, gain: 0.22, decay: 0.40 },
        ];

        partials.forEach((p) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(p.freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(p.gain, now + 0.006);
          gain.gain.exponentialRampToValueAtTime(0.001, now + p.decay);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + p.decay);
        });

      } else if (activeType === 'victory') {
        // --- 6. Trade Fill / Victory Fanfare ---
        const fanNotes = [
          { f: 523.25, t: 0.00, d: 0.12, vol: 0.65 }, // C5
          { f: 659.25, t: 0.07, d: 0.12, vol: 0.70 }, // E5
          { f: 783.99, t: 0.14, d: 0.14, vol: 0.80 }, // G5
          { f: 1046.50, t: 0.22, d: 0.50, vol: 1.00 }, // C6 High
        ];

        fanNotes.forEach(({ f, t, d, vol }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + t);

          gain.gain.setValueAtTime(0.001, now + t);
          gain.gain.linearRampToValueAtTime(vol * 0.75, now + t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + t);
          osc.stop(now + t + d);
        });
      }
    } catch (e) {
      console.warn('[AudioAlert] Could not play alert tone:', e);
    }
  }
}

export const soundPlayer = new SoundPlayer();

/**
 * Requests browser desktop notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (err) {
    return false;
  }
}
