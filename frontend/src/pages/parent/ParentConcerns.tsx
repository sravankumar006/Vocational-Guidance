import React from 'react';
import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';
import { HelpCircle } from 'lucide-react';

export const ParentConcerns: React.FC = () => {
  return (
    <RoutePlaceholder
      title="Parent Concerns"
      subtitle="Parental concerns regarding placement certainty, degree parity, and safety will appear here."
      role="parent"
      plannedPhase="Phase 5"
      plannedBrick="Brick 12: Parent Concerns & Objection Handling"
      icon={<HelpCircle className="h-6 w-6 text-accent" />}
      capabilities={[
        "Categorized parent inquiry cards (Hostel Safety, Job Certainty, Higher Study Access)",
        "Evidence-backed factual answers derived from verified training provider data",
        "Severity and urgency ratings mapped to ParentConcern model in PostgreSQL",
        "Direct family-context linkage preventing unauthorized cross-student queries",
      ]}
      handoffNotes="Backed by ParentConcern model in models/counselling.py. Protected by verify_family_access to ensure parent can only view their own child's concerns."
    />
  );
};
