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

/** Read `root` aloud. Returns a stop function; `onEnd` runs when it finishes or stops. */
export function readAloud(root: HTMLElement, onEnd: () => void): () => void {
  const { text, pieces } = collect(root);
  const synth = window.speechSynthesis;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let sweep: ReturnType<typeof setInterval> | null = null;
  let done = false;
  let started = false;     // the engine reported speech actually starting
  let boundaries = false;  // ...and word positions
  let attempts = 0;

  const finish = (why = 'finish') => {
    if (done) return;
    debugSpeech('finish:', why);
    done = true;
    timers.forEach(clearTimeout);
    if (sweep) clearInterval(sweep);
    current = null;
    mark(null);
    onEnd();
  };
  if (DEBUG) {
    const voices = synth.getVoices();
    debugSpeech(`readAloud: ${text.length} chars, ${starts_count(text)} words, ${voices.length} voices`, voices.find((v) => v.default)?.name ?? '(no default voice)');
  }
  if (!text.trim()) { finish('no text'); return () => finish('stop'); }

  // Timed highlight for voices without word events, or no audible speech at
  // all: steps through the words, then ends the session
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

  const speak = () => {
    attempts++;
    const attempt = attempts;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    let wordEvents = 0;
    utterance.onstart = () => { started = true; debugSpeech(`attempt ${attempt}: start`); };
    utterance.onboundary = (e) => {
      if (++wordEvents <= 3) debugSpeech(`attempt ${attempt}: boundary #${wordEvents}`, e.name, 'charIndex', e.charIndex);
      if (e.name && e.name !== 'word') return;
      boundaries = true;
      mark(wordRange(pieces, e.charIndex));
    };
    // Safari and Firefox sometimes end or reject the first utterance after a
    // cancel() before it ever starts: try once more with a fresh one. Ends
    // after a real start are the normal finish.
    const settle = (e: Event) => {
      debugSpeech(`attempt ${attempt}: ${e.type}`, (e as SpeechSynthesisErrorEvent).error ?? '', `started=${started} words=${wordEvents}`, current === utterance ? '' : '(stale utterance, ignored)');
      if (done || current !== utterance) return;
      if (started) { finish('speech ended'); return; }
      if (attempts < 2) {
        debugSpeech(`attempt ${attempt} never started: retrying in 250 ms`);
        timers.push(setTimeout(() => { if (!done) { debugSpeech('cancel before retry'); synth.cancel(); speak(); } }, 250));
      } else startSweep();
    };
    utterance.onend = settle;
    utterance.onerror = settle;
    current = utterance;
    debugSpeech(`attempt ${attempt}: resume + speak`);
    synth.resume();       // Chrome can be left paused after a cancel
    synth.speak(utterance);
    if (DEBUG) for (let ms = 500; ms <= 5000; ms += 500) timers.push(setTimeout(() => debugSpeech(`attempt ${attempt}: state @${ms}ms after speak, started=${started}`), ms));
  };

  // Clear anything still queued, wait a beat (speak() straight after cancel()
  // is dropped by Chrome and Safari), then speak
  debugSpeech('cancel before first speak');
  synth.cancel();
  timers.push(setTimeout(() => { if (!done) speak(); }, 150));
  timers.push(setTimeout(startSweep, 1000));

  return () => { finish('stopped by user'); debugSpeech('cancel (stop)'); synth.cancel(); };
}

function starts_count(text: string) {
  return (text.match(/\S+/g) ?? []).length;
}
