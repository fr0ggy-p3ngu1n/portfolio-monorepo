import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verifyPassword, createToken } from '../lib/auth';
import type { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { password } = c.req.valid('json');

  const isValid = await verifyPassword(password, c.env.ADMIN_PASSWORD_HASH);
  if (!isValid) {
    return c.json({ error: 'Invalid password' }, 401);
  }

  const token = await createToken(c.env.JWT_SECRET);
  return c.json({ token });
});

export default app;
