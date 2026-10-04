import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NavigationItem } from '@/types';
import { Home, BarChart3, Database, AlertTriangle, ShieldAlert, HeartHandshake, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();

  const adminNavItems: NavigationItem[] = [
    { label: 'Home', labelTe: 'హోమ్', href: '/admin', icon: Home },
    { label: 'Analytics', labelTe: 'గణాంకాలు', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Concern Analytics', labelTe: 'ఆందోళనల విశ్లేషణ', href: '/admin/analytics/concerns', icon: ShieldAlert },
    { label: 'Sentiment Analytics', labelTe: 'మనోభావాల విశ్లేషణ', href: '/admin/analytics/sentiment', icon: HeartHandshake },
    { label: 'Geographic Analytics', labelTe: 'భౌగోళిక విశ్లేషణ', href: '/admin/analytics/geography', icon: MapPin },
    { label: 'Data', labelTe: 'డేటా నిర్వహణ', href: '/admin/data', icon: Database },
    { label: 'Escalations', labelTe: 'కౌన్సిలర్ సంప్రదింపులు', href: '/admin/escalations', icon: AlertTriangle },
  ];

  return (
    <AppShell
      navigationItems={adminNavItems}
      sidebarTitle="Administration Workspace"
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
