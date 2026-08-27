/**
 * Audio Synthesizer & Web Audio API Helpers
 */

export const createSynthesizerBeep = (audioCtx, freq = 880, type = 'sine', durationSec = 0.3) => {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + durationSec);
  } catch (err) {
    console.warn('Synthesizer Beep Error:', err);
  }
};
