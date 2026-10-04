import React from 'react';
import { Briefcase, Award, CheckCircle2 } from 'lucide-react';
import type { CounsellingCareer } from '@/types/counselling';

interface CareerCardProps {
  career: CounsellingCareer;
}

export const CareerCard: React.FC<CareerCardProps> = ({ career }) => {
  if (!career || !career.title) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 flex-shrink-0 mt-0.5">
            <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Career Context
            </span>
            <h3 className="text-base md:text-lg font-semibold text-slate-900 leading-tight">
              {career.title}
            </h3>
          </div>
        </div>

        {/* Deterministic Match Score (if present) */}
        {career.compatibility_score !== null && career.compatibility_score !== undefined && (
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>{career.compatibility_score}% Match</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Deterministic score</span>
          </div>
        )}
      </div>

      {/* Description */}
      {career.description && (
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          {career.description}
        </p>
      )}

      {/* Deterministic Matching Reasons */}
      {career.reasons && career.reasons.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <span className="text-[11px] font-medium text-slate-500">
            Deterministic Match Criteria:
          </span>
          <ul className="space-y-1">
            {career.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
