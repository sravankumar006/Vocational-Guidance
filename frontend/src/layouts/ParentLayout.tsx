import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NavigationItem } from '@/types';
import { Home, HelpCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const ParentLayout: React.FC = () => {
  const { user } = useAuth();

  const parentNavItems: NavigationItem[] = [
    { label: 'Home', labelTe: 'హోమ్', href: '/parent', icon: Home },
    { label: 'Concerns', labelTe: 'కుటుంబ సందేహాలు', href: '/parent/concerns', icon: HelpCircle },
    { label: 'Counselling', labelTe: 'కౌన్సెలింగ్', href: '/parent/counselling', icon: MessageSquare },
  ];

  return (
    <AppShell
      navigationItems={parentNavItems}
      sidebarTitle="Parent Workspace"
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
