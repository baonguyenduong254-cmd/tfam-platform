/**
 * Pure Web Audio API diegetic tactile sound effects for TFAM v227.
 * Zero external audio file dependencies; activates strictly on user gesture
 * and respects muted state stored in localStorage.
 */

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (localStorage.getItem('tfam-sfx-muted') === '1') return null;
  } catch {}
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
    if (!Ctor) return null;
    try { audioCtx = new Ctor(); } catch { return null; }
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSfxMuted(): boolean {
  try {
    return localStorage.getItem('tfam-sfx-muted') === '1';
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean) {
  try {
    localStorage.setItem('tfam-sfx-muted', muted ? '1' : '0');
  } catch {}
}

/** Crisp brass mechanical detent for War Table lenses, years, and tabs. */
export function playBrassClick() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(190, now + 0.055);
  gain.gain.setValueAtTime(0.045, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.065);
}

/** Soft parchment sweep for chronicle transitions and dossier draws. */
export function playParchmentTurn() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.12);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const env = Math.sin((i / bufferSize) * Math.PI);
    data[i] = (Math.random() * 2 - 1) * env * 0.16;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1350, now);
  filter.Q.setValueAtTime(1.4, now);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
}

/** Warm velvet harmonic shimmer for 18+ Private Atelier unveiling. */
export function playVelvetChime() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const freqs = [293.66, 440.0, 554.37];
  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + idx * 0.04);
    gain.gain.setValueAtTime(0.0001, now + idx * 0.04);
    gain.gain.linearRampToValueAtTime(0.025, now + idx * 0.04 + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.04);
    osc.stop(now + idx * 0.04 + 0.6);
  });
}
