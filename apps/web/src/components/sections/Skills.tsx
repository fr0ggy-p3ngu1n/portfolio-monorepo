import { useRef, useState, memo } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useTilt } from '../../hooks/useTilt';

const SKILLS: { category: string; icon: string; description: string; items: string[] }[] = [
  {
    category: 'Languages',
    icon: '💻',
    description: 'My foundation spans systems programming with C/C++, rapid scripting with Python, and full-stack web development with JavaScript and TypeScript. APEX rounds out the set for Salesforce platform work.',
    items: ['Python', 'JavaScript', 'TypeScript', 'C / C++', 'Java', 'Swift / SwiftUI', 'APEX', 'SQL / SOQL'],
  },
  {
    category: 'Web & Frameworks',
    icon: '🌐',
    description: 'Full-stack web experience from React SPAs and Angular enterprise apps on the frontend, to Hono and ASP.NET on the backend. I lean toward TypeScript-first tooling and stay current with the modern ecosystem.',
    items: ['React', 'Hono', 'Angular', 'Tailwind CSS', 'Framer Motion', 'Django', '.NET / ASP.NET', 'HTML / CSS'],
  },
  {
    category: 'Databases',
    icon: '🗄️',
    description: 'Comfortable with relational and document databases alike. Day-to-day work spans SQL, SOQL for Salesforce data retrieval, Cloudflare D1 for edge-native storage, and Python data tooling with Pandas and NumPy.',
    items: ['SQL', 'SOQL', 'MongoDB', 'Azure Cosmos DB', 'D1 (SQLite)', 'Prisma', 'Pandas', 'NumPy'],
  },
  {
    category: 'Cloud & DevOps',
    icon: '☁️',
    description: 'Deep Azure production experience across Functions, Cosmos DB, Key Vault, and API Management, plus Cloudflare\'s edge platform. CI/CD pipelines across multiple repos — GitHub Actions, Bitbucket Pipelines, and TestFlight automation.',
    items: ['Microsoft Azure', 'Azure Functions', 'Azure Cosmos DB', 'Azure Key Vault', 'Azure API Management', 'Cloudflare Workers', 'Cloudflare Pages', 'AWS', 'CI/CD Pipelines', 'Git / GitHub / GitLab', 'Salesforce', 'JIRA', 'Ansible', 'pnpm'],
  },
  {
    category: 'Hardware & Embedded',
    icon: '🔧',
    description: 'Hands-on experience writing embedded software in Linux environments, programming FPGAs, and communicating with hardware over UART and I2C. Worked with real-time operating systems and custom 16-port boards in production manufacturing.',
    items: ['FPGA', 'UART', 'I2C', 'RTOS', 'Embedded Linux', 'Wireshark'],
  },
  {
    category: 'Testing & QA',
    icon: '✅',
    description: 'Full QA lifecycle experience — from writing test plans and leading reviews, to hands-on feature, integration, upgrade, and regression testing. Led a team\'s transition from ad-hoc tracking to TestRail and maintained reporting across multiple environments.',
    items: ['PyTest', 'Playwright', 'Vitest', 'JUnit', 'Postman', 'TestRail', 'Gradle', 'Bitbucket'],
  },
  {
    category: 'AI & Developer Tools',
    icon: '🤖',
    description: 'AI is a core part of my daily workflow — not a shortcut, but a force multiplier. I use GitHub Copilot for in-editor completions and refactoring, and Claude for architecture decisions, debugging complex problems, and accelerating full-stack builds. I actively prompt-engineer to get precise, production-quality output.',
    items: ['GitHub Copilot', 'Claude (Anthropic)', 'ChatGPT', 'Prompt Engineering', 'AI-Assisted Development'],
  },
  {
    category: 'Collaboration & Process',
    icon: '🤝',
    description: 'Effective in both fast-moving startups and structured larger teams. Experienced presenting technical concepts to mixed audiences, writing documentation, and leading knowledge-transfer sessions across engineering and cross-functional groups.',
    items: ['Agile / Scrum', 'Technical Writing', 'Test Planning', 'Code Review', 'Knowledge Transfer', 'Presentations'],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const card = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] as const } },
};

// Easter Egg H — hover "Python" 5× fast → "My Precious…"
function PythonItem() {
  const [showPrecious, setShowPrecious] = useState(false);

  const handleClick = () => {
    setShowPrecious(true);
    setTimeout(() => setShowPrecious(false), 3000);
  };

  return (
    <span className="relative">
      <motion.span
        className="tag text-xs text-tx-primary px-2.5 py-1 rounded-full cursor-pointer inline-block"
        onClick={handleClick}
        whileTap={{ scale: 0.95 }}
      >
        Python
      </motion.span>
      <AnimatePresence>
        {showPrecious && (
          <motion.div
            className="glass-modal absolute -top-24 left-1/2 -translate-x-1/2 text-tx-amber text-xs px-4 py-3 rounded-xl z-20 pointer-events-none shadow-2xl flex flex-col items-center gap-2 whitespace-nowrap"
            initial={{ opacity: 0, y: 6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.85 }}
          >
            <img
              src="/one-ring.png"
              alt="The One Ring"
              className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(212,160,23,0.7)]"
            />
            <span className="font-serif italic">My Precious…</span>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

const SkillCard = memo(function SkillCard({ category, icon, description, items }: typeof SKILLS[number]) {
  const { ref, onMouseMove, onMouseLeave } = useTilt();
  return (
    <motion.div
      ref={ref}
      variants={card}
      whileHover={{
        boxShadow: '0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px rgba(217,119,6,0.55), 0 0 64px rgba(217,119,6,0.2)',
        transition: { boxShadow: { duration: 0 } },
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="glass rounded-xl p-6 cursor-default flex flex-col gap-4 h-full"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-tx-primary">{category}</h3>
      </div>
      <p className="text-sm text-tx-secondary leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {items.map((item) =>
          item === 'Python' ? (
            <PythonItem key="Python" />
          ) : (
            <span key={item} className="tag text-xs text-tx-primary px-2.5 py-1 rounded-full">
              {item}
            </span>
          ),
        )}
      </div>
    </motion.div>
  );
});

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="skills" className="bg-bg-surface py-20">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          className="text-3xl font-bold text-tx-primary mb-3 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          Skills
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
          variants={container}
          initial="hidden"
          animate={isInView ? 'show' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
        >
          {SKILLS.map((skill) => (
            <SkillCard key={skill.category} {...skill} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
