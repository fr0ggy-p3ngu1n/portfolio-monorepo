import { Hono } from 'hono';
import { cors } from './middleware/cors';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import contactRoutes from './routes/contact';
import resumeRoutes      from './routes/resume';
import ogRoutes          from './routes/og';
import leaderboardRoutes from './routes/leaderboard';

export type Bindings = {
  DB: D1Database;
  ASSETS: R2Bucket;
  JWT_SECRET: string;
  ADMIN_PASSWORD_HASH: string;
  RESEND_API_KEY: string;
  CONTACT_EMAIL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors);

app.get('/api/health', (c) => c.json({ ok: true }));

app.route('/api/auth', authRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/contact', contactRoutes);
app.route('/api/resume', resumeRoutes);
app.route('/api/og',          ogRoutes);
app.route('/api/leaderboard', leaderboardRoutes);

export default app;
