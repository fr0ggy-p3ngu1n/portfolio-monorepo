import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { CreateContactSchema } from '@portfolio/shared';

type Status = 'idle' | 'loading' | 'success' | 'error';

function LinkedInCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="glass rounded-xl p-6 flex flex-col gap-5 h-fit"
    >
      {/* Avatar + identity */}
      <div className="flex items-center gap-4">
        <img
          src="/avatar.jpg"
          alt="Matthew Sullivan"
          loading="lazy"
          decoding="async"
          className="w-14 h-14 rounded-full object-cover object-top shrink-0 border-2 border-amber-500/30"
        />
        <div>
          <p className="font-bold text-tx-primary">Matthew Sullivan</p>
          <p className="text-tx-secondary text-sm leading-snug">Full-Stack Software Engineer</p>
          <p className="text-tx-muted text-xs mt-0.5">Building at EHMA.ai</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-bd-primary" />

      {/* Blurb */}
      <p className="text-tx-secondary text-sm leading-relaxed">
        Want a quick connection? Find me on LinkedIn — I&apos;m always open to new
        conversations, collaborations, and opportunities.
      </p>

      {/* CTA */}
      <motion.a
        href="https://www.linkedin.com/in/mlsulli"
        target="_blank"
        rel="noopener noreferrer"
        className="glass-amber text-center px-4 py-2.5 rounded-xl text-tx-amber font-semibold transition-colors flex items-center justify-center gap-2"
        whileHover={{
          boxShadow: '0 0 20px rgba(217,119,6,0.4)',
          transition: { duration: 0 },
        }}
        whileTap={{ scale: 0.97 }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        Connect on LinkedIn
      </motion.a>
    </motion.div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('Something went wrong — please try again.');

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = CreateContactSchema.safeParse(form);
    if (!result.success) {
      const first = result.error.issues[0];
      setErrorMsg(first?.message ?? 'Please check your inputs and try again.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      await api.post('/api/contact', result.data);
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong — please try again.');
      setStatus('error');
    }
  };

  const inputClass =
    'w-full px-3 py-2 glass rounded-lg text-base md:text-sm text-tx-primary placeholder:text-tx-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all';

  return (
    <section id="contact" className="py-20 bg-bg-base">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-tx-primary mb-3 text-center">
            Get in touch
          </h2>
          <motion.div
            className="h-px w-12 bg-amber-500 mx-auto mb-4 rounded-full"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <p className="text-tx-secondary text-center mb-10">
            Have a project in mind or just want to say hello? I&apos;d love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[5fr_8fr] gap-6 items-start">
          {/* LinkedIn card */}
          <LinkedInCard />

          {/* Contact form */}
          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-xl p-8 text-center self-center"
            >
              <p className="text-green-400 font-medium text-lg">Message sent!</p>
              <p className="text-green-500/80 mt-1">I&apos;ll get back to you soon.</p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass rounded-xl p-6 space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-tx-secondary mb-1">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-tx-secondary mb-1">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-tx-secondary mb-1">Message</label>
                <textarea
                  id="contact-message"
                  value={form.message}
                  onChange={set('message')}
                  rows={5}
                  minLength={10}
                  className={inputClass}
                  required
                />
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-sm">{errorMsg}</p>
              )}
              <motion.button
                type="submit"
                disabled={status === 'loading'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-amber w-full py-2.5 text-amber-200 font-semibold rounded-xl hover:text-amber-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sending…
                  </>
                ) : 'Send message'}
              </motion.button>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
}
