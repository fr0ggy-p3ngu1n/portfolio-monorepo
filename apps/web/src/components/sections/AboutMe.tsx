import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTilt } from '../../hooks/useTilt';
import RingRunner from '../RingRunner';

type Interest = {
  icon: string;
  title: string;
  description: string;
  href?: string;
};

const INTERESTS: Interest[] = [
  {
    icon: '🤘',
    title: 'Metal Vocalist',
    description:
      'I front a metal band as the lead vocalist. Writing riffs and putting everything into a performance is my creative outlet outside of code.',
    href: 'https://linktr.ee/BewitchedCadaver',
  },
  {
    icon: '🕹️',
    title: 'Gamer',
    description:
      'Gaming has been a lifelong passion — from deep RPG narratives to competitive multiplayer. A great game after a long sprint is the perfect reset.',
  },
  {
    icon: '🐈‍⬛',
    title: 'Cat Dad',
    description:
      'My cat is the undisputed CEO of the home office — an expert in walking across keyboards and demanding attention during standups.',
  },
  {
    icon: '☕',
    title: 'Coffee Enthusiast',
    description:
      "Coffee isn't a habit, it's a ritual. The first cup is non-negotiable before any meaningful code gets written.",
  },
  {
    icon: '🔪',
    title: 'Horror Movie Fan',
    description:
      'A good horror film is the ultimate exercise in tension and atmosphere — the same principles that make great UI. From slow-burn psychological dread to classic slashers, I love it all.',
  },
  {
    icon: '🥀',
    title: 'Tattoo Collector',
    description:
      'My tattoos are a personal gallery — each one a snapshot of something meaningful. The craft, the permanence, and the storytelling behind the art all speak to me.',
  },
];

// ─── Shared tilt card ─────────────────────────────────────────────────────────
function TiltCard({ interest }: { interest: Interest }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt(7);

  const inner = (
    <>
      <span className="text-3xl shrink-0 mt-0.5">{interest.icon}</span>
      <div>
        <h3 className="font-semibold text-tx-primary mb-1 flex items-center gap-1.5">
          {interest.title}
          {interest.href && (
            <span className="text-xs text-tx-amber font-normal">↗</span>
          )}
        </h3>
        <p className="text-sm text-tx-secondary leading-relaxed">{interest.description}</p>
      </div>
    </>
  );

  const sharedMotionProps = {
    whileHover: {
      boxShadow: '0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px rgba(217,119,6,0.55), 0 0 64px rgba(217,119,6,0.2)',
      transition: { boxShadow: { duration: 0 } },
    },
    onMouseMove,
    onMouseLeave,
    ref,
  };

  if (interest.href) {
    return (
      <motion.a
        href={interest.href}
        target="_blank"
        rel="noopener noreferrer"
        {...sharedMotionProps}
        className="glass rounded-xl p-6 flex gap-4 cursor-pointer h-full"
        style={{ textDecoration: 'none' }}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.div
      {...sharedMotionProps}
      className="glass rounded-xl p-6 flex gap-4 cursor-default h-full"
    >
      {inner}
    </motion.div>
  );
}

// ─── Gamer card — long-press to launch Ring Runner ────────────────────────────
const HOLD_MS   = 1500;
const RING_R    = 22;
const RING_CIRC = 2 * Math.PI * RING_R;

function GamerCard({ onOpen }: { onOpen: () => void }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt(7);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef    = useRef(0);

  const cancelHold = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(0);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    startRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const p = Math.min((Date.now() - startRef.current) / HOLD_MS, 1);
      setProgress(p);
      if (p >= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setProgress(0);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(80);
        onOpen();
      }
    }, 16);
  }, [onOpen]);

  const interest = INTERESTS.find(i => i.title === 'Gamer')!;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { onMouseLeave(); cancelHold(); }}
      onPointerDown={onPointerDown}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      whileHover={{
        boxShadow: '0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px rgba(217,119,6,0.55), 0 0 64px rgba(217,119,6,0.2)',
        transition: { boxShadow: { duration: 0 } },
      }}
      className="glass rounded-xl p-6 flex gap-4 cursor-pointer select-none h-full relative overflow-hidden"
      style={{ touchAction: 'none', userSelect: 'none' }}
    >
      {/* Progress ring overlay */}
      {progress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <svg width={58} height={58} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={29} cy={29} r={RING_R} fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth={3} />
            <circle
              cx={29} cy={29} r={RING_R}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC * (1 - progress)}
            />
          </svg>
        </div>
      )}

      <span className="text-3xl shrink-0 mt-0.5">{interest.icon}</span>
      <div>
        <h3 className="font-semibold text-tx-primary mb-1">{interest.title}</h3>
        <p className="text-sm text-tx-secondary leading-relaxed">{interest.description}</p>
        <p className="text-xs text-tx-muted mt-2 opacity-70">
          {progress > 0 ? '🧙 Summoning…' : 'Hold to summon the Ring Runner…'}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] as const } },
};

export default function AboutMe() {
  const [gameOpen, setGameOpen] = useState(false);

  return (
    <section id="about" className="bg-bg-surface py-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.h2
          className="text-3xl font-bold text-tx-primary mb-3 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          Beyond the Code
        </motion.h2>
        <motion.div
          className="h-px w-12 bg-amber-500 mx-auto mb-4 rounded-full"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.p
          className="text-tx-secondary text-center mb-12 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          When I&apos;m not shipping features, here&apos;s what keeps me going.
        </motion.p>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid sm:grid-cols-2 gap-5"
        >
          {INTERESTS.map((interest) => (
            <motion.div key={interest.title} variants={item} className="h-full">
              {interest.title === 'Gamer' ? (
                <GamerCard onOpen={() => setGameOpen(true)} />
              ) : (
                <TiltCard interest={interest} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Easter egg — LOTR runner game */}
      <AnimatePresence>
        {gameOpen && <RingRunner onClose={() => setGameOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}
