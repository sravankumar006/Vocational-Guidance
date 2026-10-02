import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';

export const AuthLayout: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-text-primary">
      {/* Top minimalistic header */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-soft border border-border-strong">
            M
          </div>
          <div>
            <span className="font-bold text-base text-text-primary tracking-tight">
              {t('appName')}
            </span>
            <span className="text-[10px] uppercase font-semibold ml-2 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Official Portal
            </span>
          </div>
        </Link>
        <LanguageSelector />
      </header>

      {/* Centered Auth Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 sm:p-6 text-center text-xs text-text-muted border-t border-border/40">
        <p>
          {t('platformTagline')} • {t('govInitiative')}
        </p>
      </footer>
    </div>
  );
};
