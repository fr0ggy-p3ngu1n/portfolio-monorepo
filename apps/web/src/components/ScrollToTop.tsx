import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          whileHover={{
            boxShadow: '0 0 20px rgba(217,119,6,0.5)',
            transition: { boxShadow: { duration: 0 } },
          }}
          className="fixed bottom-6 right-6 z-[9900] glass-amber w-10 h-10 rounded-full flex items-center justify-center text-amber-300 hover:text-amber-100 transition-colors cursor-pointer"
          aria-label="Scroll to top"
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
}
