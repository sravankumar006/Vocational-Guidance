import React from 'react';
import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';
import { MessageSquare } from 'lucide-react';

export const StudentCounselling: React.FC = () => {
  return (
    <RoutePlaceholder
      title="Student Counselling"
      subtitle="Interactive AI-guided counselling, conversational career exploration, and sentiment tracking will appear here."
      role="student"
      plannedPhase="Phase 4"
      plannedBrick="Brick 11: AI-Powered Multi-Turn Counselling Dialogues"
      icon={<MessageSquare className="h-6 w-6 text-accent" />}
      capabilities={[
        "Context-aware vocational counseling grounded in factual course data",
        "Bilingual dialogue support with real-time Telugu and English toggle",
        "Dynamic sentiment analysis and student anxiety tracking",
        "Automated escalation triggers for human counselor intervention",
      ]}
      handoffNotes="Backend models CounsellingSession and CounsellingMessage are ready in models/counselling.py. Protected by verify_family_access & student isolation."
    />
  );
};
