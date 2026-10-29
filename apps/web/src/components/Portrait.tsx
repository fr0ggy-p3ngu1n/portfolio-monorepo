import { useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTilt } from '../hooks/useTilt';

// Headshot inside the brand ring (the same pink→violet ring as the MS mark).
// On load a signal trace with the mark's "M" blip draws around the photo, then
// flattens into the ring and its two solder pads appear. Clicking swaps in Goose.

const C = 256;          // centre of the 512×512 viewBox
const R = 222;          // ring radius
const AMP = 24;         // height of the M blip
const GAP_FROM = 30;    // gap in the ring (degrees, clockwise from 3 o'clock)
const GAP_TO = 58;
const POINTS = 160;

// The M: up, dip below the line, up again, back to flat
const BLIP: [number, number][] = [[0, 0], [0.2, 1], [0.45, -0.35], [0.7, 1], [0.9, 0], [1, 0]];
const BLIP_CENTRE = 270; // top of the ring
const BLIP_WIDTH = 56;

function blip(deg: number) {
  const u = (deg - (BLIP_CENTRE - BLIP_WIDTH / 2)) / BLIP_WIDTH;
  if (u <= 0 || u >= 1) return 0;
  for (let i = 1; i < BLIP.length; i++) {
    const [u0, v0] = BLIP[i - 1];
    const [u1, v1] = BLIP[i];
    if (u <= u1) return v0 + ((u - u0) / (u1 - u0)) * (v1 - v0);
  }
  return 0;
}

const pt = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};

// Same number of points in both paths so framer-motion can morph between them
function ringPath(withBlip: boolean) {
  const start = GAP_TO;
  const sweep = 360 - (GAP_TO - GAP_FROM);
  let d = '';
  for (let i = 0; i <= POINTS; i++) {
    const deg = start + (sweep * i) / POINTS;
    const [x, y] = pt(deg, R + (withBlip ? AMP * blip(deg % 360) : 0));
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

const TRACE = ringPath(true);
const FLAT = ringPath(false);
const PAD_START = pt(GAP_TO, R);
const PAD_END = pt(GAP_FROM, R);

const PHOTOS = {
  matthew: { name: 'matthew', alt: 'Matthew Sullivan' },
  goose: { name: 'goose', alt: 'Goose, a grey and white cat, staring into the camera' },
} as const;

function Photo({ name, alt, visible }: { name: string; alt: string; visible: boolean }) {
  return (
    <picture>
      <source type="image/avif" srcSet={`/portrait/${name}-320.avif 320w, /portrait/${name}-640.avif 640w`} sizes="(min-width: 1024px) 14rem, 11rem" />
      <img
        src={`/portrait/${name}-640.webp`}
        srcSet={`/portrait/${name}-320.webp 320w, /portrait/${name}-640.webp 640w`}
        sizes="(min-width: 1024px) 14rem, 11rem"
        width={640}
        height={640}
        alt={visible ? alt : ''}
        aria-hidden={!visible}
        decoding="async"
        className={`absolute inset-0 h-full w-full rounded-full object-cover transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
    </picture>
  );
}

export default function Portrait() {
  const id = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const [goose, setGoose] = useState(false);
  const { ref, onMouseMove, onMouseLeave } = useTilt(10);

  // Trace draws (1.1 s), then flattens into the ring (0.5 s), then the pads pop in
  const traceIn = reduce ? false : { pathLength: 0, d: TRACE };
  const traceTo = reduce
    ? undefined
    : { pathLength: [0, 1, 1], d: [TRACE, TRACE, FLAT] };
  const traceTiming = { duration: 1.6, delay: 0.35, times: [0, 0.69, 1], ease: 'easeInOut' as const };

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={reduce ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {/* Tilt lives on the button, the entrance on the wrapper, so they never
          fight over the same transform */}
      <button
        type="button"
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={() => setGoose((g) => !g)}
        aria-pressed={goose}
        aria-label={goose ? 'Show Matthew again' : 'Who really writes the code? Show Goose'}
        className="portrait peer relative block size-44 lg:size-56 rounded-full cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-400"
      >
        <span className="absolute inset-[11%] overflow-hidden rounded-full bg-bg-surface">
          <Photo {...PHOTOS.matthew} visible={!goose} />
          <Photo {...PHOTOS.goose} visible={goose} />
        </span>

        <svg viewBox="0 0 512 512" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={`${id}-ring`} gradientUnits="userSpaceOnUse" x1="40" y1="472" x2="472" y2="40">
              <stop offset="0" stopColor="#EC4899" />
              <stop offset="1" stopColor="#A78BFA" />
            </linearGradient>
          </defs>
          <g className="portrait-ring">
            <motion.path
              d={reduce ? FLAT : undefined}
              initial={traceIn}
              animate={traceTo}
              transition={traceTiming}
              fill="none"
              stroke={`url(#${id}-ring)`}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {[PAD_START, PAD_END].map(([x, y], i) => (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="11"
                fill="var(--bg-base)"
                stroke={`url(#${id}-ring)`}
                strokeWidth="6"
                initial={reduce ? false : { opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 1.95 + i * 0.08, ease: 'backOut' }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
            ))}
          </g>
        </svg>
      </button>

      {/* Fixed height so the caption never shifts the layout. The hint only
          shows on hover/focus; screen readers get the button's label instead. */}
      {goose ? (
        <p className="mt-3 h-5 text-sm font-mono text-tx-secondary" aria-live="polite">
          Goose. Reviews every PR.
        </p>
      ) : (
        <p
          className="mt-3 h-5 text-sm font-mono text-tx-secondary opacity-0 transition-opacity duration-300 peer-hover:opacity-100 peer-focus-visible:opacity-100"
          aria-hidden="true"
        >
          psst, click me
        </p>
      )}
    </motion.div>
  );
}
