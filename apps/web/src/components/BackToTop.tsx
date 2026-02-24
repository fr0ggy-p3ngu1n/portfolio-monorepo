import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { smoothScrollToTop } from '../lib/smoothScroll';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
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
            boxShadow: '0 0 24px rgba(217,119,6,0.5)',
            transition: { duration: 0 },
          }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
            smoothScrollToTop();
          }}
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))', right: '1.5rem' }}
          className="fixed z-[9989] glass-amber w-10 h-10 rounded-full flex items-center justify-center text-tx-amber font-bold text-lg cursor-pointer border-none"
          aria-label="Back to top"
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
}
