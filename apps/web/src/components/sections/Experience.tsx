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
        title: 'Full-Stack Software Engineer',
        bullets: [
          'Grew backend test coverage from 393 to 3,646 tests (828% increase) while shipping features in parallel.',
          'Reduced API P50 response time from 18,000ms to 316ms and polygon query time from 33s to 279ms (100× improvement).',
          'Zero-downtime migration of 556K leads and 1,550 users from MongoDB Atlas to Azure Cosmos DB vCore.',
          'Built CI/CD gated pipelines across 4 repositories — backend, frontend, mobile, and HR portal.',
          'Shipped iOS v1.9.3, v1.9.4, and v1.9.5 via an automated TestFlight pipeline built from scratch.',
          'Led full PII security overhaul — Azure Key Vault envelope encryption (AES-256/RSA-2048), zero plaintext sensitive data remaining.',
          'Built entire monitoring and alerting system across 3 Azure Function Apps and 6 Slack channels.',
          'Built a persistent Claude Code memory system with 75 files and ~5,500 lines of institutional knowledge.',
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
          'Maintained and supported the TiBiT Salesforce implementation during the initial stages of acquisition.',
          'Delivered presentations on the design philosophy of the TiBiT Salesforce organization.',
          'Assisted with the integration of the TiBiT Salesforce instances into Ciena\'s.',
          'Led transfer-of-knowledge discussions on product branding stations.',
          'Created technical documentation of the branding station tech stack.',
          'Remotely assisted with the deployment of manufacturing stations across Ciena offices.',
        ],
      },
      {
        title: 'SQA Developer',
        bullets: [
          'Created test plans outlining testing strategies for product and feature testing.',
          'Led test plan review discussions on new feature testing strategies.',
          'Assisted with the transition from JIRA test execution tracking to the TestRail management system.',
          'Maintained TestRail reporting across multiple test environments.',
          'Tracked, tested, and closed bugs using JIRA.',
          'Feature-level testing for traffic packet distribution, loss prevention, and load balancing.',
          'Installation, upgrade, and downgrade testing for all TiBiT/Ciena software products (5 total).',
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
          'Led Salesforce development and administration; created custom Lightning components for product tracking and customer fulfilment.',
          'Worked in SOQL and Python to create scripts retrieving data from Salesforce for manufacturing applications.',
          'Developed and deployed systems integrating Salesforce with a variety of TiBiT software suites.',
          'Developed and maintained the branding station for TiBiT MicroPlug OLTs and ONUs using UART and I2C via a 16-port board.',
          'FPGA programming for MicroPlug units.',
          'Increased station throughput 16× by adding support for a 16-port board.',
          'Converted the codebase from C to Python.',
          'Helped ship thousands of OLTs and ONUs to customers across the globe.',
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
          className="h-px w-12 bg-amber-500 mx-auto mb-16 rounded-full"
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
            className="absolute left-0 top-2 bottom-2 w-px bg-amber-500 hidden md:block origin-top"
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
                          className="hover:text-tx-amber transition-colors"
                        >
                          {job.company} ↗
                        </a>
                      ) : (
                        job.company
                      )}
                    </h3>
                    <span className="text-tx-muted text-sm">{job.location}</span>
                  </div>
                  <p className="text-sm text-tx-amber font-medium mt-0.5">{job.period}</p>
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
                              <span className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full bg-amber-700" />
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
