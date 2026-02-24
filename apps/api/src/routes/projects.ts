import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateProjectSchema, UpdateProjectSchema } from '@portfolio/shared';
import { createPrismaClient } from '../lib/prisma';
import { adminAuth } from '../middleware/adminAuth';
import type { Bindings } from '../index';

const app = new Hono<{ Bindings: Bindings }>();

// Serialise tags from DB string → string[]
function parse(project: { tags: string; [key: string]: unknown }) {
  return { ...project, tags: JSON.parse(project.tags) as string[] };
}

// ─── Public routes ────────────────────────────────────────────────────────────

app.get('/', async (c) => {
  const db = createPrismaClient(c.env.DB);
  const projects = await db.project.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
  });
  return c.json(projects.map(parse));
});

app.get('/:id', async (c) => {
  const db = createPrismaClient(c.env.DB);
  const project = await db.project.findUnique({
    where: { id: c.req.param('id') },
  });
  if (!project) return c.json({ error: 'Not found' }, 404);
  return c.json(parse(project));
});

// ─── Protected routes (JWT required) ─────────────────────────────────────────

app.post('/', adminAuth(), zValidator('json', CreateProjectSchema), async (c) => {
  const data = c.req.valid('json');
  const db = createPrismaClient(c.env.DB);
  const project = await db.project.create({
    data: { ...data, tags: JSON.stringify(data.tags) },
  });
  return c.json(parse(project), 201);
});

app.put('/:id', adminAuth(), zValidator('json', UpdateProjectSchema), async (c) => {
  const data = c.req.valid('json');
  const db = createPrismaClient(c.env.DB);
  try {
    const { tags, ...rest } = data;
    const update = tags !== undefined ? { ...rest, tags: JSON.stringify(tags) } : rest;
    const project = await db.project.update({
      where: { id: c.req.param('id') },
      data: update,
    });
    return c.json(parse(project));
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
});

app.delete('/:id', adminAuth(), async (c) => {
  const db = createPrismaClient(c.env.DB);
  try {
    await db.project.delete({ where: { id: c.req.param('id') } });
    return c.json({ ok: true });
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
});

export default app;
