import { Hono } from 'hono';
import { adminAuth } from '../middleware/adminAuth';
import type { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

// ─── Public: serve resume from R2 ────────────────────────────────────────────

app.get('/', async (c) => {
  const obj = await c.env.ASSETS.get('resume.pdf');
  if (!obj) return c.json({ error: 'Resume not found' }, 404);

  return new Response(obj.body as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Matthew Sullivan - Resume.pdf"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

// ─── Admin: upload new resume ─────────────────────────────────────────────────

app.put('/', adminAuth(), async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('resume') as File | null;

  if (!file) return c.json({ error: 'No file provided' }, 400);
  if (file.type !== 'application/pdf') return c.json({ error: 'File must be a PDF' }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ error: 'File too large (max 10 MB)' }, 400);

  await c.env.ASSETS.put('resume.pdf', file.stream(), {
    httpMetadata: { contentType: 'application/pdf' },
  });

  return c.json({ ok: true });
});

export default app;
