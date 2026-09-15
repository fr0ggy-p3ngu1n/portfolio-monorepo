const TOKEN_KEY = 'portfolio_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * atob() only understands standard base64, but JWTs are base64url-encoded
 * (RFC 4648 §5) — `-`/`_` instead of `+`/`/`, no padding. The two happen to
 * coincide often enough that this was going unnoticed, but any claim value
 * whose bytes land on `+`/`/` in standard base64 would throw and silently
 * fail this check. Converting to standard base64 first is the correct fix.
 */
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
}

/** Decodes the JWT payload and checks the `exp` claim without a library. */
export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(base64UrlDecode(payload)) as { exp?: number };
    return typeof decoded.exp === 'number' &&
      decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
