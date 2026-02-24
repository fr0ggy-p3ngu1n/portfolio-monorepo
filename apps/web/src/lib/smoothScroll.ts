function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateScroll(targetY: number) {
  const start = window.scrollY;
  const distance = targetY - start;

  // Scale duration with distance: ~0.6ms/px, clamped to 500–900ms
  const duration = Math.min(Math.max(Math.abs(distance) * 0.6, 500), 900);

  let startTime: number | null = null;

  function step(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    window.scrollTo({ top: start + distance * easeInOutCubic(progress), behavior: 'instant' });
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

export function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  animateScroll(el.getBoundingClientRect().top + window.scrollY);
}

export function smoothScrollToTop() {
  animateScroll(0);
}
