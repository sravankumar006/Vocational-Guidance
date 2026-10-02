import React from 'react';
import { Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-800 text-white p-2 rounded-md">
            <Layers className="h-5 w-5 text-slate-100" />
          </div>
          <span className="font-semibold text-slate-800 text-lg">
            Vocational Guidance Platform
          </span>
        </div>
        <div className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          Phase 0: Foundation
        </div>
      </div>
    </header>
  );
};
