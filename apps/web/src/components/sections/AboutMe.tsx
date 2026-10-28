import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTilt } from '../../hooks/useTilt';
import Icon, { type IconName } from '../Icon';
// The game only loads when someone summons it; the hold starts the download early.
const loadRingRunner = () => import('../RingRunner');
const RingRunner = lazy(loadRingRunner);

type Interest = {
  icon: IconName;
  title: string;
  description: string;
  href?: string;
};

const INTERESTS: Interest[] = [
  {
    icon: 'mic',
    title: 'Metal Vocalist',
    description:
      "I sing in Bewitched Cadaver, a metal band. It's my main creative outlet outside of code.",
    href: 'https://linktr.ee/BewitchedCadaver',
  },
  {
    icon: 'gamepad',
    title: 'Gamer',
    description:
      "I've played games my whole life, from long story-driven RPGs to competitive multiplayer. It's how I switch off after a long sprint.",
  },
  {
    icon: 'user',
    title: 'Cat Dad',
    description:
      'Goose is my grey and white cat and the real boss of my home office. Walks across the keyboard, joins standups uninvited.',
  },
  {
    icon: 'coffee',
    title: 'Coffee Enthusiast',
    description:
      'The first cup comes before any real code gets written. No exceptions.',
  },
  {
    icon: 'ghost',
    title: 'Horror Movie Fan',
    description:
      "Slow-burn psychological horror and classic slashers alike. I'll watch almost anything in the genre.",
  },
  {
    icon: 'pen',
    title: 'Tattoo Collector',
    description:
      'Each one marks something that mattered to me when I got it, and the collection keeps growing.',
  },
];

// ─── Shared tilt card ─────────────────────────────────────────────────────────
function TiltCard({ interest }: { interest: Interest }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt(7);

  const inner = (
    <>
      <span className="w-11 h-11 rounded-xl glass flex items-center justify-center shrink-0"><Icon name={interest.icon} size={22} /></span>
      <div>
        <h3 className="font-semibold text-tx-primary mb-1 flex items-center gap-1.5">
          {interest.title}
          {interest.href && (
            <span className="text-xs text-tx-accent font-normal">↗</span>
          )}
        </h3>
        <p className="text-sm text-tx-secondary leading-relaxed">{interest.description}</p>
      </div>
    </>
  );

  const sharedMotionProps = {
    whileHover: {
      boxShadow: '0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px rgba(236,72,153,0.55), 0 0 64px rgba(236,72,153,0.2)',
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

// ─── Cat Dad card — Goose's photos fan out on hover / tap ─────────────────────
const GOOSE_PHOTOS = [
  { src: '/goose/goose-window.webp', alt: 'Goose looking up from a window perch' },
  { src: '/goose/goose-couch.webp',  alt: 'Goose staring into the camera from the couch' },
  { src: '/goose/goose-fridge.webp', alt: 'Goose sitting by the fridge, unimpressed' },
  { src: '/goose/goose-floor.webp',  alt: 'Goose on the living room floor' },
];
const FAN_ROTATE = [-14, -5, 5, 14];
const FAN_X      = [-150, -52, 52, 150];

function GooseCard({ interest }: { interest: Interest }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt(7);
  const [open, setOpen] = useState(false);
  const pointerType = useRef('mouse');

  // Touch: the card toggles on tap, and a tap anywhere else closes it
  useEffect(() => {
    if (!open || pointerType.current === 'mouse') return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open, ref]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onPointerDown={(e) => { pointerType.current = e.pointerType; }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setOpen(true); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setOpen(false); }}
      onMouseLeave={onMouseLeave}
      onClick={() => { if (pointerType.current !== 'mouse') setOpen((o) => !o); }}
      onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
      whileHover={{
        boxShadow: '0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px rgba(236,72,153,0.55), 0 0 64px rgba(236,72,153,0.2)',
        transition: { boxShadow: { duration: 0 } },
      }}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label="Cat Dad. Show photos of Goose"
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen((o) => !o); }}
      className={`glass rounded-xl p-6 flex gap-4 cursor-pointer select-none h-full relative ${open ? 'z-30' : 'z-0'}`}
    >
      {/* The fan sits above the card so opening it never shifts the grid */}
      <div className="absolute left-1/2 bottom-[calc(100%-1.5rem)] pointer-events-none origin-bottom scale-[0.72] sm:scale-100" aria-hidden={!open}>
        {GOOSE_PHOTOS.map((photo, i) => (
          <motion.img
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            width={112}
            height={112}
            loading="lazy"
            decoding="async"
            initial={false}
            animate={open
              ? { opacity: 1, x: FAN_X[i] - 56, y: 0, rotate: FAN_ROTATE[i], scale: 1 }
              : { opacity: 0, x: -56, y: 40, rotate: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24, delay: open ? i * 0.04 : 0 }}
            className="absolute bottom-0 w-28 h-28 max-w-none rounded-md object-cover bg-white p-1.5 pb-4 shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
          />
        ))}
      </div>

      <img
        src="/goose/goose-squint.webp"
        alt=""
        width={44}
        height={44}
        decoding="async"
        className="w-11 h-11 rounded-full object-cover shrink-0 mt-0.5 ring-2 ring-pink-500/60"
      />
      <div>
        <h3 className="font-semibold text-tx-primary mb-1">{interest.title}</h3>
        <p className="text-sm text-tx-secondary leading-relaxed">{interest.description}</p>
        <p className="text-xs text-tx-muted mt-2 opacity-70">
          {open ? 'Goose has been summoned.' : 'Hover or tap to meet Goose…'}
        </p>
      </div>
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
    loadRingRunner();
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
        boxShadow: '0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px rgba(236,72,153,0.55), 0 0 64px rgba(236,72,153,0.2)',
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

      <span className="w-11 h-11 rounded-xl glass flex items-center justify-center shrink-0"><Icon name={interest.icon} size={22} /></span>
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
          className="h-px w-12 bg-pink-500 mx-auto mb-4 rounded-full"
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
              ) : interest.title === 'Cat Dad' ? (
                <GooseCard interest={interest} />
              ) : (
                <TiltCard interest={interest} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Easter egg — LOTR runner game */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {gameOpen && <RingRunner onClose={() => setGameOpen(false)} />}
        </AnimatePresence>
      </Suspense>
    </section>
  );
}
