import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Navbar
        brand={
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="bg-slate-800 text-white p-1.5 rounded-md">
              <Layers className="h-5 w-5 text-slate-100" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              Vocational Guidance Platform
            </span>
          </Link>
        }
        actions={
          <div className="flex items-center space-x-2 text-xs">
            <Link
              to="/student"
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-50 transition-colors"
            >
              Student Portal
            </Link>
            <Link
              to="/parent"
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-50 transition-colors"
            >
              Parent Portal
            </Link>
            <Link
              to="/admin"
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-50 transition-colors"
            >
              Admin Portal
            </Link>
          </div>
        }
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Vocational Guidance Platform &bull; Modular Frontend Foundation
      </footer>
    </div>
  );
};
