import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { smoothScrollToTop } from '../lib/smoothScroll';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const lastY = useRef(0);

  // Shown once you're well down the page and heading back up (or at the very
  // bottom), so it doesn't sit on top of content while you're reading down.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < 8) return;
      const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 120;
      setVisible(y > 600 && (delta < 0 || atBottom));
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          whileHover={{
            scale: 1.1,
            boxShadow: '0 0 24px rgba(236,72,153,0.5)',
            transition: { duration: 0 },
          }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
            smoothScrollToTop();
          }}
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))', right: '1rem' }}
          className="fixed z-[9989] glass-accent w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-tx-accent font-bold text-lg cursor-pointer border-none"
          aria-label="Back to top"
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
}
