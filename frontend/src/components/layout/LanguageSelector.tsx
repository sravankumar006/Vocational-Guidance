import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex items-center bg-background-elevated border border-border rounded-lg p-0.5 ${className}`}>
      <span className="px-2 text-text-muted">
        <Globe className="h-3.5 w-3.5" />
      </span>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          language === 'en'
            ? 'bg-accent text-white shadow-soft'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLanguage('te')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          language === 'te'
            ? 'bg-accent text-white shadow-soft'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        తెలుగు
      </button>
    </div>
  );
};
