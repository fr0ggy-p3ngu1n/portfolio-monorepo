import { motion } from 'framer-motion';
import CardMaker from '../playground/CardMaker';
import ActivityGrid from '../playground/ActivityGrid';
import LedPanel from '../playground/LedPanel';

// Small live demos running on the same stack as the rest of the site
export default function Playground() {
  return (
    <section id="playground" aria-labelledby="playground-heading" className="bg-bg-surface py-20">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          id="playground-heading"
          className="text-3xl font-bold text-tx-primary mb-3 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          Playground
        </motion.h2>
        <motion.div
          className="h-px w-12 bg-pink-500 mx-auto mb-4 rounded-full"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <p className="text-center text-tx-secondary mb-12">Small live demos, running on the same stack as this site.</p>
        <div className="grid gap-6">
          <CardMaker />
          <LedPanel />
          <ActivityGrid />
        </div>
      </div>
    </section>
  );
}
