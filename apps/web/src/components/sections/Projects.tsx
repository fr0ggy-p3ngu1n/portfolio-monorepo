import { useState, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../../lib/api';
import type { Project } from '@portfolio/shared';
import { useTilt } from '../../hooks/useTilt';

const LOTR_QUOTES = [
  '"Not all those who wander are lost." — J.R.R. Tolkien',
  '"Even the smallest person can change the course of the future." — Galadriel',
  '"I will take the Ring, though I do not know the way." — Frodo Baggins',
  '"All we have to decide is what to do with the time that is given us." — Gandalf',
  '"There is some good in this world, and it\'s worth fighting for." — Samwise Gamgee',
  '"A wizard is never late, nor is he early. He arrives precisely when he means to." — Gandalf',
];

const ProjectCard = memo(function ProjectCard({ project, index, onSelect, onWizard }: {
  project: Project;
  index: number;
  onSelect: (p: Project) => void;
  onWizard: (e: React.MouseEvent) => void;
}) {
  const { ref, onMouseMove, onMouseLeave } = useTilt();
  return (
    <motion.article
      ref={ref}
      key={project.id}
      onClick={() => onSelect(project)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      whileHover={{
        boxShadow: '0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px rgba(217,119,6,0.55), 0 0 64px rgba(217,119,6,0.2)',
        transition: { boxShadow: { duration: 0 } },
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="glass rounded-xl overflow-hidden cursor-pointer relative flex flex-col"
    >
      {/* Easter Egg J */}
      {index === 0 && (
        <button
          onClick={onWizard}
          className="absolute top-2 right-2 text-sm opacity-[0.05] hover:opacity-[0.1] transition-opacity z-10 cursor-pointer bg-transparent border-none leading-none"
          aria-label="A wizard is never late"
          tabIndex={-1}
        >
          🧙
        </button>
      )}

      {project.imageUrl && (
        <img
          src={project.imageUrl}
          alt={project.title}
          loading="lazy"
          decoding="async"
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="font-semibold text-tx-primary">{project.title}</h3>
          {project.featured && (
            <span className="shrink-0 text-xs glass-amber text-amber-300 px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
        </div>
        <p className="text-sm text-tx-secondary mb-4 line-clamp-3">
          {project.description}
        </p>
        {Array.isArray(project.tags) && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="tag text-xs text-tx-primary px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 mt-auto">
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-tx-amber hover:underline"
            >
              Live site ↗
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-tx-secondary hover:underline"
            >
              GitHub ↗
            </a>
          )}
          <span className="text-xs text-tx-muted ml-auto">Click to expand</span>
        </div>
      </div>
    </motion.article>
  );
});

export default function Projects() {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Project | null>(null);

  // Easter Egg J — invisible wizard modal
  const [wizardOpen, setWizardOpen]   = useState(false);
  const [wizardQuote, setWizardQuote] = useState('');

  const openWizard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWizardQuote(LOTR_QUOTES[Math.floor(Math.random() * LOTR_QUOTES.length)]);
    setWizardOpen(true);
  };

  useEffect(() => {
    api
      .get<Project[]>('/api/projects')
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="projects" className="py-20 bg-bg-surface">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          className="text-3xl font-bold text-tx-primary mb-3 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          Projects
        </motion.h2>
        <motion.div
          className="h-px w-12 bg-amber-500 mx-auto mb-12 rounded-full"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-white/5 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-4/5" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-5 w-14 bg-white/5 rounded-full" />
                    <div className="h-5 w-16 bg-white/5 rounded-full" />
                    <div className="h-5 w-12 bg-white/5 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-center text-tx-muted">No projects yet — check back soon!</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                onSelect={setSelected}
                onWizard={openWizard}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[9980] flex items-center justify-center p-4 bg-black/70 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="glass-modal rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {selected.imageUrl && (
                <img
                  src={selected.imageUrl}
                  alt={selected.title}
                  className="w-full h-52 object-cover rounded-t-2xl"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-xl font-bold text-tx-primary">{selected.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    {selected.featured && (
                      <span className="text-xs glass-amber text-amber-300 px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                    <button
                      onClick={() => setSelected(null)}
                      className="text-tx-muted hover:text-tx-primary transition-colors text-xl leading-none cursor-pointer"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <p className="text-sm text-tx-secondary leading-relaxed mb-5">
                  {selected.description}
                </p>

                {Array.isArray(selected.tags) && selected.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {selected.tags.map((tag) => (
                      <span
                        key={tag}
                        className="tag text-xs text-tx-primary px-2.5 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  {selected.url && (
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-amber px-4 py-2 text-amber-200 text-sm font-semibold rounded-xl hover:text-amber-100 transition-colors"
                    >
                      Live site ↗
                    </a>
                  )}
                  {selected.repoUrl && (
                    <a
                      href={selected.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass px-4 py-2 text-tx-secondary text-sm font-medium rounded-xl hover:text-white transition-colors"
                    >
                      GitHub ↗
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Easter Egg J — LOTR quote modal */}
      <AnimatePresence>
        {wizardOpen && (
          <motion.div
            className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/70 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWizardOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-modal rounded-2xl p-8 max-w-sm mx-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-4 select-none">🧙</div>
              <p className="font-serif text-tx-amber text-lg leading-relaxed">
                {wizardQuote}
              </p>
              <button
                onClick={() => setWizardOpen(false)}
                className="mt-6 text-xs text-tx-muted hover:text-tx-secondary transition-colors cursor-pointer"
              >
                — Close —
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
