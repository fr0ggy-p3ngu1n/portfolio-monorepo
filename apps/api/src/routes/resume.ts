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
      'Cache-Control': 'public, max-age=604800',  // 7 days; replaced via admin upload
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

  // GET /api/resume is cached for 7 days (Cache-Control below) with no other
  // invalidation path — without this, a freshly uploaded resume wouldn't
  // actually be visible to anyone (including this same admin dashboard's
  // "View current resume" link) until the old cache entry expired on its own.
  const getUrl = new URL(c.req.url);
  const cache = caches.default;
  await cache.delete(new Request(getUrl, { method: 'GET' }));

  return c.json({ ok: true });
});

export default app;
