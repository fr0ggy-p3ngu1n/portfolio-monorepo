import { useRef, useState, memo } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useTilt } from '../../hooks/useTilt';

const SKILLS: { category: string; icon: string; description: string; items: string[] }[] = [
  {
    category: 'Languages',
    icon: '💻',
    description: 'C and C++ from embedded work, Python and TypeScript for most of what I\'ve built since, Swift for iOS, and APEX and SOQL for Salesforce.',
    items: ['Python', 'JavaScript', 'TypeScript', 'C / C++', 'Java', 'Swift / SwiftUI', 'APEX', 'SQL / SOQL'],
  },
  {
    category: 'Web & Frameworks',
    icon: '🌐',
    description: 'React on the front end, plus Angular from the Tibit network statistics tool. Hono, Django and ASP.NET on the back end. I use TypeScript wherever it fits.',
    items: ['React', 'Hono', 'Angular', 'Tailwind CSS', 'Framer Motion', 'Django', '.NET / ASP.NET', 'HTML / CSS'],
  },
  {
    category: 'Databases',
    icon: '🗄️',
    description: 'SQL and document databases alike: MongoDB and Azure Cosmos DB at EHMA.ai, Cloudflare D1 for my own projects, SOQL for Salesforce, and Pandas and NumPy for working with data in Python.',
    items: ['SQL', 'SOQL', 'MongoDB', 'Azure Cosmos DB', 'D1 (SQLite)', 'Prisma', 'Pandas', 'NumPy'],
  },
  {
    category: 'Cloud & DevOps',
    icon: '☁️',
    description: 'My production work at EHMA.ai runs on Azure: Functions, Cosmos DB, Key Vault and API Management. My own projects run on Cloudflare Workers and Pages. I\'ve set up CI/CD in GitHub Actions and Bitbucket Pipelines, including an automated TestFlight release.',
    items: ['Microsoft Azure', 'Azure Functions', 'Azure Cosmos DB', 'Azure Key Vault', 'Azure API Management', 'Cloudflare Workers', 'Cloudflare Pages', 'AWS', 'CI/CD Pipelines', 'Git / GitHub / GitLab', 'Salesforce', 'JIRA', 'Ansible', 'pnpm'],
  },
  {
    category: 'Hardware & Embedded',
    icon: '🔧',
    description: 'At Tibit I wrote embedded software on Linux, programmed FPGAs, and talked to hardware over UART and I2C, including a 16-port board used in production manufacturing. I\'ve also worked with real-time operating systems.',
    items: ['FPGA', 'UART', 'I2C', 'RTOS', 'Embedded Linux', 'Wireshark'],
  },
  {
    category: 'Testing & QA',
    icon: '✅',
    description: 'I worked as an SQA developer, writing test plans, leading their reviews, and running feature, integration, upgrade and regression testing. I also helped move the team from JIRA tracking to TestRail.',
    items: ['PyTest', 'Playwright', 'Vitest', 'JUnit', 'Postman', 'TestRail', 'Gradle', 'Bitbucket'],
  },
  {
    category: 'AI & Developer Tools',
    icon: '🤖',
    description: 'I use AI tools every day: GitHub Copilot for completions and refactors in the editor, and Claude for architecture decisions, debugging hard problems and building features faster.',
    items: ['GitHub Copilot', 'Claude (Anthropic)', 'ChatGPT', 'Prompt Engineering', 'AI-Assisted Development'],
  },
  {
    category: 'Collaboration & Process',
    icon: '🤝',
    description: 'I\'ve worked at a startup and inside a larger company after an acquisition. I present technical work to mixed audiences, write documentation, and have run knowledge-transfer sessions for engineering and other teams.',
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
            className="glass-modal absolute -top-24 left-1/2 -translate-x-1/2 text-tx-accent text-xs px-4 py-3 rounded-xl z-20 pointer-events-none shadow-2xl flex flex-col items-center gap-2 whitespace-nowrap"
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
        boxShadow: '0 20px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px rgba(236,72,153,0.55), 0 0 64px rgba(236,72,153,0.2)',
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
      <div className="flex flex-wrap gap-1.5">
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
          className="h-px w-12 bg-pink-500 mx-auto mb-12 rounded-full"
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
