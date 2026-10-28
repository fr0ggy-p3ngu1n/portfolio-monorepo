import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

type Role = {
  title: string;
  bullets: string[];
};

type Job = {
  company: string;
  location: string;
  period: string;
  url?: string;
  roles: Role[];
};

const JOBS: Job[] = [
  {
    company: 'EHMA.ai',
    location: 'Tempe, AZ',
    period: 'January 2026 – Present',
    url: 'https://www.linkedin.com/company/ehma-ai/posts/?feedView=all',
    roles: [
      {
        title: 'Full-Stack Developer',
        bullets: [
          'Took the backend from 393 tests to 3,646 (an 828% increase) while still shipping features.',
          'Cut median API response time from 18 seconds to 316ms, and polygon queries from 33 seconds to 279ms (over 100× faster).',
          'Moved 556K leads and 1,550 users from MongoDB Atlas to Azure Cosmos DB vCore with no downtime.',
          'Set up CI/CD across four repos (backend, frontend, mobile and the HR portal), with checks that block a merge until they pass.',
          'Built an automated TestFlight pipeline from scratch and used it to ship iOS releases 1.9.3 through 1.9.5.',
          'Led an overhaul of how we store personal data: envelope encryption with Azure Key Vault (AES-256 / RSA-2048), and no sensitive data left in plaintext.',
          'Built monitoring and alerting from the ground up, covering 3 Azure Function Apps and reporting into 6 Slack channels.',
          'Built a persistent Claude Code memory system: 75 files and about 5,500 lines of what the team knows about the codebase.',
        ],
      },
    ],
  },
  {
    company: 'Ciena',
    location: 'Gilbert, AZ',
    period: 'January 2023 – September 2025',
    url: 'https://www.ciena.com',
    roles: [
      {
        title: 'Embedded Software Engineer I',
        bullets: [
          'Kept the Tibit Salesforce implementation running and supported through the early stages of the acquisition.',
          'Gave presentations on how the Tibit Salesforce org was designed, and why.',
          'Helped merge the Tibit Salesforce instances into Ciena\'s.',
          'Led knowledge-transfer sessions on the product branding stations.',
          'Wrote the technical documentation for the branding station\'s tech stack.',
          'Helped deploy manufacturing stations at Ciena offices remotely.',
        ],
      },
      {
        title: 'SQA Developer',
        bullets: [
          'Wrote test plans laying out how products and features would be tested.',
          'Led reviews of test plans for new features.',
          'Helped move test execution tracking from JIRA to TestRail.',
          'Maintained TestRail reporting across multiple test environments.',
          'Tracked, tested and closed bugs in JIRA.',
          'Tested traffic packet distribution, loss prevention and load balancing at the feature level.',
          'Ran install, upgrade and downgrade testing for all five Tibit/Ciena software products.',
        ],
      },
    ],
  },
  {
    company: 'Tibit Communications',
    location: 'Gilbert, AZ',
    period: 'October 2021 – January 2023',
    url: 'https://www.ciena.com/products/interconnects/tibit-technologies',
    roles: [
      {
        title: 'Manufacturing Software Engineer',
        bullets: [
          'Led Salesforce development and administration, and built custom Lightning components for product tracking and customer fulfillment.',
          'Wrote SOQL and Python scripts that pulled Salesforce data into manufacturing applications.',
          'Built and deployed integrations between Salesforce and several Tibit software suites.',
          'Built and maintained the branding station for Tibit MicroPlug OLTs and ONUs, talking to devices over UART and I2C through a 16-port board.',
          'Programmed FPGAs for MicroPlug units.',
          'Rewrote the station from C to Python and added 16-port support, increasing throughput 16×.',
          'Helped ship thousands of OLTs and ONUs to customers around the world.',
        ],
      },
    ],
  },
];

export default function Experience() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 0.85', 'end 0.5'],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="experience" className="py-20 bg-bg-base">
      <div className="max-w-4xl mx-auto px-6">
        <motion.h2
          className="text-3xl font-bold text-tx-primary mb-3 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          Work Experience
        </motion.h2>
        <motion.div
          className="h-px w-12 bg-pink-500 mx-auto mb-16 rounded-full"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        <div ref={timelineRef} className="relative">
          {/* Static track */}
          <div className="absolute left-0 top-2 bottom-2 w-px bg-bd-primary hidden md:block" />

          {/* Scroll-driven fill — fills as you scroll through the section */}
          <motion.div
            className="absolute left-0 top-2 bottom-2 w-px bg-pink-500 hidden md:block origin-top"
            style={{ scaleY }}
          />

          <div className="space-y-14">
            {JOBS.map((job, jobIndex) => (
              <motion.div
                key={job.company + job.period}
                className="md:pl-10 relative"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.6,
                  delay: jobIndex * 0.08,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
              >
                {/* Company header */}
                <div className="mb-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-xl font-bold text-tx-primary">
                      {job.url ? (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-tx-accent transition-colors"
                        >
                          {job.company} ↗
                        </a>
                      ) : (
                        job.company
                      )}
                    </h3>
                    <span className="text-tx-muted text-sm">{job.location}</span>
                  </div>
                  <p className="text-sm text-tx-accent font-medium mt-0.5">{job.period}</p>
                </div>

                {/* Roles */}
                <div className="space-y-6">
                  {job.roles.map((role, roleIndex) => (
                    <motion.div
                      key={role.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{
                        duration: 0.5,
                        delay: jobIndex * 0.08 + roleIndex * 0.06,
                      }}
                    >
                      <h4 className="font-semibold text-tx-primary mb-3">{role.title}</h4>
                      {role.bullets.length > 0 && (
                        <ul className="space-y-2.5 border-l border-bd-primary pl-4">
                          {role.bullets.map((b, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-tx-secondary leading-relaxed">
                              <span className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full bg-pink-700" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
