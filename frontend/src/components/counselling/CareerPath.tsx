import React from 'react';
import {
  GitCommit,
  ArrowRight,
  ArrowDown,
  Clock,
  Award,
  BookOpen,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import type { CounsellingCareerPathStep } from '@/types/counselling';
import { ExplainAction } from './ExplainAction';

export interface CareerPathProps {
  careerPath?: CounsellingCareerPathStep[] | null;
  careerTitle?: string;
  careerDescription?: string;
  furtherEducation?: string[] | null;
  showEmptyStateIfNoPath?: boolean;
  className?: string;
}

/**
 * Reusable Career Pathway Visualization component for student counselling (Brick 23).
 * Consumes verified CounsellingCareerPathStep structures from Brick 21 canonical response.
 * Displays vertical progression on mobile, horizontal flow on desktop, without fabricating data.
 */
export const CareerPath: React.FC<CareerPathProps> = ({
  careerPath,
  careerTitle,
  careerDescription,
  furtherEducation,
  showEmptyStateIfNoPath = false,
  className = '',
}) => {
  if (!careerPath || careerPath.length === 0) {
    if (showEmptyStateIfNoPath) {
      return (
        <div
          className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm text-center ${className}`}
          role="status"
          aria-label="Career pathway status"
        >
          <GitCommit className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">
            A verified career pathway is not available for this career yet.
          </p>
        </div>
      );
    }
    return null;
  }

  // Preserve backend step ordering strictly
  const sortedSteps = [...careerPath].sort((a, b) => a.step - b.step);

  const getStageTypeBadge = (type?: string | null) => {
    if (!type) return null;
    const normalized = type.toLowerCase();
    if (normalized === 'education') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <BookOpen className="w-3 h-3 text-slate-500" />
          Education & Training
        </span>
      );
    }
    if (normalized === 'further_education') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <GraduationCap className="w-3 h-3 text-emerald-600" />
          Further Education
        </span>
      );
    }
    if (normalized === 'career') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
          <GitCommit className="w-3 h-3 text-sky-600" />
          Career Milestone
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 capitalize">
        {type}
      </span>
    );
  };

  return (
    <section
      aria-label="Career progression pathway"
      className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-6 shadow-sm space-y-5 ${className}`}
    >
      {/* Header with Career Context */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Career Progression Pathway
            </h4>
          </div>
          {careerTitle && (
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {careerTitle}
            </h3>
          )}
          {careerDescription && (
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {careerDescription}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {sortedSteps.length} {sortedSteps.length === 1 ? 'Stage' : 'Stages'}
          </span>
          <ExplainAction
            intent="explain_career_growth"
            entityType="pathway"
            entityId={careerTitle || '1'}
            entityTitle={careerTitle || 'Career Pathway'}
            label="Explain this path"
            size="xs"
            variant="outline"
          />
        </div>
      </div>

      {/* Desktop / Tablet Horizontal Timeline */}
      <div className="hidden md:block">
        <div className="overflow-x-auto pb-4 pt-2 scrollbar-thin">
          <ol
            className="flex items-stretch gap-3 min-w-max"
            aria-label="Progressive career stages"
          >
            {sortedSteps.map((stage, idx) => {
              const isLast = idx === sortedSteps.length - 1;
              const formattedStep = String(stage.step).padStart(2, '0');

              return (
                <li
                  key={stage.id || `stage-${stage.step}-${idx}`}
                  className="flex items-stretch"
                  aria-current={stage.is_current ? 'step' : undefined}
                >
                  <div
                    className={`w-64 rounded-xl border p-4 flex flex-col justify-between transition-colors ${
                      stage.is_current
                        ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-300'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                    }`}
                  >
                    {/* Top Row: Step badge & Type badge */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                              stage.is_current
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-800 text-white'
                            }`}
                          >
                            {formattedStep}
                          </span>
                          <span className="sr-only">Stage {stage.step}:</span>
                        </div>

                        {stage.is_current && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <MapPin className="w-2.5 h-2.5" />
                            You are here
                          </span>
                        )}
                      </div>

                      {getStageTypeBadge(stage.type)}

                      <h5 className="text-sm font-bold text-slate-900 leading-snug">
                        {stage.title}
                      </h5>
                    </div>

                    {/* Middle: Description */}
                    {stage.description && (
                      <p className="text-xs text-slate-600 leading-relaxed mb-4 flex-grow">
                        {stage.description}
                      </p>
                    )}

                    {/* Bottom Metadata: NSQF, Duration, Qualification */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/80 mt-auto text-[11px]">
                      {stage.nsqf_level && (
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Award className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-800 font-semibold text-[10px]">
                            {stage.nsqf_level}
                          </span>
                        </div>
                      )}

                      {stage.duration && (
                        <div className="flex items-center gap-1.5 text-slate-600 font-normal">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>Duration: {stage.duration}</span>
                        </div>
                      )}

                      {stage.qualification && (
                        <div className="flex items-center gap-1.5 text-slate-600 font-normal">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>Qual: {stage.qualification}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connecting Arrow between desktop cards */}
                  {!isLast && (
                    <div
                      className="flex items-center justify-center px-1 text-slate-400"
                      aria-hidden="true"
                    >
                      <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="block md:hidden">
        <ol
          className="relative border-l-2 border-slate-200 ml-3.5 space-y-6 pl-5 pt-1"
          aria-label="Progressive career stages"
        >
          {sortedSteps.map((stage, idx) => {
            const isLast = idx === sortedSteps.length - 1;
            const formattedStep = String(stage.step).padStart(2, '0');

            return (
              <li
                key={stage.id || `stage-${stage.step}-${idx}`}
                className="relative"
                aria-current={stage.is_current ? 'step' : undefined}
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${
                    stage.is_current
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                      : 'bg-slate-800 text-white'
                  }`}
                  aria-hidden="true"
                >
                  {formattedStep}
                </div>

                <div
                  className={`rounded-xl border p-4 space-y-2.5 ${
                    stage.is_current
                      ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-300'
                      : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Stage {stage.step}
                    </span>
                    {stage.is_current && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <MapPin className="w-2.5 h-2.5" />
                        You are here
                      </span>
                    )}
                  </div>

                  {getStageTypeBadge(stage.type)}

                  <h5 className="text-sm font-bold text-slate-900 leading-snug">
                    {stage.title}
                  </h5>

                  {stage.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {stage.description}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  {(stage.nsqf_level || stage.duration || stage.qualification) && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                      {stage.nsqf_level && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200/80 text-slate-800 font-semibold text-[10px]">
                          <Award className="w-3 h-3 text-slate-600" />
                          {stage.nsqf_level}
                        </span>
                      )}
                      {stage.duration && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {stage.duration}
                        </span>
                      )}
                      {stage.qualification && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <GraduationCap className="w-3 h-3 text-slate-400" />
                          {stage.qualification}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!isLast && (
                  <div
                    className="flex justify-center my-2 text-slate-400"
                    aria-hidden="true"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Further Education & Lateral Mobility Options (Section 8) */}
      {furtherEducation && furtherEducation.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Further Education & Lateral Mobility
            </h5>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-700">
            {furtherEducation.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
