import { cors as honoCors } from 'hono/cors';

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  'https://matthewsullivan.dev',
]);

// Pages preview deploys (e.g. https://<branch>.portfolio-web-7v7.pages.dev)
const PREVIEW_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?portfolio-web-7v7\.pages\.dev$/;

export const cors = honoCors({
  origin: (origin) =>
    ALLOWED_ORIGINS.has(origin) || PREVIEW_ORIGIN.test(origin) ? origin : null,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  // Playground card maker shows whether a card came from the edge cache
  exposeHeaders: ['X-Cache'],
});
