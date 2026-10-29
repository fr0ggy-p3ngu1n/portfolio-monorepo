import { Hono } from 'hono';
import type { Bindings } from '../index';

// Live numbers for the homepage "This site, right now" card. Everything here
// is measured or read on this request: which Cloudflare data centre answered,
// how long a real D1 query took, which commit is deployed, and the latest
// GitHub Actions runs for this repo.

const app = new Hono<{ Bindings: Bindings }>();

const REPO = 'fr0ggy-p3ngu1n/portfolio-monorepo';
const RUNS_URL = `https://api.github.com/repos/${REPO}/actions/runs?branch=main&per_page=20`;
const RUNS_CACHE_SECONDS = 300;

type Run = { name: string; status: string; conclusion: string | null; head_sha: string; updated_at: string; html_url: string };

// GitHub allows 60 unauthenticated requests an hour per IP, so the runs list
// is cached at the edge for a few minutes.
async function latestRuns(ctx: ExecutionContext): Promise<Run[]> {
  const cache = caches.default;
  const key = new Request(RUNS_URL);
  let res = await cache.match(key);
  if (!res) {
    const gh = await fetch(RUNS_URL, {
      headers: { 'User-Agent': 'matthewsullivan.dev', Accept: 'application/vnd.github+json' },
    });
    if (!gh.ok) return [];
    res = new Response(gh.body, gh);
    res.headers.set('Cache-Control', `public, max-age=${RUNS_CACHE_SECONDS}`);
    ctx.waitUntil(cache.put(key, res.clone()));
  }
  const { workflow_runs = [] } = (await res.json()) as { workflow_runs?: Run[] };
  // Newest run of each workflow
  const seen = new Set<string>();
  return workflow_runs.filter((r) => !seen.has(r.name) && seen.add(r.name));
}

app.get('/', async (c) => {
  const started = Date.now();
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const { success } = await c.env.STATUS_LIMIT.limit({ key: ip });
  if (!success) return c.json({ error: 'Slow down' }, 429);

  // GitHub lookup runs alongside, so it doesn't count toward the API's own time
  const runsPromise = latestRuns(c.executionCtx).catch(() => [] as Run[]);

  // Workers clocks only advance across I/O, which is exactly what this times
  const t0 = Date.now();
  const row = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM Project WHERE published = 1').first<{ n: number }>();
  const d1Ms = Date.now() - t0;
  const workerMs = Date.now() - started;

  const runs = await runsPromise;
  const cf = (c.req.raw as Request & { cf?: { colo?: string } }).cf;

  return c.json(
    {
      colo: cf?.colo ?? null,
      d1Ms,
      projects: row?.n ?? null,
      workerMs,
      api: { sha: c.env.GIT_SHA ?? null, deployedAt: c.env.DEPLOYED_AT ?? null },
      ci: runs.map((r) => ({
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        sha: r.head_sha.slice(0, 7),
        at: r.updated_at,
        url: r.html_url,
      })),
    },
    200,
    { 'Cache-Control': 'no-store' },
  );
});

export default app;
