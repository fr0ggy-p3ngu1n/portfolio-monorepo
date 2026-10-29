import { Hono } from 'hono';
import type { Bindings } from '../index';

// Live numbers for the homepage "This site, right now" card. Everything here
// is measured or read on this request: which Cloudflare data centre answered,
// how long a real D1 query took, and which commit is deployed. (The CI tile
// asks GitHub from the visitor's browser: unauthenticated GitHub API calls are
// limited per IP, and Cloudflare's shared egress IPs are always over it.)

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const started = Date.now();
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const { success } = await c.env.STATUS_LIMIT.limit({ key: ip });
  if (!success) return c.json({ error: 'Slow down' }, 429);

  // Workers clocks only advance across I/O, which is exactly what this times
  const t0 = Date.now();
  const row = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM Project WHERE published = 1').first<{ n: number }>();
  const d1Ms = Date.now() - t0;
  const workerMs = Date.now() - started;

  const cf = (c.req.raw as Request & { cf?: { colo?: string } }).cf;

  return c.json(
    {
      colo: cf?.colo ?? null,
      d1Ms,
      projects: row?.n ?? null,
      workerMs,
      api: { sha: c.env.GIT_SHA ?? null, deployedAt: c.env.DEPLOYED_AT ?? null },
    },
    200,
    { 'Cache-Control': 'no-store' },
  );
});

export default app;
