import { useRef, useCallback, useEffect } from 'react';

const TILT_STRENGTH = 6;
const GYRO_STRENGTH = 8;

// ─── Gyro singleton ──────────────────────────────────────────────────────────
// A single deviceorientation listener updates all registered card elements.
const gyroRefs = new Set<HTMLElement>();
let gyroListenerActive = false;

function onDeviceOrientation(e: DeviceOrientationEvent) {
  const gamma = e.gamma ?? 0; // left/right tilt: -90 to 90
  const beta  = e.beta  ?? 0; // front/back tilt: -180 to 180

  // ~45° beta = natural vertical hold angle → treat as neutral
  const x = Math.max(-1, Math.min(1, gamma / 25));
  const y = Math.max(-1, Math.min(1, (beta - 45) / 25));

  gyroRefs.forEach((el) => {
    el.style.transition = 'transform 0.1s ease';
    el.style.transform = `perspective(700px) rotateX(${-y * GYRO_STRENGTH}deg) rotateY(${x * GYRO_STRENGTH}deg) translateZ(4px)`;
  });
}

export function startGyroListener() {
  if (gyroListenerActive) return;
  window.addEventListener('deviceorientation', onDeviceOrientation);
  gyroListenerActive = true;
}

export const isTouchDevice =
  typeof window !== 'undefined' && navigator.maxTouchPoints > 0;

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTilt(strength = TILT_STRENGTH) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  // Gyro path: register element with global listener (touch/mobile)
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
