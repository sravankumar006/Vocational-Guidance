import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { ParentLayout } from '@/layouts/ParentLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

import { HomePage } from '@/pages/HomePage';
import { StudentHome } from '@/pages/student/StudentHome';
import { ParentHome } from '@/pages/parent/ParentHome';
import { AdminHome } from '@/pages/admin/AdminHome';

/**
 * Centralized application route definitions.
 * Guards and role-based checks can be mounted onto these layout branches in future bricks.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  {
    path: '/student',
    element: <StudentLayout />,
    children: [
      {
        index: true,
        element: <StudentHome />,
      },
      // Future student feature sub-routes will be appended here
    ],
  },
  {
    path: '/parent',
    element: <ParentLayout />,
    children: [
      {
        index: true,
        element: <ParentHome />,
      },
      // Future parent feature sub-routes will be appended here
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminHome />,
      },
      // Future admin feature sub-routes will be appended here
    ],
  },
]);
