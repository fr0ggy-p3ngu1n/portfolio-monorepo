import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { playFire } from '../lib/gameAudio';

// ── Easter Egg A — Konami Code ──────────────────────────────────────
const KONAMI: string[] = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

// ── Easter Egg B — Type "shire" anywhere ────────────────────────────
const SHIRE_WORD = 'shire';

const GANDALF_TOASTS = [
  '"It\'s a dangerous business, Frodo, going out your door."',
  '"Not all those who wander are lost."',
  '"Even the smallest person can change the course of the future."',
  '"All we have to decide is what to do with the time that is given us."',
];

// ── Shared copy ─────────────────────────────────────────────────────
const RING_INSCRIPTION =
  'One Ring to rule them all,\nOne Ring to find them,\nOne Ring to bring them all,\nand in the darkness bind them.';

const IDLE_MS = 1 * 60 * 1000; // Easter Egg F — 1 minute

export default function EasterEggs() {
  const [showRing, setShowRing]   = useState(false); // A
  const [toast, setToast]         = useState<string | null>(null); // B
  const [showEye, setShowEye]     = useState(false); // F

  const konamiBuffer = useRef<string[]>([]);
  const shireBuffer  = useRef('');
  const idleTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restart the idle countdown without hiding the eye (used for mouse/scroll/key activity)
  const restartTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setShowEye(true), IDLE_MS);
  }, []);

  // Explicitly dismiss the eye and restart (used only when user clicks the eye)
  const dismissEye = useCallback(() => {
    playFire();
    setShowEye(false);
    restartTimer();
  }, [restartTimer]);

  useEffect(() => {
    restartTimer();

    const handleKeyDown = (e: KeyboardEvent) => {
      restartTimer();

      // A — Konami Code
      konamiBuffer.current = [...konamiBuffer.current, e.key].slice(-KONAMI.length);
      if (konamiBuffer.current.join(',') === KONAMI.join(',')) {
        setShowRing(true);
        konamiBuffer.current = [];
      }

      // B — type "shire"
      if (e.key.length === 1) {
        shireBuffer.current = (shireBuffer.current + e.key.toLowerCase()).slice(-SHIRE_WORD.length);
        if (shireBuffer.current === SHIRE_WORD) {
          const quote = GANDALF_TOASTS[Math.floor(Math.random() * GANDALF_TOASTS.length)];
          setToast(quote);
          shireBuffer.current = '';
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 5000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', restartTimer);
    window.addEventListener('click', restartTimer);
    window.addEventListener('scroll', restartTimer, { passive: true });
    window.addEventListener('touchstart', restartTimer, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', restartTimer);
      window.removeEventListener('click', restartTimer);
      window.removeEventListener('scroll', restartTimer);
      window.removeEventListener('touchstart', restartTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [restartTimer]);

  return (
    <>
      {/* Easter Egg A — One Ring overlay (Konami code) */}
      <AnimatePresence>
        {showRing && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowRing(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
              className="text-center px-8 max-w-lg"
            >
              <motion.div
                className="mb-8 select-none flex justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              >
                <img
                  src="/one-ring.png"
                  alt="The One Ring"
                  className="w-48 h-48 object-contain drop-shadow-[0_0_24px_rgba(212,160,23,0.8)]"
                />
              </motion.div>
              <p className="font-serif text-amber-400 text-xl leading-loose whitespace-pre-line tracking-widest">
                {RING_INSCRIPTION}
              </p>
              <p className="text-gray-500 text-xs mt-6 tracking-wider uppercase">
                The Dark Speech of Mordor
              </p>
              <p className="text-gray-600 text-xs mt-3">click anywhere to dismiss</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Easter Egg B — Gandalf toast (type "shire") */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 right-6 z-[9998] max-w-xs bg-gray-900 border border-amber-800/40 text-amber-300 rounded-xl px-5 py-4 shadow-2xl text-sm leading-relaxed"
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🧙</span>
              <p>{toast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Easter Egg F — Sauron's Eye (1 minute idle) */}
      <AnimatePresence>
        {showEye && (
          <motion.button
            className="fixed z-[9997] glass cursor-pointer flex items-center gap-4 rounded-xl px-4 py-3 border-none"
            style={{
              bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
              left: '1.5rem',
              background: 'linear-gradient(160deg, rgba(22, 10, 10, 0.93) 0%, rgba(15, 8, 8, 0.96) 100%)',
              border: '1px solid rgba(239,68,68,0.3)',
              boxShadow: '0 8px 32px rgba(239,68,68,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            onClick={dismissEye}
            aria-label="Dismiss"
          >
            <motion.img
              src="/eye-of-sauron.jpg"
              alt="The Eye of Sauron"
              className="w-12 h-12 rounded-full object-cover shrink-0"
              animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              style={{ filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.9))' }}
            />
            <div className="text-left">
              <p className="text-red-400 font-semibold text-sm leading-snug">The Eye of Sauron</p>
              <motion.p
                className="text-red-500/80 text-xs italic mt-0.5"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
              >
                I see you…
              </motion.p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
