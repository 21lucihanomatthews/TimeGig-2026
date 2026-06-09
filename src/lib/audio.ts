/**
 * Sound settings storage keys
 */
const SOUND_KEY = 'timegig_sound_enabled';

export function isSoundEnabled(): boolean {
  try {
    const value = localStorage.getItem(SOUND_KEY);
    return value !== 'false'; // Defaults to true if not set
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn("Could not save sound setting", e);
  }
}

/**
 * Pure Web Audio API Chime Synthesizer
 * Produces a soft, pristine bell/glass tone.
 */
export function playSoftChime() {
  if (!isSoundEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playTone = (frequency: number, peakGain: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);

      gainNode.gain.setValueAtTime(0, now);
      // Sharp attack (5 milliseconds)
      gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.005);
      // Exponential exponential decay to silence
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    };

    // Synthesizing a crisp, multi-tone metallic bell vibe (crystal clear E-6 chord tones)
    playTone(1318.51, 0.14, 0.75); // E6 fundamental
    playTone(1661.22, 0.08, 0.55); // G#6 overtone
    playTone(1975.53, 0.06, 0.40); // B6 overtone
  } catch (error) {
    console.warn("Soft chime audio output neglected due to interaction constraint:", error);
  }
}

/**
 * Play an incredibly soft, subtle interface tactile click sound.
 */
export function playSoftClick() {
  if (!isSoundEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // High frequency sine for crisp tactile feedback
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.02);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.02, now + 0.002); // very low volume (0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.025); // very brief duration (25ms)

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch (error) {
    // Fail silently so it doesn't log on every keystroke
  }
}

