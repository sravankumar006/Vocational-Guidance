import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { SalaryCard } from './SalaryCard';
import { PlacementCard } from './PlacementCard';
import { TrainingDurationCard } from './TrainingDurationCard';
import { JobAvailabilityCard } from './JobAvailabilityCard';
import { CareerGrowthCard } from './CareerGrowthCard';
import type {
  CounsellingCareer,
  CounsellingCareerMetrics,
  CounsellingCareerPathStep,
} from '@/types/counselling';

export interface CareerEvidenceSectionProps {
  career?: CounsellingCareer | null;
  metrics?: CounsellingCareerMetrics | null;
  careerPath?: CounsellingCareerPathStep[] | null;
  furtherEducation?: string[] | null;
  className?: string;
}

/**
 * Master Career Evidence & Data Visualization Section (Brick 24).
 * Presents verified statutory facts for salary, placement, training duration,
 * job availability, and career progression with strict provenance tracking.
 */
export const CareerEvidenceSection: React.FC<CareerEvidenceSectionProps> = ({
  career,
  metrics,
  careerPath,
  furtherEducation,
  className = '',
}) => {
  // If neither career, metrics, nor careerPath exist, omit the entire evidence section cleanly
  if (!career && !metrics && (!careerPath || careerPath.length === 0)) {
    return null;
  }

  return (
    <section
      className={`space-y-4 ${className}`}
      aria-label="Verified Career Evidence & Empirical Data"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Verified Career Evidence & Empirical Benchmarks
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Factual statutory data verified against NCVET, DGT, and National Career Service repositories.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Statutory Provenance</span>
        </div>
      </div>

      {/* 2-Column Responsive Grid on Desktop / Tablet; 1-Column on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. Salary Card */}
        <SalaryCard
          metrics={metrics}
          careerId={career?.id}
          careerTitle={career?.title}
        />

        {/* 2. Placement Card */}
        <PlacementCard
          metrics={metrics}
          careerId={career?.id}
          careerTitle={career?.title}
        />

        {/* 3. Training Duration Card */}
        <TrainingDurationCard
          metrics={metrics}
          careerId={career?.id}
          careerTitle={career?.title}
        />

        {/* 4. Job Availability Card */}
        <JobAvailabilityCard
          metrics={metrics}
          careerId={career?.id}
          careerTitle={career?.title}
        />
      </div>

      {/* 5. Career Growth Visualization (Full-Width) */}
      <div className="pt-1">
        <CareerGrowthCard
          careerPath={careerPath}
          careerTitle={career?.title}
          careerDescription={career?.description}
          furtherEducation={furtherEducation}
        />
      </div>
    </section>
  );
};
