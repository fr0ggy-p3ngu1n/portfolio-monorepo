import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReadingTools } from '../context/ReadingToolsContext';
import { canReadAloud, readAloud, sectionInView } from '../lib/readAloud';

// The reading-tools panel (opened from the header, the mobile menu or ⌘K)
// and the reading ruler overlay. Read aloud can be started from anywhere with:
//   window.dispatchEvent(new CustomEvent('reading-tools', { detail: 'read' | 'stop' }))

export const readingToolsAction = (action: 'read' | 'stop') =>
  window.dispatchEvent(new CustomEvent('reading-tools', { detail: action }));

function Switch({ on, label, hint, onToggle }: { on: boolean; label: string; hint: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-pink-400 cursor-pointer"
    >
      <span>
        <span className="block text-sm font-medium text-tx-primary">{label}</span>
        <span className="block text-xs text-tx-muted">{hint}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-pink-500' : 'bg-bd-primary'}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

function Ruler() {
  const [y, setY] = useState<number | null>(null);
  useEffect(() => {
    setY(window.innerHeight / 2);
    const move = (e: PointerEvent) => setY(e.clientY);
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  if (y === null) return null;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 z-[9990] pointer-events-none h-9 border-y-2 border-pink-500/60 bg-pink-500/10"
      style={{ top: y - 18 }}
    />
  );
}

export default function ReadingTools() {
  const { ruler, dyslexic, panelOpen, setPanelOpen, toggleRuler, toggleDyslexic, reading, setReading } = useReadingTools();
  const stopRef = useRef<(() => void) | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [speech, setSpeech] = useState(false);

  useEffect(() => { setSpeech(canReadAloud()); }, []);

  // Read aloud / stop, from the panel or ⌘K
  useEffect(() => {
    const onAction = (e: Event) => {
      const action = (e as CustomEvent<'read' | 'stop'>).detail;
      stopRef.current?.();
      stopRef.current = null;
      if (action === 'read' && canReadAloud()) {
        const section = sectionInView();
        if (!section) return;
        setReading(true);
        stopRef.current = readAloud(section, () => { setReading(false); stopRef.current = null; });
      } else {
        setReading(false);
      }
    };
    window.addEventListener('reading-tools', onAction);
    return () => { window.removeEventListener('reading-tools', onAction); stopRef.current?.(); };
  }, [setReading]);

  // Panel: Escape or a click outside closes it; focus moves in and back out
  useEffect(() => {
    if (!panelOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false); };
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!panelRef.current?.contains(t) && !t.closest('[data-reading-tools-opener]')) setPanelOpen(false);
    };
    window.addEventListener('keydown', key);
    window.addEventListener('mousedown', click);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('mousedown', click); opener?.focus?.(); };
  }, [panelOpen, setPanelOpen]);

  return (
    <>
      {ruler && <Ruler />}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Reading tools"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="glass-modal fixed z-[9993] top-[72px] left-4 right-4 sm:left-auto sm:right-6 sm:w-[22rem] rounded-2xl p-3 shadow-2xl"
          >
            <div className="flex items-center justify-between px-3 pt-1 pb-2">
              <p className="text-sm font-semibold text-tx-primary">Reading tools</p>
              <button type="button" onClick={() => setPanelOpen(false)} className="text-xs text-tx-muted hover:text-tx-primary cursor-pointer px-2 py-1 rounded-lg focus-visible:outline-2 focus-visible:outline-pink-400">
                Close
              </button>
            </div>
            <Switch on={ruler} onToggle={toggleRuler} label="Reading ruler" hint="A band that follows your cursor or finger" />
            <Switch on={dyslexic} onToggle={toggleDyslexic} label="Dyslexia-friendly font" hint="Switches the site to OpenDyslexic" />
            {speech && (
              <button
                type="button"
                onClick={() => readingToolsAction(reading ? 'stop' : 'read')}
                className="mt-1 w-full glass-accent rounded-xl px-3 py-2.5 text-sm font-semibold text-pink-200 hover:text-pink-100 focus-visible:outline-2 focus-visible:outline-pink-400 cursor-pointer"
              >
                {reading ? 'Stop reading' : 'Read this section aloud'}
              </button>
            )}
            <p className="px-3 pt-3 pb-1 text-xs text-tx-muted leading-relaxed">
              These come from ClearPath, my free browser extension that does this on any website.{' '}
              <a href="https://clearpathext.com/install/" target="_blank" rel="noopener noreferrer" className="text-tx-accent hover:underline">Get ClearPath</a>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {reading && !panelOpen && (
        <button
          type="button"
          onClick={() => readingToolsAction('stop')}
          className="glass-accent fixed z-[9993] bottom-6 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold text-pink-200 cursor-pointer shadow-xl focus-visible:outline-2 focus-visible:outline-pink-400"
        >
          Stop reading
        </button>
      )}
    </>
  );
}
