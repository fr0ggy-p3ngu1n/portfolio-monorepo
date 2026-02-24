import { cors as honoCors } from 'hono/cors';

// Lock origins to your production domain after deploying.
// Add it to this array: 'https://yourdomain.com'
export const cors = honoCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://portfolio-web-7v7.pages.dev',
    'https://matthewsullivan.dev',
    'https://www.matthewsullivan.dev',
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
});
