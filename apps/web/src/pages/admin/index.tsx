import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold text-gray-900">
            Portfolio
          </Link>
          <Link
            to="/admin"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/projects/new"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            New Project
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
        >
          Log out
        </button>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
