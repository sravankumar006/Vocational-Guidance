import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NavigationItem } from '@/types';
import { Home, User, BookOpen, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const StudentLayout: React.FC = () => {
  const { user } = useAuth();

  const studentNavItems: NavigationItem[] = [
    { label: 'Home', labelTe: 'హోమ్', href: '/student', icon: Home },
    { label: 'Profile', labelTe: 'నా ప్రొఫైల్', href: '/student/profile', icon: User },
    { label: 'Career', labelTe: 'వృత్తి అన్వేషణ', href: '/student/career', icon: BookOpen },
    { label: 'Counselling', labelTe: 'కౌన్సెలింగ్', href: '/student/counselling', icon: MessageSquare },
  ];

  return (
    <AppShell
      navigationItems={studentNavItems}
      sidebarTitle="Student Workspace"
      sidebarFooter={
        user ? (
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-text-primary">{user.name}</div>
            <div className="text-[10px] text-text-muted capitalize">Role: {user.role}</div>
          </div>
        ) : undefined
      }
    >
      <Outlet />
    </AppShell>
  );
};
