// Read-aloud with word highlighting, ported from ClearPath's approach. Text is
// gathered from the section most in view; each spoken word is marked with the
// CSS Custom Highlight API (no DOM changes). Browsers or voices that don't
// fire word boundaries get a timed highlight instead.

const SKIP = 'script, style, svg, canvas, button, input, textarea, select, nav, [aria-hidden="true"], .sr-only';
const HIGHLIGHT = 'read-aloud';

type Piece = { node: Text; start: number };

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
  let timer: ReturnType<typeof setInterval> | null = null;
  let fallbackStart: ReturnType<typeof setTimeout> | null = null;
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    if (timer) clearInterval(timer);
    if (fallbackStart) clearTimeout(fallbackStart);
    mark(null);
    onEnd();
  };

  if (!text.trim()) { finish(); return finish; }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  let boundaries = false;

  // Timed sweep for voices that never report word boundaries
  const starts: number[] = [];
  for (const m of text.matchAll(/\S+/g)) starts.push(m.index ?? 0);
  fallbackStart = setTimeout(() => {
    if (boundaries || done) return;
    let i = 0;
    timer = setInterval(() => {
      if (i >= starts.length) { if (timer) clearInterval(timer); return; }
      mark(wordRange(pieces, starts[i++]));
    }, 330);
  }, 800);

  utterance.onboundary = (e) => {
    if (e.name && e.name !== 'word') return;
    boundaries = true;
    if (timer) { clearInterval(timer); timer = null; }
    mark(wordRange(pieces, e.charIndex));
  };
  utterance.onend = finish;
  utterance.onerror = finish;

  synth.cancel();
  synth.speak(utterance);

  return () => { synth.cancel(); finish(); };
}
