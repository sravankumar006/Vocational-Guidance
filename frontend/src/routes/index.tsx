import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { ParentLayout } from '@/layouts/ParentLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';

import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Student Portal Pages
import { StudentHome } from '@/pages/student/StudentHome';
import { StudentProfile } from '@/pages/student/StudentProfile';
import { StudentCareer } from '@/pages/student/StudentCareer';
import { StudentCareerDetail } from '@/pages/student/StudentCareerDetail';
import { StudentCounselling } from '@/pages/student/StudentCounselling';

// Parent Portal Pages
import { ParentHome } from '@/pages/parent/ParentHome';
import { ParentConcerns } from '@/pages/parent/ParentConcerns';
import { ParentCounselling } from '@/pages/parent/ParentCounselling';

// Admin Portal Pages
import { AdminHome } from '@/pages/admin/AdminHome';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminConcernAnalytics } from '@/pages/admin/AdminConcernAnalytics';
import { AdminSentimentAnalytics } from '@/pages/admin/AdminSentimentAnalytics';
import { AdminData } from '@/pages/admin/AdminData';
import { AdminEscalations } from '@/pages/admin/AdminEscalations';

export const router = createBrowserRouter([
  // Public Landing
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

  // Authentication & Access Denied Layout
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
      },
    ],
  },

  // Student Portal Branch (Protected + Role Guard: student & admin)
  {
    path: '/student',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['student', 'admin']}>
          <StudentLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StudentHome />,
      },
      {
        path: 'profile',
        element: <StudentProfile />,
      },
      {
        path: 'career',
        element: <StudentCareer />,
      },
      {
        path: 'career/:careerId',
        element: <StudentCareerDetail />,
      },
      {
        path: 'counselling',
        element: <StudentCounselling />,
      },
    ],
  },

  // Parent Portal Branch (Protected + Role Guard: parent & admin)
  {
    path: '/parent',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['parent', 'admin']}>
          <ParentLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ParentHome />,
      },
      {
        path: 'concerns',
        element: <ParentConcerns />,
      },
      {
        path: 'counselling',
        element: <ParentCounselling />,
      },
    ],
  },

  // Admin Portal Branch (Protected + Strict Role Guard: admin ONLY)
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['admin']}>
          <AdminLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminHome />,
      },
      {
        path: 'analytics',
        element: <AdminAnalytics />,
      },
      {
        path: 'analytics/concerns',
        element: <AdminConcernAnalytics />,
      },
      {
        path: 'analytics/sentiment',
        element: <AdminSentimentAnalytics />,
      },
      {
        path: 'data',
        element: <AdminData />,
      },
      {
        path: 'escalations',
        element: <AdminEscalations />,
      },
    ],
  },

  // 404 Catch-All Route
  {
    element: <MainLayout />,
    children: [
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
