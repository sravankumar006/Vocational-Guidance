import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NavigationItem } from '@/types';
import { LayoutDashboard, BarChart3, Database, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();

  const adminNavItems: NavigationItem[] = [
    { label: 'Overview', labelTe: 'స్థూల దృష్టి', href: '/admin', icon: LayoutDashboard },
    { label: 'Analytics', labelTe: 'గణాంకాలు', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Data Management', labelTe: 'డేటా నిర్వహణ', href: '/admin/data', icon: Database, badge: '10K Recs' },
    { label: 'Human Escalations', labelTe: 'కౌన్సిలర్ సంప్రదింపులు', href: '/admin/escalations', icon: AlertTriangle, badge: '3 Open' },
  ];

  return (
    <AppShell
      navigationItems={adminNavItems}
      sidebarTitle="Platform Administration"
      sidebarFooter={
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-text-primary">SIH26241 Portal</div>
          <div className="text-[11px] text-text-muted">
            Authenticated: {user?.name || 'Administrator'}
          </div>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
};
