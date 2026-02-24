import { jwt } from 'hono/jwt';
import type { MiddlewareHandler } from 'hono';
import type { Bindings } from '../index';

/**
 * Factory that returns Hono's built-in JWT middleware bound to the Worker's
 * JWT_SECRET env binding. Must be called as a function: adminAuth()
 */
export const adminAuth = (): MiddlewareHandler<{ Bindings: Bindings }> => {
  return async (c, next) => {
    const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' });
    return jwtMiddleware(c, next);
  };
};
