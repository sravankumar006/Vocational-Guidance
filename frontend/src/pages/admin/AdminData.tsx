import React from 'react';
import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';
import { Database } from 'lucide-react';

export const AdminData: React.FC = () => {
  return (
    <RoutePlaceholder
      title="Data Management"
      subtitle="Vocational dataset provenance, course catalogs, and qualification framework records will appear here."
      role="admin"
      plannedPhase="Phase 6"
      plannedBrick="Brick 15: Verified Data Management & Catalog Administration"
      icon={<Database className="h-6 w-6 text-accent" />}
      capabilities={[
        "Dataset inspection interface for 10,000+ imported vocational training records",
        "NCVET qualification framework versioning and qualification pack auditing",
        "Training provider accreditation verification and contact registry management",
        "Repeatable transactional CSV/API dataset synchronization pipelines",
      ]}
      handoffNotes="Manages DataSource, TrainingProvider, Course, and Occupation tables. Protected by require_admin dependency."
    />
  );
};
