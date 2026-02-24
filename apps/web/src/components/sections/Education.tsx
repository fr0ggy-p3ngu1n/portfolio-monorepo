import { motion } from 'framer-motion';
import { useTilt } from '../../hooks/useTilt';

function AsuLogo() {
  return (
    <img
      src="/asu-logo.svg"
      alt="Arizona State University logo"
      className="w-full h-full object-contain"
    />
  );
}

const HONORS = ['3.8 GPA', 'High Honors', 'Honor Roll'];

export default function Education() {
  const { ref, onMouseMove, onMouseLeave } = useTilt();

  return (
    <section id="education" className="bg-bg-base py-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.h2
          className="text-3xl font-bold text-tx-primary mb-3 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          Education
        </motion.h2>
        <motion.div
          className="h-px w-12 bg-amber-500 mx-auto mb-12 rounded-full"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{
            boxShadow: '0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px rgba(217,119,6,0.55), 0 0 64px rgba(217,119,6,0.2)',
            transition: { boxShadow: { duration: 0 } },
          }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="glass rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-5 cursor-default"
        >
          <div className="shrink-0 w-32 h-20">
            <AsuLogo />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-tx-primary">
              Arizona State University — Polytechnic Campus
            </h3>
            <p className="text-tx-amber font-medium text-sm mt-0.5">
              Bachelor of Science in Software Engineering
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {HONORS.map((h) => (
                <span
                  key={h}
                  className="glass-amber text-xs font-medium px-2.5 py-1 rounded-full text-amber-300"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
