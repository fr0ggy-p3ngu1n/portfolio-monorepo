import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { smoothScrollTo } from '../lib/smoothScroll';
import { useTheme } from '../context/ThemeContext';

type Item = {
  group: string;
  icon: string;
  label: string;
  action: () => void;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();

  const close = () => { setOpen(false); setQuery(''); };
  const nav = (id: string) => { smoothScrollTo(id); close(); };

  const ALL_ITEMS: Item[] = [
    { group: 'Navigate', icon: '⚡', label: 'Skills',      action: () => nav('skills') },
    { group: 'Navigate', icon: '💼', label: 'Experience',  action: () => nav('experience') },
    { group: 'Navigate', icon: '🚀', label: 'Projects',    action: () => nav('projects') },
    { group: 'Navigate', icon: '🎓', label: 'Education',   action: () => nav('education') },
    { group: 'Navigate', icon: '🙋', label: 'About',       action: () => nav('about') },
    { group: 'Navigate', icon: '✉️',  label: 'Contact',    action: () => nav('contact') },
    {
      group: 'Links', icon: '🔗', label: 'LinkedIn',
      action: () => { window.open('https://www.linkedin.com/in/mlsulli', '_blank'); close(); },
    },
    {
      group: 'Links', icon: '📄', label: 'Download Resume',
      action: () => { const a = document.createElement('a'); a.href = '/resume.pdf'; a.download = 'Matthew Sullivan - Resume.pdf'; a.click(); close(); },
    },
    {
      group: 'Actions', icon: theme === 'dark' ? '☀️' : '🌙',
      label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      action: () => { toggle(); close(); },
    },
  ];

  const filtered = query.trim()
    ? ALL_ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : ALL_ITEMS;

  const groups = Array.from(new Set(filtered.map((i) => i.group)));

  useEffect(() => { setActiveIdx(0); }, [query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
        setActiveIdx(0);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[activeIdx]) {
        e.preventDefault();
        filtered[activeIdx].action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9994] flex items-start justify-center pt-[18vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="glass-modal rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <svg className="w-4 h-4 text-tx-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands…"
                className="flex-1 bg-transparent text-tx-primary text-sm placeholder:text-tx-muted outline-none"
              />
              <kbd className="text-[10px] text-tx-muted border border-bd-primary rounded px-1.5 py-0.5 font-sans">ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="py-1.5 max-h-72 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-tx-muted text-sm text-center py-8">No results for &ldquo;{query}&rdquo;</p>
              ) : (
                groups.map((group) => (
                  <div key={group}>
                    <p className="text-[10px] uppercase tracking-widest text-tx-muted px-4 pt-3 pb-1.5 font-semibold">
                      {group}
                    </p>
                    {filtered
                      .filter((i) => i.group === group)
                      .map((item) => {
                        const idx = filtered.indexOf(item);
                        const active = activeIdx === idx;
                        return (
                          <button
                            key={item.label}
                            data-idx={idx}
                            onClick={item.action}
                            onMouseEnter={() => setActiveIdx(idx)}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 cursor-pointer transition-colors border-none ${
                              active
                                ? 'bg-amber-500/15 text-tx-amber'
                                : 'text-tx-primary hover:bg-white/5'
                            }`}
                          >
                            <span className="text-base leading-none w-5 text-center shrink-0">
                              {item.icon}
                            </span>
                            <span className="flex-1">{item.label}</span>
                            {active && (
                              <kbd className="text-[10px] text-tx-muted border border-bd-primary rounded px-1.5 py-0.5 font-sans shrink-0">
                                ↵
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2.5 border-t border-white/10 flex items-center gap-4 text-[10px] text-tx-muted">
              <span className="flex items-center gap-1">
                <kbd className="border border-bd-primary rounded px-1 py-0.5 font-sans">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border border-bd-primary rounded px-1 py-0.5 font-sans">↵</kbd> select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border border-bd-primary rounded px-1 py-0.5 font-sans">⌘K</kbd> toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
