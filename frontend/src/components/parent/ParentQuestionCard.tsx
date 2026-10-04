import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface ParentQuestionCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export const ParentQuestionCard: React.FC<ParentQuestionCardProps> = ({
  id,
  title,
  description,
  icon,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      id={`parent-question-${id}`}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left p-5 md:p-6 rounded-2xl border transition-all duration-150
        flex flex-col justify-between gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900
        ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200'
            : 'bg-white hover:bg-slate-50/80 active:bg-slate-100/90 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs cursor-pointer'
        }
      `}
      aria-label={`${title}: ${description}`}
    >
      {/* Top Row: Icon Container and Navigation Indicator */}
      <div className="flex items-center justify-between gap-3">
        <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/70 text-slate-700 group-hover:text-slate-950 group-hover:bg-slate-100 transition-colors">
          {icon}
        </div>
        <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Content: Title & Plain Description */}
      <div className="space-y-1">
        <h3 className="text-base md:text-lg font-semibold text-slate-900 group-hover:text-slate-950 transition-colors">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 line-clamp-2 leading-relaxed font-normal">
          {description}
        </p>
      </div>
    </button>
  );
};
