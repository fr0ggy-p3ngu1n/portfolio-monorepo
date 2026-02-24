import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(secret: string): Promise<string> {
  const payload = {
    sub: 'admin',
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    iat: Math.floor(Date.now() / 1000),
  };
  return sign(payload, secret, 'HS256');
}

export async function verifyToken(token: string, secret: string) {
  return verify(token, secret, 'HS256');
}
