import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateContactSchema } from '@portfolio/shared';
import { createPrismaClient } from '../lib/prisma';
import { createResendClient } from '../lib/resend';
import { adminAuth } from '../middleware/adminAuth';
import type { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

// ─── Public: submit contact form ──────────────────────────────────────────────

app.post('/', zValidator('json', CreateContactSchema), async (c) => {
  const data = c.req.valid('json');
  const db = createPrismaClient(c.env.DB);

  const submission = await db.contactSubmission.create({ data });

  // Fire-and-forget email notification — don't fail the request if Resend errors
  try {
    const resend = createResendClient(c.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: c.env.CONTACT_EMAIL,
      subject: `[matthewsullivan.dev] New message from ${data.name}`,
      text: [
        '─────────────────────────────────',
        ' New contact form submission',
        ' matthewsullivan.dev',
        '─────────────────────────────────',
        '',
        `From:    ${data.name}`,
        `Email:   ${data.email}`,
        `Reply:   ${data.email}`,
        '',
        'Message:',
        data.message,
        '',
        '─────────────────────────────────',
        `Submission ID: ${submission.id}`,
      ].join('\n'),
      replyTo: data.email,
    });
  } catch (err) {
    console.error('Resend email failed:', err);
  }

  return c.json({ ok: true, id: submission.id }, 201);
});

// ─── Protected: admin reads submissions ───────────────────────────────────────

app.get('/', adminAuth(), async (c) => {
  const db = createPrismaClient(c.env.DB);
  const submissions = await db.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return c.json(submissions);
});

app.put('/:id/read', adminAuth(), async (c) => {
  const db = createPrismaClient(c.env.DB);
  try {
    const submission = await db.contactSubmission.update({
      where: { id: c.req.param('id') },
      data: { read: true },
    });
    return c.json(submission);
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
});

export default app;
