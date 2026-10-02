import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NavigationItem } from '@/types';
import { Compass, User, BookOpen, MessageSquare, GitFork, Users, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const StudentLayout: React.FC = () => {
  const { user } = useAuth();

  const studentNavItems: NavigationItem[] = [
    { label: 'Home', labelTe: 'హోమ్', href: '/student', icon: Compass },
    { label: 'My Profile', labelTe: 'నా ప్రొఫైల్', href: '/student/profile', icon: User },
    { label: 'Career', labelTe: 'వృత్తి అన్వేషణ', href: '/student/career', icon: BookOpen, badge: '15 Trades' },
    { label: 'Counselling', labelTe: 'కౌన్సెలింగ్', href: '/student/counselling', icon: MessageSquare },
    { label: 'Career Path', labelTe: 'కెరీర్ మార్గాలు', href: '/student/career', icon: GitFork },
    { label: 'Family/Parent', labelTe: 'కుటుంబం', href: '/parent', icon: Users },
    { label: 'Help', labelTe: 'సహాయం', href: '/student', icon: HelpCircle },
  ];

  return (
    <AppShell
      navigationItems={studentNavItems}
      sidebarTitle="Student Portal"
      sidebarFooter={
        user?.family_id ? (
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-text-primary">Family Unit Connected</div>
            <div className="text-[10px] text-text-muted">ID: {user.family_id}</div>
          </div>
        ) : undefined
      }
    >
      <Outlet />
    </AppShell>
  );
};
