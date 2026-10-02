import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import type { NavigationItem } from '@/types';

const adminNavItems: NavigationItem[] = [
  { label: 'Overview', href: '/admin', icon: Home },
];

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Navbar
        brand={
          <div className="flex items-center space-x-2.5">
            <div className="bg-slate-700 text-white p-1.5 rounded-md">
              <Shield className="h-5 w-5 text-slate-100" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              Admin Environment
            </span>
          </div>
        }
        actions={
          <Link
            to="/"
            className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded hover:bg-slate-50 transition-colors"
          >
            &larr; Exit to Root
          </Link>
        }
      />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          items={adminNavItems}
          header={<div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Navigation</div>}
          className="hidden md:flex border-r border-slate-200"
        />
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
