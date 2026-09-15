import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verifyPassword, createToken } from '../lib/auth';
import { createPrismaClient } from '../lib/prisma';
import type { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { password } = c.req.valid('json');
  const db = createPrismaClient(c.env.DB);
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const windowStart = new Date(Date.now() - WINDOW_MS);

  // Opportunistic cleanup — no cron trigger needed, just prune anything
  // outside the window whenever a login attempt happens to come in.
  await db.loginAttempt.deleteMany({ where: { attemptedAt: { lt: windowStart } } });

  const recentAttempts = await db.loginAttempt.count({
    where: { ip, attemptedAt: { gte: windowStart } },
  });
  if (recentAttempts >= MAX_ATTEMPTS) {
    return c.json({ error: 'Too many attempts. Try again in a few minutes.' }, 429);
  }

  const isValid = await verifyPassword(password, c.env.ADMIN_PASSWORD_HASH);
  if (!isValid) {
    await db.loginAttempt.create({ data: { ip } });
    return c.json({ error: 'Invalid password' }, 401);
  }

  // Successful login clears this IP's recent failures.
  await db.loginAttempt.deleteMany({ where: { ip } });

  const token = await createToken(c.env.JWT_SECRET);
  return c.json({ token });
});

export default app;
