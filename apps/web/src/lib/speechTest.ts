// Self-running speech diagnostic: /?speech-test
//
// Firefox on macOS leaves speechSynthesis stuck after cancel() interrupts an
// utterance (speaking stays true, the next utterance stays pending forever).
// This tries several ways of stopping speech, one per page load (the page
// reloads between strategies so each starts clean), and reports whether a
// new utterance could start afterwards. Results print as a table at the end.

const KEY = 'speech-test-results';
const STRATEGIES: Record<string, (s: SpeechSynthesis) => Promise<void> | void> = {
  'cancel': (s) => { s.cancel(); },
  'pause, then cancel': (s) => { s.pause(); s.cancel(); },
  'cancel, then resume': (s) => { s.cancel(); s.resume(); },
  'cancel twice (200 ms apart)': async (s) => { s.cancel(); await wait(200); s.cancel(); },
  'cancel, then speak a blank': (s) => { s.cancel(); s.speak(new SpeechSynthesisUtterance(' ')); },
  'pause, cancel, resume': (s) => { s.pause(); s.cancel(); s.resume(); },
};
const NAMES = Object.keys(STRATEGIES);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const state = (s: SpeechSynthesis) => `speaking=${s.speaking} pending=${s.pending} paused=${s.paused}`;

function waitForVoices(s: SpeechSynthesis) {
  return new Promise<void>((resolve) => {
    if (s.getVoices().length) return resolve();
    s.addEventListener('voiceschanged', () => resolve(), { once: true });
    setTimeout(resolve, 2000);
  });
}

function speakAndWatch(s: SpeechSynthesis, text: string) {
  const u = new SpeechSynthesisUtterance(text);
  const events: string[] = [];
  let started = false;
  u.onstart = () => { started = true; events.push('start'); };
  u.onend = () => events.push('end');
  u.onerror = (e) => events.push(`error:${e.error}`);
  s.speak(u);
  return { events, started: () => started };
}

export async function runSpeechTest() {
  const s = window.speechSynthesis;
  const results = JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as Record<string, string>[];
  const index = results.length;

  if (index >= NAMES.length) {
    console.log('%c[speech-test] done. Copy everything from here down:', 'font-weight:bold;color:#ec4899');
    console.table(results);
    console.log('[speech-test] ' + JSON.stringify(results));
    sessionStorage.removeItem(KEY);
    return;
  }

  const name = NAMES[index];
  await waitForVoices(s);
  console.log(`[speech-test] ${index + 1}/${NAMES.length}: "${name}" (${s.getVoices().length} voices)`);

  // 1. Speak something long, and make sure it really started
  const first = speakAndWatch(s, 'Testing speech. This sentence is long enough to still be playing when it gets stopped part way through.');
  await wait(1800);
  const firstStarted = first.started();

  // 2. Stop it with this strategy
  await STRATEGIES[name](s);
  await wait(400);
  const afterStop = state(s);
  const firstEvents = first.events.join(' ');

  // 3. Can a new utterance start?
  const second = speakAndWatch(s, 'Second sentence.');
  await wait(3000);

  const row = {
    strategy: name,
    'first started': String(firstStarted),
    'first events': firstEvents,
    'state after stop': afterStop,
    'SECOND STARTED': second.started() ? 'YES' : 'no',
    'second events': second.events.join(' ') || '(none)',
  };
  console.log('[speech-test]', JSON.stringify(row));
  results.push(row);
  sessionStorage.setItem(KEY, JSON.stringify(results));
  s.cancel();
  await wait(300);
  location.reload();
}
