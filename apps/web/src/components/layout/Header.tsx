import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { smoothScrollTo } from '../../lib/smoothScroll';

const RESUME_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/resume`;

const NAV_SECTIONS = [
  { label: 'Skills',     id: 'skills'     },
  { label: 'Experience', id: 'experience' },
  { label: 'Projects',   id: 'projects'   },
  { label: 'Education',  id: 'education'  },
  { label: 'About',      id: 'about'      },
  { label: 'Contact',    id: 'contact'    },
];

export default function Header() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [activeId, setActiveId]   = useState('');
  const { theme, toggle }         = useTheme();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (id: string) => {
    smoothScrollTo(id);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 header-bg backdrop-blur-sm border-b border-bd-primary">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold text-tx-primary">
          <img src="/favicon.svg" alt="MS" className="w-7 h-7" />
          <span>
            <span className="text-tx-amber">&lt;</span>
            Matthew Sullivan
            <span className="text-tx-amber"> /&gt;</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {/* CMD+K hint */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
            className="hidden lg:flex items-center gap-1.5 text-tx-muted hover:text-tx-secondary transition-colors text-xs cursor-pointer border border-bd-primary rounded-md px-2 py-1 bg-bg-surface/50"
            aria-label="Open command palette"
          >
            <span>⌘K</span>
          </button>
          {NAV_SECTIONS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => smoothScrollTo(id)}
              className={`transition-colors cursor-pointer ${
                activeId === id
                  ? 'text-tx-amber'
                  : 'text-tx-secondary hover:text-tx-primary'
              }`}
            >
              {label}
            </button>
          ))}
          <a
            href="https://www.linkedin.com/in/mlsulli"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tx-secondary hover:text-tx-amber transition-colors"
          >
            LinkedIn ↗
          </a>
          <motion.a
            href={RESUME_URL}
            download="Matthew Sullivan - Resume.pdf"
            className="glass-amber relative overflow-hidden px-3 py-1.5 text-amber-300 hover:text-amber-100 rounded-lg transition-colors flex items-center gap-1"
            whileHover={{
              boxShadow: '0 0 20px rgba(217,119,6,0.45)',
              transition: { boxShadow: { duration: 0 } },
            }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="relative z-10">Resume</span>
            <motion.span
              className="relative z-10"
              animate={{ y: [0, 3, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            >
              ↓
            </motion.span>
            <span
              className="absolute inset-0 animate-shimmer pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.35) 50%, transparent 100%)',
                width: '40%',
              }}
            />
          </motion.a>
          <motion.button
            onClick={toggle}
            className="glass-amber flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer"
            whileHover={{
              boxShadow: '0 0 20px rgba(217,119,6,0.45)',
              transition: { duration: 0 },
            }}
            whileTap={{ scale: 0.95 }}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="text-base leading-none">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="text-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </motion.button>
        </nav>

        {/* Mobile hamburger button */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 cursor-pointer"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(35);
            setMenuOpen((o) => !o);
          }}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <motion.span
            className="block w-6 h-0.5 bg-slate-300 rounded-full origin-center"
            animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.22 }}
          />
          <motion.span
            className="block w-6 h-0.5 bg-slate-300 rounded-full"
            animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.22 }}
          />
          <motion.span
            className="block w-6 h-0.5 bg-slate-300 rounded-full origin-center"
            animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.22 }}
          />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height:  { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.28, ease: 'easeOut' },
            }}
            className="md:hidden overflow-hidden border-t border-bd-primary bg-bg-base"
          >
            <nav className="flex flex-col px-6 py-4 gap-1">
              {NAV_SECTIONS.map(({ label, id }, i) => (
                <motion.button
                  key={id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + i * 0.05, duration: 0.28, ease: 'easeOut' }}
                  onClick={() => handleNavClick(id)}
                  className={`text-left py-3 text-sm font-medium transition-colors border-b border-bd-secondary last:border-0 cursor-pointer ${
                    activeId === id
                      ? 'text-tx-amber'
                      : 'text-tx-secondary hover:text-tx-amber'
                  }`}
                >
                  {label}
                </motion.button>
              ))}
              <motion.a
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 + NAV_SECTIONS.length * 0.05, duration: 0.28, ease: 'easeOut' }}
                href="https://www.linkedin.com/in/mlsulli"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-sm font-medium text-tx-secondary hover:text-tx-amber transition-colors"
              >
                LinkedIn ↗
              </motion.a>
              <motion.a
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 + (NAV_SECTIONS.length + 1) * 0.05, duration: 0.28, ease: 'easeOut' }}
                href={RESUME_URL}
                download="Matthew Sullivan - Resume.pdf"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-sm font-medium text-tx-amber transition-colors flex items-center gap-1"
              >
                <span>Resume</span>
                <motion.span
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ↓
                </motion.span>
              </motion.a>
              <motion.button
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 + (NAV_SECTIONS.length + 2) * 0.05, duration: 0.28, ease: 'easeOut' }}
                onClick={() => { toggle(); setMenuOpen(false); }}
                className="py-3 text-sm font-medium text-tx-secondary hover:text-tx-primary transition-colors flex items-center gap-2 text-left cursor-pointer border-t border-bd-secondary"
              >
                {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </motion.button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
