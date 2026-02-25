import { useRef, useCallback, useEffect } from 'react';

const TILT_STRENGTH = 6;
const GYRO_STRENGTH = 5;

// ─── Gyro singleton ──────────────────────────────────────────────────────────
// Delta-based (Option B): tracks how much the phone MOVES, not where it points.
// Cards tilt in response to movement then spring back to flat when held still.
// This means any static hold angle — phone straight up, lying in bed, etc. —
// reads as neutral. Only active movement produces tilt.
//
// Pipeline:
//   deviceorientation → compute angle delta → accumulate into target
//   RAF loop          → decay target toward 0 + lerp current toward target
const gyroRefs = new Set<HTMLElement>();
let gyroListenerActive = false;
let gyroRafId: number | null = null;

let prevGamma  = 0;
let prevBeta   = 0;
let hasInitial = false;   // skip first event — no previous to diff against

let targetX  = 0;   // where we want to be (decays toward 0)
let targetY  = 0;
let currentX = 0;   // what's actually rendered (lerps toward target)
let currentY = 0;

// How many degrees of sustained movement drive the card to full tilt.
// Lower = more sensitive.
const SENS  = 4;
// Fraction of target remaining after each RAF frame (60 fps → ~0.7 s to flat).
const DECAY = 0.88;
// Fraction of the gap closed per frame between current and target.
const LERP  = 0.12;

function gyroTick() {
  targetX  *= DECAY;
  targetY  *= DECAY;

  currentX += (targetX - currentX) * LERP;
  currentY += (targetY - currentY) * LERP;

  gyroRefs.forEach((el) => {
    el.style.transform =
      `perspective(700px) rotateX(${-currentY * GYRO_STRENGTH}deg) rotateY(${currentX * GYRO_STRENGTH}deg) translateZ(4px)`;
  });

  gyroRafId = requestAnimationFrame(gyroTick);
}

function onDeviceOrientation(e: DeviceOrientationEvent) {
  const gamma = e.gamma ?? 0;
  const beta  = e.beta  ?? 0;

  if (!hasInitial) {
    prevGamma  = gamma;
    prevBeta   = beta;
    hasInitial = true;
    return;
  }

  const dGamma = gamma - prevGamma;
  const dBeta  = beta  - prevBeta;
  prevGamma = gamma;
  prevBeta  = beta;

  // Accumulate movement into target, clamped to [-1, 1]
  targetX = Math.max(-1, Math.min(1, targetX + dGamma / SENS));
  targetY = Math.max(-1, Math.min(1, targetY + dBeta  / SENS));
}

export function startGyroListener() {
  if (gyroListenerActive) return;
  // Reset all state so each enable starts clean
  hasInitial = false;
  targetX = 0; targetY = 0;
  currentX = 0; currentY = 0;
  window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
  gyroListenerActive = true;
  gyroRafId = requestAnimationFrame(gyroTick);
}

export function stopGyroListener() {
  if (!gyroListenerActive) return;
  window.removeEventListener('deviceorientation', onDeviceOrientation);
  if (gyroRafId !== null) cancelAnimationFrame(gyroRafId);
  gyroListenerActive = false;
  gyroRafId = null;
}

export const isTouchDevice =
  typeof window !== 'undefined' && navigator.maxTouchPoints > 0;

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTilt(strength = TILT_STRENGTH) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  // Gyro path: register element with global singleton (touch/mobile)
  useEffect(() => {
    if (!isTouchDevice) return;
    const el = ref.current;
    if (!el) return;
    gyroRefs.add(el);
    return () => { gyroRefs.delete(el); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mouse path: per-element cursor tracking (desktop)
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isTouchDevice) return;
      const el = ref.current;
      if (!el) return;
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      el.style.transition = 'transform 0.08s ease';
      el.style.transform = `perspective(700px) rotateX(${-y * strength}deg) rotateY(${x * strength}deg) translateZ(6px)`;
    },
    [strength],
  );

  const onMouseLeave = useCallback(() => {
    if (isTouchDevice) return;
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.4s ease';
    el.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
