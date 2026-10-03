import React from 'react';
import { RoutePlaceholder } from '@/components/common/RoutePlaceholder';
import { BarChart3 } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  return (
    <RoutePlaceholder
      title="Platform Analytics"
      subtitle="District telemetry, cohort completion rates, and empirical placement distributions will appear here."
      role="admin"
      plannedPhase="Phase 6"
      plannedBrick="Brick 14: Administrative Telemetry & Analytics Dashboard"
      icon={<BarChart3 className="h-6 w-6 text-accent" />}
      capabilities={[
        "District-level vocational uptake rates across Telangana and Andhra Pradesh",
        "Empirical wage distribution charts based on 10,000+ imported records",
        "Student and parent sentiment trend analytics across counseling cohorts",
        "Exportable policy reports formatted for state vocational education directorates",
      ]}
      handoffNotes="Aggregates data across CounsellingSession, SentimentEvent, and JobOutcome database models. Protected by require_admin dependency."
    />
  );
};
