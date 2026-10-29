// Read-aloud with word highlighting, ported from ClearPath's approach. Text is
// gathered from the section most in view; each spoken word is marked with the
// CSS Custom Highlight API (no DOM changes). Browsers or voices that don't
// fire word boundaries get a timed highlight instead.

const SKIP = 'script, style, svg, canvas, button, input, textarea, select, nav, [aria-hidden="true"], .sr-only';
const HIGHLIGHT = 'read-aloud';

type Piece = { node: Text; start: number };

// Chrome can garbage-collect an utterance mid-speech (its events then never
// fire), so the one being spoken is kept here
let current: SpeechSynthesisUtterance | null = null;

// Diagnostics: add ?debug-speech to the URL to log every speech step to the
// console (for tracking down browser-specific speech bugs)
const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug-speech');
const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
export function debugSpeech(...args: unknown[]) {
  if (!DEBUG) return;
  const s = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  const state = s ? `[speaking=${s.speaking} pending=${s.pending} paused=${s.paused}]` : '';
  console.log(`[speech] +${Math.round(performance.now() - t0)}ms`, ...args, state);
}

export function sectionInView(): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestArea = 0;
  document.querySelectorAll<HTMLElement>('main section').forEach((s) => {
    const r = s.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
    if (visible > bestArea) { best = s; bestArea = visible; }
  });
  return best;
}

function collect(root: HTMLElement) {
  const pieces: Piece[] = [];
  let text = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const el = node.parentElement;
      if (!el || el.closest(SKIP) || !node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      const cs = getComputedStyle(el);
      return cs.display === 'none' || cs.visibility === 'hidden' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    pieces.push({ node: n as Text, start: text.length });
    text += `${n.textContent} `;
  }
  return { text, pieces };
}

function wordRange(pieces: Piece[], index: number): Range | null {
  let lo = 0, hi = pieces.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (pieces[mid].start <= index) lo = mid; else hi = mid - 1;
  }
  const { node, start } = pieces[lo] ?? {};
  if (!node) return null;
  const local = index - start;
  const value = node.textContent ?? '';
  const match = /\S+/.exec(value.slice(local));
  if (!match) return null;
  const range = document.createRange();
  range.setStart(node, local + match.index);
  range.setEnd(node, local + match.index + match[0].length);
  return range;
}

function mark(range: Range | null) {
  const highlights = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
  const Highlight = (window as unknown as { Highlight?: new (r: Range) => unknown }).Highlight;
  if (!highlights || !Highlight) return;
  if (!range) { highlights.delete(HIGHLIGHT); return; }
  highlights.set(HIGHLIGHT, new Highlight(range));
  const rect = range.getBoundingClientRect();
  if (rect.top < 90 || rect.bottom > window.innerHeight - 40) {
    window.scrollBy({ top: rect.top - window.innerHeight / 3, behavior: 'auto' });
  }
}

export const canReadAloud = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

// Firefox on macOS never finishes a cancel() that interrupts speech: the
// engine stays "speaking" and every later utterance waits forever, until a
// reload. (Diagnosed with ?debug-speech and /?speech-test; no pause/resume/
// cancel combination recovers it.) So text is read one sentence at a time,
// and in Firefox Stop never interrupts: it stops queueing sentences and lets
// the one playing finish, which keeps the engine healthy. Other browsers
// cancel immediately.
const GENTLE_STOP = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);

type Chunk = { start: number; text: string };

/** Sentences (split again at commas or spaces if over ~200 characters). */
function sentences(text: string): Chunk[] {
  const out: Chunk[] = [];
  const re = /[^.!?\n]+(?:[.!?]+["')\]]*|\n|$)/g;
  for (const m of text.matchAll(re)) {
    let start = m.index ?? 0;
    let piece = m[0];
    while (piece.length > 220) {
      const cut = Math.max(piece.lastIndexOf(', ', 200), piece.lastIndexOf(' ', 200));
      const at = cut > 40 ? cut + 1 : 200;
      out.push({ start, text: piece.slice(0, at) });
      start += at;
      piece = piece.slice(at);
    }
    if (piece.trim()) out.push({ start, text: piece });
  }
  return out;
}

/** Read `root` aloud. Returns a stop function; `onEnd` runs when it finishes or stops. */
export function readAloud(root: HTMLElement, onEnd: () => void): () => void {
  const { text, pieces } = collect(root);
  const synth = window.speechSynthesis;
  const chunks = sentences(text);
  const timers: ReturnType<typeof setTimeout>[] = [];
  let sweep: ReturnType<typeof setInterval> | null = null;
  let done = false;
  let started = false;     // the engine reported speech actually starting
  let boundaries = false;  // ...and word positions
  let index = 0;

  const finish = (why = 'finish') => {
    if (done) return;
    debugSpeech('finish:', why);
    done = true;
    timers.forEach(clearTimeout);
    if (sweep) clearInterval(sweep);
    mark(null);
    onEnd();
  };

  if (DEBUG) {
    const voices = synth.getVoices();
    debugSpeech(`readAloud: ${text.length} chars, ${chunks.length} sentences, ${voices.length} voices`, voices.find((v) => v.default)?.name ?? '(no default voice)', GENTLE_STOP ? '(gentle stop)' : '');
  }
  if (!chunks.length) { finish('no text'); return () => finish('stop'); }

  // Timed highlight for voices without word events (or no audible speech)
  const starts: number[] = [];
  for (const m of text.matchAll(/\S+/g)) starts.push(m.index ?? 0);
  const startSweep = () => {
    if (sweep || boundaries || done) return;
    debugSpeech('timed highlight sweep starts', started ? '(speech started, no word events)' : '(speech has not started)');
    let i = 0;
    sweep = setInterval(() => {
      if (boundaries) { if (sweep) clearInterval(sweep); sweep = null; return; }
      if (i >= starts.length) { if (!started) finish('sweep done, speech never started'); return; }
      mark(wordRange(pieces, starts[i++]));
    }, 330);
  };

  const speakNext = () => {
    if (done) return;
    if (index >= chunks.length) { finish('all sentences read'); return; }
    const n = index++;
    const chunk = chunks[n];
    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.rate = 0.95;
    let words = 0;
    utterance.onstart = () => { started = true; if (n < 2) debugSpeech(`sentence ${n + 1}/${chunks.length}: start`); };
    utterance.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      if (++words === 1 && n < 2) debugSpeech(`sentence ${n + 1}: word events`);
      boundaries = true;
      if (!done) mark(wordRange(pieces, chunk.start + e.charIndex));
    };
    const next = (e: Event) => {
      if (n < 2 || e.type === 'error') debugSpeech(`sentence ${n + 1}: ${e.type}`, (e as SpeechSynthesisErrorEvent).error ?? '');
      if (current === utterance) current = null;
      speakNext();
    };
    utterance.onend = next;
    utterance.onerror = next;
    current = utterance;
    if (!GENTLE_STOP) synth.resume();   // Chrome can be left paused after a cancel
    synth.speak(utterance);
  };

  // Elsewhere, clear anything still queued first and wait a beat: speak()
  // straight after cancel() is dropped by Chrome and Safari. In Firefox a
  // sentence may still be finishing from a gentle stop; new ones queue after it.
  if (!GENTLE_STOP) { debugSpeech('cancel before first sentence'); synth.cancel(); }
  timers.push(setTimeout(speakNext, GENTLE_STOP ? 0 : 150));
  timers.push(setTimeout(startSweep, 1500));
  if (DEBUG) for (let ms = 1000; ms <= 5000; ms += 1000) timers.push(setTimeout(() => debugSpeech(`state @${ms}ms, started=${started}`), ms));

  return () => {
    finish('stopped by user');
    if (GENTLE_STOP) debugSpeech('gentle stop: letting the current sentence finish');
    else { debugSpeech('cancel (stop)'); synth.cancel(); }
  };
}

function starts_count(text: string) {
  return (text.match(/\S+/g) ?? []).length;
}
