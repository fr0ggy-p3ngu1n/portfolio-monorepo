import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SubmitScoreSchema } from '@portfolio/shared';
import { createPrismaClient } from '../lib/prisma';
import type { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

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
  const { name, score } = c.req.valid('json');
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
