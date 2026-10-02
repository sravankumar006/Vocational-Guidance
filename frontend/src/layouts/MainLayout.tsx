import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { useLanguage } from '@/context/LanguageContext';

export const MainLayout: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-background-card/50 py-6 text-center text-xs text-text-secondary">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-medium text-text-primary">
            {t('appName')} • {t('platformName')}
          </p>
          <p className="text-text-muted">
            {t('govInitiative')} • {t('benchmarkNotice')}
          </p>
        </div>
      </footer>
    </div>
  );
};
