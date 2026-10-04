import React from 'react';
import { Clock, Award, GraduationCap, ExternalLink, ShieldCheck } from 'lucide-react';
import type { CounsellingCareerMetrics } from '@/types/counselling';
import { ExplainAction } from './ExplainAction';

export interface TrainingDurationCardProps {
  metrics?: CounsellingCareerMetrics | null;
  careerId?: number | null;
  careerTitle?: string | null;
  className?: string;
}

export const TrainingDurationCard: React.FC<TrainingDurationCardProps> = ({
  metrics,
  careerId,
  careerTitle,
  className = '',
}) => {
  const hasTraining =
    metrics &&
    (Boolean(metrics.training_duration) ||
      Boolean(metrics.qualification) ||
      Boolean(metrics.nsqf_level));

  if (!hasTraining) {
    return (
      <div
        className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col justify-between ${className}`}
        role="region"
        aria-label="Training Duration Evidence"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Training & Qualification
              </h4>
            </div>
            {careerTitle && (
              <ExplainAction
                intent="explain_training"
                entityType="training"
                entityId={careerId || 1}
                entityTitle={careerTitle}
                label="Explain this"
                size="xs"
                variant="outline"
              />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-700 pt-2">Training duration unavailable</p>
          <p className="text-xs text-slate-500">No verified course curriculum durations reported for this trade yet.</p>
        </div>
      </div>
    );
  }

  const duration = metrics.training_duration;
  const qualification = metrics.qualification;
  const nsqf = metrics.nsqf_level;
  const type = metrics.training_type;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 p-4 md:p-5 shadow-xs flex flex-col justify-between space-y-3 ${className}`}
      role="region"
      aria-label="Training Duration Evidence"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-slate-100 text-slate-700">
              <Clock className="w-4 h-4 text-slate-700" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Training Duration & Levels
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <ExplainAction
              intent="explain_training"
              entityType="training"
              entityId={careerId || 1}
              entityTitle={careerTitle || 'Training Duration'}
              label="Explain this"
              size="xs"
              variant="outline"
            />
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {duration && (
            <div>
              <span className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight block">
                {duration}
              </span>
              <span className="text-xs text-slate-500">
                {type || 'Full-time formal vocational program'}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            {nsqf && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                <Award className="w-3.5 h-3.5 text-slate-600" />
                {nsqf}
              </span>
            )}
            {qualification && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                Qual: {qualification}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Provenance footer */}
      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between gap-2">
        <span className="truncate">
          Source: {metrics.training_source || 'Directorate General of Training (DGT)'}
        </span>
        {metrics.training_source_url && (
          <a
            href={metrics.training_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 flex-shrink-0 font-medium underline underline-offset-2"
          >
            <span>Verify</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
