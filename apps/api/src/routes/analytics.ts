import { Hono } from 'hono';
import { adminAuth } from '../middleware/adminAuth';
import type { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

const QUERY = `
  query GetAnalytics($accountTag: String!, $since: Time!, $until: Time!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        byDate: rumPageloadEventsAdaptiveGroups(
          limit: 100
          filter: { datetime_geq: $since, datetime_leq: $until }
          orderBy: [date_ASC]
        ) {
          count
          dimensions { date }
        }
        byPath: rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { datetime_geq: $since, datetime_leq: $until }
          orderBy: [count_DESC]
        ) {
          count
          dimensions { requestPath }
        }
        byReferer: rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { datetime_geq: $since, datetime_leq: $until }
          orderBy: [count_DESC]
        ) {
          count
          dimensions { refererHost }
        }
        byCountry: rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: { datetime_geq: $since, datetime_leq: $until }
          orderBy: [count_DESC]
        ) {
          count
          dimensions { countryName }
        }
      }
    }
  }
`;

type GroupRow<D> = { count: number; dimensions: D };

interface AnalyticsResponse {
  data?: {
    viewer: {
      accounts: Array<{
        byDate: GroupRow<{ date: string }>[];
        byPath: GroupRow<{ requestPath: string }>[];
        byReferer: GroupRow<{ refererHost: string }>[];
        byCountry: GroupRow<{ countryName: string }>[];
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

app.get('/', adminAuth(), async (c) => {
  const days = Math.min(Math.max(Number(c.req.query('days')) || 30, 1), 90);
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);

  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        accountTag: c.env.CLOUDFLARE_ACCOUNT_ID,
        since: since.toISOString(),
        until: until.toISOString(),
      },
    }),
  });

  const body = await res.json<AnalyticsResponse>();

  if (!res.ok || body.errors?.length) {
    const message = body.errors?.map((e) => e.message).join('; ') ?? res.statusText;
    return c.json({ error: `Analytics query failed: ${message}` }, 502);
  }

  const account = body.data?.viewer.accounts[0];
  if (!account) {
    return c.json({
      totalPageviews: 0,
      byDate: [],
      topPaths: [],
      topReferers: [],
      topCountries: [],
    });
  }

  const totalPageviews = account.byDate.reduce((sum, row) => sum + row.count, 0);

  return c.json(
    {
      totalPageviews,
      byDate: account.byDate.map((row) => ({ date: row.dimensions.date, count: row.count })),
      topPaths: account.byPath.map((row) => ({ path: row.dimensions.requestPath, count: row.count })),
      topReferers: account.byReferer.map((row) => ({
        referer: row.dimensions.refererHost || '(direct)',
        count: row.count,
      })),
      topCountries: account.byCountry.map((row) => ({
        country: row.dimensions.countryName || 'Unknown',
        count: row.count,
      })),
    },
    200,
    { 'Cache-Control': 'private, max-age=300' }, // 5 min — avoid hammering the GraphQL API on every dashboard load
  );
});

export default app;
