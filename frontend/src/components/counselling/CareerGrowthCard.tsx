import React from 'react';
import { GitCommit } from 'lucide-react';
import { CareerPath } from './CareerPath';
import type { CounsellingCareerPathStep } from '@/types/counselling';

export interface CareerGrowthCardProps {
  careerPath?: CounsellingCareerPathStep[] | null;
  careerTitle?: string;
  careerDescription?: string;
  furtherEducation?: string[] | null;
  className?: string;
}

export const CareerGrowthCard: React.FC<CareerGrowthCardProps> = ({
  careerPath,
  careerTitle,
  careerDescription,
  furtherEducation,
  className = '',
}) => {
  const hasPath = careerPath && careerPath.length > 0;

  if (!hasPath) {
    return (
      <div
        className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-xs ${className}`}
        role="region"
        aria-label="Career Growth Evidence"
      >
        <div className="flex items-center gap-2 text-slate-500 mb-2">
          <GitCommit className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Career Progression Pathway
          </h4>
        </div>
        <p className="text-sm font-semibold text-slate-700">Progression pathway unavailable</p>
        <p className="text-xs text-slate-500 mt-1">
          No verified progression milestones have been recorded for this occupation yet.
        </p>
      </div>
    );
  }

  return (
    <div className={className} role="region" aria-label="Career Growth Evidence">
      <CareerPath
        careerPath={careerPath}
        careerTitle={careerTitle}
        careerDescription={careerDescription}
        furtherEducation={furtherEducation}
        showEmptyStateIfNoPath={false}
      />
    </div>
  );
};
