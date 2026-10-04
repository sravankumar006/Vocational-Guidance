import React from 'react';
import { Sparkles } from 'lucide-react';

interface CounsellingLoadingProps {
  message?: string;
}

export const CounsellingLoading: React.FC<CounsellingLoadingProps> = ({
  message = 'Consulting verified vocational records and assembling guidance...',
}) => {
  return (
    <div className="flex items-start gap-3 my-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 animate-pulse text-slate-500" />
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-none p-3.5 shadow-sm max-w-[85%]">
        <div className="flex items-center gap-2">
          <div className="flex space-x-1.5 items-center">
            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-slate-500 font-medium pl-1">{message}</span>
        </div>
      </div>
    </div>
  );
};
