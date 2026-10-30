import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SubmitScoreSchema } from '@portfolio/shared';
import { createPrismaClient } from '../lib/prisma';
import type { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

// ─── Run tickets ──────────────────────────────────────────────────────────────
// The game scores 10 points a second, so a score can't be higher than the time
// since the run started allows. GET /start hands out a signed timestamp the
// game sends back with its score; POST rejects scores the clock can't explain.

const POINTS_PER_SECOND = 10;
const TICKET_MAX_AGE_S  = 2 * 60 * 60;

const hmacKey = (secret: string) =>
  crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'],
  );

async function sign(secret: string, message: string): Promise<string> {
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(message)));
  return btoa(String.fromCharCode(...mac)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function ticketAge(secret: string, ticket: string): Promise<number | null> {
  const [ts, mac] = ticket.split('.');
  const started = Number(ts);
  if (!Number.isInteger(started) || !mac || !/^[\w-]{43}$/.test(mac)) return null;
  // crypto.subtle.verify compares in constant time, unlike comparing strings
  const raw = Uint8Array.from(atob(mac.replace(/-/g, '+').replace(/_/g, '/') + '='), (ch) => ch.charCodeAt(0));
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), raw, new TextEncoder().encode(`ringrunner:${ts}`));
  if (!ok) return null;
  const age = Date.now() / 1000 - started;
  return age >= 0 && age <= TICKET_MAX_AGE_S ? age : null;
}

app.get('/start', async (c) => {
  const ts = Math.floor(Date.now() / 1000).toString();
  const ticket = `${ts}.${await sign(c.env.JWT_SECRET, `ringrunner:${ts}`)}`;
  return c.json({ ticket }, 200, { 'Cache-Control': 'no-store' });
});

// ─── GET / — top 10 entries ───────────────────────────────────────────────────

app.get('/', async (c) => {
  const db = createPrismaClient(c.env.DB);
  const entries = await db.leaderboardEntry.findMany({
    orderBy: { score: 'desc' },
    take:    10,
  });
  return c.json({ entries }, 200, { 'Cache-Control': 'public, max-age=60' });
});

// ─── POST / — submit a score ──────────────────────────────────────────────────

app.post('/', zValidator('json', SubmitScoreSchema), async (c) => {
  const { name, score, ticket } = c.req.valid('json');
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const { success } = await c.env.LEADERBOARD_LIMIT.limit({ key: ip });
  if (!success) return c.json({ error: 'Too many submissions. Try again in a minute.' }, 429);

  // Allow some slack for the ticket request landing after the run began
  const age = await ticketAge(c.env.JWT_SECRET, ticket);
  if (age === null || score > age * POINTS_PER_SECOND * 1.2 + 30) {
    return c.json({ error: 'Score could not be verified' }, 400);
  }

  const db = createPrismaClient(c.env.DB);

  // Fetch current top 10
  const current = await db.leaderboardEntry.findMany({
    orderBy: { score: 'desc' },
    take:    10,
  });

  // Only insert if board has fewer than 10 entries, or score beats the last place
  const qualifies =
    current.length < 10 || score > (current[current.length - 1]?.score ?? 0);

  if (!qualifies) {
    // Return current board without inserting
    return c.json({ entry: null, entries: current }, 200);
  }

  const entry = await db.leaderboardEntry.create({
    data: { name, score },
  });

  // Prune anything that's fallen out of the top 10 — otherwise every
  // qualifying score ever submitted accumulates in the table forever,
  // even though only the top 10 are ever read.
  const toPrune = await db.leaderboardEntry.findMany({
    orderBy: { score: 'desc' },
    skip:    10,
    select:  { id: true },
  });
  if (toPrune.length > 0) {
    await db.leaderboardEntry.deleteMany({
      where: { id: { in: toPrune.map((e) => e.id) } },
    });
  }

  // Re-fetch top 10 after insert + prune
  const entries = await db.leaderboardEntry.findMany({
    orderBy: { score: 'desc' },
    take:    10,
  });

  return c.json({ entry, entries }, 201);
});

export default app;
