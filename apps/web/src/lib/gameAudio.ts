// Web Audio API — all sounds synthesized from oscillators and noise buffers.
// No audio asset files are required; everything is generated at runtime.
//
// AudioContext is created lazily on the first call to any play* function.
// Browsers require a user gesture before audio can start — this satisfies that
// requirement by deferring context creation until the user interacts.

let ctx: AudioContext | null = null;

/** Returns (creating if necessary) the shared AudioContext singleton. */
function ac(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  // Context can be suspended if the browser auto-paused it (tab switch, etc.)
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Short rising sine-wave blip — played on every jump. */
export function playJump() {
  try {
    const c = ac();
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = 'sine';
    // Frequency sweeps upward to give a "springing" feel
    osc.frequency.setValueAtTime(280, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(560, c.currentTime + 0.11);

    gain.gain.setValueAtTime(0.18, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.14);

    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.14);
  } catch { /* silently ignore if audio context is unavailable */ }
}

/**
 * Dramatic descending sawtooth hits — played on collision/death.
 * Four hits at decreasing frequencies simulate a falling, defeated sound.
 */
export function playDeath() {
  try {
    const c = ac();
    ([
      [400, 0.00],
      [280, 0.09],
      [180, 0.18],
      [100, 0.27],
    ] as [number, number][]).forEach(([freq, delay]) => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = 'sawtooth'; // sawtooth is harsher than sine — emphasises defeat
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.15, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 0.13);

      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + 0.13);
    });
  } catch { /* silently ignore */ }
}

/**
 * Ascending 4-note fanfare — played at score milestones (100 / 500 / 1000).
 * Notes are C5 → E5 → G5 → C6 (a major triad + octave), staggered 90 ms apart.
 */
export function playMilestone() {
  try {
    const c = ac();
    ([523, 659, 784, 1047] as number[]).forEach((freq, i) => {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = c.currentTime + i * 0.09; // 90 ms stagger between notes
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

      osc.start(t);
      osc.stop(t + 0.17);
    });
  } catch { /* silently ignore */ }
}

/**
 * Eerie Nazgûl shriek — played each time a fell beast spawns.
 *
 * Technique: a sawtooth oscillator sweeps from 1700 Hz → 750 Hz over 650 ms,
 * while a low-frequency oscillator (LFO) at 9 Hz modulates the frequency by
 * ±95 Hz to create a vibrato/screech effect.
 */
export function playNazgul() {
  try {
    const c       = ac();
    const osc     = c.createOscillator();
    const lfo     = c.createOscillator(); // modulates osc.frequency for vibrato
    const lfoGain = c.createGain();       // controls vibrato depth (±95 Hz)
    const gain    = c.createGain();

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency); // LFO output feeds directly into osc frequency
    osc.connect(gain);
    gain.connect(c.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1700, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, c.currentTime + 0.65);

    lfo.type = 'sine';
    lfo.frequency.value = 9;    // 9 Hz vibrato rate
    lfoGain.gain.value  = 95;   // ±95 Hz frequency deviation

    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.setValueAtTime(0.08, c.currentTime + 0.38); // hold volume flat then fade
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.65);

    lfo.start(c.currentTime);
    osc.start(c.currentTime);
    lfo.stop(c.currentTime + 0.65);
    osc.stop(c.currentTime + 0.65);
  } catch { /* silently ignore */ }
}

/**
 * Fire whoosh — played when the Eye of Sauron easter egg is dismissed.
 *
 * Technique: a buffer of white noise is filtered through a BiquadFilter in
 * bandpass mode. The center frequency sweeps from 520 Hz → 180 Hz over 750 ms,
 * mimicking the falling pitch of a dying flame or whoosh of hot air.
 */
export function playFire() {
  try {
    const c       = ac();
    const bufSize = Math.floor(c.sampleRate * 0.75);
    const buf     = c.createBuffer(1, bufSize, c.sampleRate);
    const data    = buf.getChannelData(0);
    // Fill buffer with white noise (random values in [-1, 1])
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src    = c.createBufferSource();
    src.buffer   = buf;

    // Bandpass filter shapes the noise into fire-like crackling
    const filter = c.createBiquadFilter();
    filter.type  = 'bandpass';
    filter.frequency.setValueAtTime(520, c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.75);
    filter.Q.value = 0.6; // moderate resonance — wider band = softer crackling

    const gain = c.createGain();
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.38, c.currentTime + 0.04); // fast attack
    gain.gain.setValueAtTime(0.38, c.currentTime + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.75); // slow fade

    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);

    src.start(c.currentTime);
    src.stop(c.currentTime + 0.75);
  } catch { /* silently ignore */ }
}
