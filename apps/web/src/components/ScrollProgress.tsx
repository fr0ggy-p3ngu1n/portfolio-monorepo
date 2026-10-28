import { useScroll, useSpring, motion } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{
        scaleX,
        transformOrigin: 'left',
        background: 'linear-gradient(90deg, #db2777, #ec4899, #db2777)',
      }}
      className="fixed top-0 left-0 right-0 h-[2px] z-[200] pointer-events-none"
    />
  );
}
