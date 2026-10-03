import React from 'react';
import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';
import { MessageSquare } from 'lucide-react';

export const ParentCounselling: React.FC = () => {
  return (
    <RoutePlaceholder
      title="Parent Counselling"
      subtitle="Bilingual voice guidance, family consensus support, and joint student exploration will appear here."
      role="parent"
      plannedPhase="Phase 5"
      plannedBrick="Brick 13: Joint Family Decision Support & Consensus Engine"
      icon={<MessageSquare className="h-6 w-6 text-accent" />}
      capabilities={[
        "Low-digital-literacy voice dialogue interface in Telugu and English",
        "Empathetic explanation of vocational qualifications vs traditional academic streams",
        "Joint student-parent alignment summaries identifying shared aspirational goals",
        "Direct connection with certified human counselors when concerns exceed automated thresholds",
      ]}
      handoffNotes="Backed by CounsellingSession and SentimentEvent models. Verified through verify_family_access authorization dependency."
    />
  );
};
