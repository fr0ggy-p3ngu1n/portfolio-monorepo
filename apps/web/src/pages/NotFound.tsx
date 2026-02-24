import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Easter Egg C — LOTR themed 404
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center px-6 max-w-lg">
        <motion.div
          className="text-8xl mb-6 select-none"
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
        >
          🧙
        </motion.div>

        <motion.h1
          className="text-4xl font-bold text-amber-400 mb-4 font-serif"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          One does not simply 404 into Mordor
        </motion.h1>

        <motion.p
          className="text-gray-400 mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          The page you seek has been destroyed in the fires of Mount Doom.
          Even the eagles won't fly you there.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-amber-500 text-gray-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
          >
            Return to the Shire
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
