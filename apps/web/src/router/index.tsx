import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import Login from '../pages/admin/Login';
import Dashboard from '../pages/admin/Dashboard';
import ProjectForm from '../pages/admin/ProjectForm';
import AdminLayout from '../pages/admin/index';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/admin/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'projects/new', element: <ProjectForm /> },
      { path: 'projects/:id/edit', element: <ProjectForm /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
