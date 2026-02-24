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

/** Decodes the JWT payload and checks the `exp` claim without a library. */
export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload)) as { exp?: number };
    return typeof decoded.exp === 'number' &&
      decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
