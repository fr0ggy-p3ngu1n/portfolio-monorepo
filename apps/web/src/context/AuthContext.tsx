import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getToken, setToken, removeToken, isTokenValid } from '../lib/token';
import { api } from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isTokenValid());

  const login = useCallback(async (password: string) => {
    const { token } = await api.post<{ token: string }>('/api/auth/login', {
      password,
    });
    setToken(token);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// Re-export for convenience
export { getToken };
