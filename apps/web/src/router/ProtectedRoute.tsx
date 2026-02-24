import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isTokenValid } from '../lib/token';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  // Also check token expiry on each navigation
  if (!isAuthenticated || !isTokenValid()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
