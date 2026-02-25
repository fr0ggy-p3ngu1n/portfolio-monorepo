import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import { ProtectedRoute } from './ProtectedRoute';

// Admin pages are lazy-loaded — non-admin visitors never download this code
const Login       = lazy(() => import('../pages/admin/Login'));
const Dashboard   = lazy(() => import('../pages/admin/Dashboard'));
const ProjectForm = lazy(() => import('../pages/admin/ProjectForm'));
const AdminLayout = lazy(() => import('../pages/admin/index'));

// Minimal fallback: just a dark screen matching the site background
const AdminFallback = () => <div className="min-h-screen bg-bg-base" />;
const wrap = (el: React.ReactNode) => (
  <Suspense fallback={<AdminFallback />}>{el}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/admin/login',
    element: wrap(<Login />),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        {wrap(<AdminLayout />)}
      </ProtectedRoute>
    ),
    children: [
      { index: true,               element: wrap(<Dashboard />) },
      { path: 'projects/new',      element: wrap(<ProjectForm />) },
      { path: 'projects/:id/edit', element: wrap(<ProjectForm />) },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
