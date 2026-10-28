import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { smoothScrollTo } from '../../lib/smoothScroll';

const NAME_WORDS = ['Matthew', 'Sullivan'];

const ROLES = [
  'Full-Stack Developer',
  'Platform Engineer',
  'iOS Developer',
  'Accessibility Engineer',
  'Embedded Systems Developer',
];

// What's on the go right now. Update NOW_UPDATED whenever this changes.
const NOW_UPDATED = 'Oct 2026';
const NOW: { label: string; before?: string; link: { href: string; text: string }; after?: string }[] = [
  { label: 'Building',      before: 'wAve at ', link: { href: 'https://landing.ehma.ai/', text: 'EHMA.ai' } },
  { label: 'Shipping',      link: { href: 'https://sproutaac.org', text: 'Sprout AAC' }, after: ': v0.1.0 is out on macOS, and v0.2 (Open Board Format support) is in progress' },
  { label: 'Just launched', link: { href: 'https://theredactedrecords.com', text: 'Redacted Records' }, after: ', a booking site for a Phoenix mixing engineer' },
  { label: 'Polishing',     link: { href: 'https://clearpathext.com', text: 'ClearPath' }, after: ': an accessibility pass before it goes into the browser stores' },
];

function NowCard() {
  return (
    <motion.aside
      className="glass rounded-2xl p-6 w-full max-w-md lg:max-w-none"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.05, ease: [0.21, 0.47, 0.32, 0.98] }}
      aria-labelledby="now-heading"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 id="now-heading" className="flex items-center gap-2 text-sm font-semibold text-tx-primary tracking-wide uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-pink-500 opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
          </span>
          Now
        </h2>
        <span className="text-xs text-tx-muted">Updated {NOW_UPDATED}</span>
      </div>
      <ul className="space-y-4">
        {NOW.map((item) => (
          <li key={item.label}>
            <p className="text-xs font-mono text-tx-accent/80 mb-0.5">{item.label}</p>
            <p className="text-sm text-tx-secondary leading-relaxed">
              {item.before}
              <a href={item.link.href} target="_blank" rel="noopener noreferrer" className="text-tx-primary font-medium hover:text-tx-accent transition-colors">
                {item.link.text}
              </a>
              {item.after}
            </p>
          </li>
        ))}
      </ul>
    </motion.aside>
  );
}

function useTypewriter(words: string[], speed = 70, pause = 1800, deleteSpeed = 38) {
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const word = words[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (display.length < word.length) {
        timeout = setTimeout(() => setDisplay(word.slice(0, display.length + 1)), speed);
      } else {
        timeout = setTimeout(() => setPhase('pausing'), pause);
      }
    } else if (phase === 'pausing') {
      timeout = setTimeout(() => setPhase('deleting'), 0);
    } else {
      if (display.length > 0) {
        timeout = setTimeout(() => setDisplay(display.slice(0, -1)), deleteSpeed);
      } else {
        setWordIdx((i) => (i + 1) % words.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timeout);
  }, [display, phase, wordIdx, words, speed, pause, deleteSpeed]);

  return display;
}

type CtaLink = {
  label: string;
  primary?: boolean;
  section?: string;
  href?: string;
};

const LINKS: CtaLink[] = [
  { label: 'My Experience', section: 'experience', primary: true },
  { label: 'Projects',      section: 'projects' },
  { label: 'LinkedIn ↗',   href: 'https://www.linkedin.com/in/mlsulli' },
  { label: 'Get in touch',  section: 'contact' },
];


export default function Hero() {
  const sectionRef = useRef(null);
  const role = useTypewriter(ROLES);
  const { scrollY } = useScroll();

  const y       = useTransform(scrollY, [0, 600], [0, -140]);
  const opacity = useTransform(scrollY, [0, 650], [1, 0]);

  // On narrower screens the hero is taller than the fade distance, so the
  // parallax would fade the bio (and the Now card under it) while you read.
  const [parallax, setParallax] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setParallax(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[88vh] flex items-center bg-bg-base"
    >
      {/* Animated dot-grid background */}
      <div
        className="absolute inset-0 -z-10 animate-dot-drift"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(236,72,153,0.18) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-base/60 via-transparent to-bg-base" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg-base/70 via-transparent to-bg-base/70" />

      {/* Parallax content */}
      <motion.div
        style={parallax ? { y, opacity } : undefined}
        className="max-w-6xl mx-auto px-6 py-24 md:py-32 w-full grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center"
      >
        <div className="max-w-3xl">

          <motion.p
            className="text-lg font-medium text-tx-secondary mb-3 tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Hi, I&apos;m
          </motion.p>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight flex flex-wrap gap-x-4">
            {NAME_WORDS.map((word, i) => (
              <motion.span
                key={word}
                className="inline-block"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.2 + i * 0.18,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
              >
                <span className="name-gradient bg-clip-text text-transparent animate-gradient-sweep">
                  {word}
                </span>
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="text-lg font-mono text-tx-accent/80 mb-6 h-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.56 }}
          >
            {role}
            <span className="animate-blink ml-0.5">|</span>
          </motion.p>

          <motion.div
            className="text-xl text-tx-secondary mb-10 leading-relaxed space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.72 }}
          >
            <p>
              I started out writing embedded and manufacturing software at Tibit Communications,
              where code ran on real hardware and mistakes were expensive. I still build and test
              that way.
            </p>
            <p>
              At{' '}
              <a
                href="https://landing.ehma.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tx-accent hover:underline"
              >
                EHMA.ai
              </a>
              , I own wAve, an AI-powered solar sales platform, from front end to back end. In 11
              weeks I set up CI/CD and monitoring, raised test coverage by 828%, cut API response
              times from 18 seconds to 316ms, migrated 556K records with no downtime, and
              overhauled how we handle personal data.
            </p>
            <p>
              Outside work, I&apos;m building{' '}
              <a
                href="https://sproutaac.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tx-accent hover:underline"
              >
                Sprout AAC
              </a>
              , a free, open-source app that gives kids who can&apos;t rely on speech a way to
              communicate. Commercial AAC apps cost $150–$250. Sprout is free.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
            {LINKS.map(({ label, primary, section, href }) =>
              href ? (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{
                    boxShadow: '0 0 24px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.25)',
                    transition: { boxShadow: { duration: 0 } },
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="glass px-6 py-3 text-tx-primary font-medium rounded-xl hover:text-white transition-colors"
                >
                  {label}
                </motion.a>
              ) : (
                <motion.button
                  key={label}
                  onClick={() => smoothScrollTo(section!)}
                  whileHover={{
                    boxShadow: primary
                      ? '0 0 28px rgba(236,72,153,0.6), 0 0 56px rgba(236,72,153,0.2)'
                      : '0 0 24px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.25)',
                    transition: { boxShadow: { duration: 0 } },
                  }}
                  whileTap={{ scale: 0.97 }}
                  className={
                    primary
                      ? 'glass-accent px-6 py-3 text-pink-200 font-semibold rounded-xl hover:text-pink-100 transition-colors'
                      : 'glass px-6 py-3 text-tx-primary font-medium rounded-xl hover:text-white transition-colors'
                  }
                >
                  {label}
                </motion.button>
              )
            )}
          </motion.div>
        </div>

        <NowCard />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <motion.div
          className="w-px h-10 bg-pink-700 origin-top"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
