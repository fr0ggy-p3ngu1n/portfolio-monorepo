import { Hono } from 'hono';
import type { Bindings } from '../index';

// Live data for the homepage "Shipping activity" card: the GitHub contribution
// calendar plus the latest commits across every public repo committed to in
// the last year (private repos are left out entirely, names included).
//
// Answers are cached at the edge for 5 minutes (browsers for 1), so visitors never reach
// GitHub directly and the card stays current without a site deploy. Reading
// contributions needs a token: GITHUB_TOKEN is a fine-grained token with
// read-only access to public repositories. The web build still bakes a
// fallback snapshot (apps/web/scripts/activity.mjs, same shape) for when this
// route can't reach GitHub.

const LOGIN = 'fr0ggy-p3ngu1n';
// How long the edge cache keeps an answer. Browsers get BROWSER_TTL_SECONDS
// instead, set explicitly: on a cache hit Cloudflare rewrites Cache-Control to
// the zone's Browser Cache TTL (4 hours), which kept the card stale for hours.
const TTL_SECONDS = 300;
const BROWSER_TTL_SECONDS = 60;
// Failures are cached briefly too, so an outage can't turn every request
// into fresh GitHub calls
const ERROR_TTL_SECONDS = 60;
// Each repo is one GitHub request on a cache miss, so cap them. GitHub lists
// repos by commit count this year, busiest first.
const MAX_REPOS = 20;
const COMMIT_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/commit\/[0-9a-f]{40}$/;

const isCorsHeader = (name: string) => name.startsWith('access-control-') || name === 'vary';

type Commit = { repo: string; message: string; sha: string; url: string; date: string };

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const { success } = await c.env.ACTIVITY_LIMIT.limit({ key: ip });
  if (!success) return c.json({ error: 'Slow down' }, 429);

  // One cache entry for everyone: the query string is ignored, so it can't be
  // used to force fresh GitHub calls
  const cacheKey = new Request(new URL('/api/activity', c.req.url).toString(), { method: 'GET' });
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  // Expiry is checked here, not left to the cache: Cloudflare applies its own
  // zone TTLs (hours) to entries, so max-age alone kept serving stale data
  const storedAt = Number(cached?.headers.get('x-stored-at'));
  const maxAge = (cached?.ok ? TTL_SECONDS : ERROR_TTL_SECONDS) * 1000;
  const hit = cached && storedAt && Date.now() - storedAt < maxAge ? cached : undefined;
  // Rebuilt through c.body so the CORS middleware's headers for *this*
  // request's Origin are applied; cached copies shouldn't carry any (see store)
  if (hit) {
    const headers = Object.fromEntries([...hit.headers].filter(([name]) => !isCorsHeader(name)));
    headers['cache-control'] = `public, max-age=${BROWSER_TTL_SECONDS}`;
    delete headers['x-stored-at'];
    return c.body(await hit.text(), hit.status as 200 | 502, headers);
  }

  const token = c.env.GITHUB_TOKEN;
  if (!token) return c.json({ error: 'Activity is not configured' }, 503);

  // Cache without CORS headers: they depend on the requesting Origin, and a
  // copy cached from a request with no Origin would block the site's fetches
  const store = (res: Response) => {
    const copy = new Response(res.clone().body, res);
    for (const name of [...copy.headers.keys()]) {
      if (isCorsHeader(name)) copy.headers.delete(name);
    }
    copy.headers.set('x-stored-at', String(Date.now()));
    c.executionCtx.waitUntil(cache.put(cacheKey, copy));
    res.headers.set('Cache-Control', `public, max-age=${BROWSER_TTL_SECONDS}`);
    return res;
  };

  const fail = (error: string) =>
    store(c.json({ error }, 502, { 'Cache-Control': `public, max-age=${ERROR_TTL_SECONDS}` }));

  const gh = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'matthewsullivan.dev',
        Accept: 'application/vnd.github+json',
        ...init.headers,
      },
    });
    if (!res.ok) throw new Error(`${path}: ${res.status}`);
    return res.json() as Promise<T>;
  };

  try {
    const { data, errors } = await gh<{
      data: { user: { contributionsCollection: {
        contributionCalendar: { totalContributions: number; weeks: { contributionDays: { date: string; contributionCount: number }[] }[] };
        commitContributionsByRepository: { repository: { nameWithOwner: string; isPrivate: boolean } }[];
      } } };
      errors?: unknown;
    }>('/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: `query($login: String!) { user(login: $login) { contributionsCollection {
          contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
          commitContributionsByRepository(maxRepositories: 100) { repository { nameWithOwner isPrivate } }
        } } }`,
        variables: { login: LOGIN },
      }),
    });
    if (errors) throw new Error(JSON.stringify(errors));

    const collection = data.user.contributionsCollection;
    const repos = collection.commitContributionsByRepository
      .map((r) => r.repository)
      .filter((r) => !r.isPrivate)
      .map((r) => r.nameWithOwner)
      .slice(0, MAX_REPOS);

    const perRepo = await Promise.all(
      repos.map((repo) =>
        gh<{ sha: string; html_url: string; commit: { message: string; author: { date: string } } }[]>(
          `/repos/${repo}/commits?author=${LOGIN}&per_page=6`,
        )
          .then((commits) => commits.map((cm): Commit => ({
            repo,
            message: cm.commit.message.split('\n')[0].slice(0, 120),
            sha: cm.sha.slice(0, 7),
            url: COMMIT_URL.test(cm.html_url) ? cm.html_url : `https://github.com/${repo}`,
            date: cm.commit.author.date,
          })))
          .catch(() => [] as Commit[]),
      ),
    );
    // Newest first, at most two per repo, so one busy repo doesn't fill the list
    const perRepoCount = new Map<string, number>();
    const recent = perRepo
      .flat()
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((cm) => {
        const n = perRepoCount.get(cm.repo) ?? 0;
        perRepoCount.set(cm.repo, n + 1);
        return n < 2;
      })
      .slice(0, 6);

    const res = c.json(
      {
        generatedAt: new Date().toISOString(),
        total: collection.contributionCalendar.totalContributions,
        // weeks[w][d] = { date, count }, Sunday first, oldest week first
        weeks: collection.contributionCalendar.weeks.map((w) =>
          w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
        ),
        recent,
      },
      200,
      { 'Cache-Control': `public, max-age=${TTL_SECONDS}` },
    );
    return store(res);
  } catch (err) {
    // Only the request path and status reach the log (see gh above), never the token
    console.error('activity:', err instanceof Error ? err.message : 'unknown error');
    return fail('GitHub is unavailable');
  }
});

export default app;
