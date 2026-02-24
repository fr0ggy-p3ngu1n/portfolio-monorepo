import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';

const INSCRIPTION =
  'One Ring to rule them all, One Ring to find them, One Ring to bring them all, and in the darkness bind them.';

// Easter Eggs D (click copyright 3×) and I (scroll to bottom)
export default function Footer() {
  const [clicks, setClicks] = useState(0);
  const [glow, setGlow] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: false });

  const handleCopyrightClick = () => {
    const next = clicks + 1;
    setClicks(next);
    if (next >= 3) {
      setGlow(true);
      setClicks(0);
      setTimeout(() => setGlow(false), 5000);
    }
  };

  return (
    <footer ref={footerRef} className="bg-bg-header border-t border-bd-primary py-10 mt-16">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-5">

        {/* Monogram */}
        <div className="flex justify-center">
          <img src="/favicon.svg" alt="MS" className="w-10 h-10 opacity-60" />
        </div>

        {/* Stack badges */}
        <div>
          <p className="text-xs text-tx-muted uppercase tracking-widest mb-3">Built with</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'React', 'Vite', 'TypeScript', 'Hono', 'Cloudflare Workers',
              'Cloudflare Pages', 'D1', 'Prisma', 'Tailwind v4', 'Framer Motion', 'pnpm',
            ].map((tech) => (
              <span
                key={tech}
                className="tag text-xs text-tx-primary px-2.5 py-1 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Repo link + copyright */}
        <p className="text-sm text-tx-muted">
          <a
            href="https://github.com/fr0ggy-p3ngu1n/portfolio-monorepo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tx-secondary hover:text-tx-amber transition-colors"
          >
            GitHub ↗
          </a>
          {' · '}
          <span
            onClick={handleCopyrightClick}
            className="cursor-default select-none"
          >
            &copy; {new Date().getFullYear()} Matthew Sullivan.
          </span>
        </p>
        {/* Easter Egg I — faint inscription on scroll to bottom */}
        {/* Easter Egg D — brightens to amber on 3× click */}
        <AnimatePresence>
          <motion.p
            className="text-xs font-serif tracking-widest"
            animate={{
              opacity: glow ? 1 : isInView ? 0.15 : 0,
              color: glow ? '#d97706' : '#6b7280',
            }}
            transition={{ duration: glow ? 0.4 : 1.5 }}
          >
            {INSCRIPTION}
          </motion.p>
        </AnimatePresence>
      </div>
    </footer>
  );
}
