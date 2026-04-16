import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { smoothScrollTo } from '../../lib/smoothScroll';

const NAME_WORDS = ['Matthew', 'Sullivan'];

const ROLES = [
  'Full-Stack Engineer',
  'Embedded Systems Developer',
  'Salesforce Developer',
  'SQA Developer',
];

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

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[88vh] flex items-center bg-bg-base"
    >
      {/* Animated dot-grid background */}
      <div
        className="absolute inset-0 -z-10 animate-dot-drift"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(217,119,6,0.18) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-base/60 via-transparent to-bg-base" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg-base/70 via-transparent to-bg-base/70" />

      {/* Parallax content */}
      <motion.div
        style={{ y, opacity }}
        className="max-w-6xl mx-auto px-6 py-24 md:py-32 w-full"
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
                <span
                  className="bg-clip-text text-transparent animate-gradient-sweep"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #f59e0b 100%)',
                  }}
                >
                  {word}
                </span>
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="text-lg font-mono text-tx-amber/80 mb-6 h-7"
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
              I started my career in embedded systems and manufacturing software — environments
              where reliability isn&apos;t optional and the hardware doesn&apos;t forgive mistakes.
              That foundation shapes how I think about software today.
            </p>
            <p>
              At{' '}
              <a
                href="https://landing.ehma.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tx-amber hover:underline"
              >
                EHMA.ai
              </a>{' '}
              I build and own wAve — an AI-powered solar sales platform — across the full stack.
              In 11 weeks I helped take the platform from no CI/CD, no monitoring, and silent
              failures everywhere to production-grade: 828% increase in test coverage, API
              response times from 18 seconds to 316ms, zero-downtime database migration of
              556K records, and a full PII security overhaul.
            </p>
            <p>
              Outside of work I&apos;m building{' '}
              <a
                href="https://sproutaac.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-tx-amber hover:underline"
              >
                Sprout AAC
              </a>{' '}
              — a free, open-source communication app for children who communicate differently.
              Commercial alternatives cost $150–$250. They shouldn&apos;t have to.
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
                      ? '0 0 28px rgba(217,119,6,0.6), 0 0 56px rgba(217,119,6,0.2)'
                      : '0 0 24px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.25)',
                    transition: { boxShadow: { duration: 0 } },
                  }}
                  whileTap={{ scale: 0.97 }}
                  className={
                    primary
                      ? 'glass-amber px-6 py-3 text-amber-200 font-semibold rounded-xl hover:text-amber-100 transition-colors'
                      : 'glass px-6 py-3 text-tx-primary font-medium rounded-xl hover:text-white transition-colors'
                  }
                >
                  {label}
                </motion.button>
              )
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <motion.div
          className="w-px h-10 bg-amber-700 origin-top"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
