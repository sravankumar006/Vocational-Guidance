import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Layers } from 'lucide-react';

interface RoutePlaceholderProps {
  title: string;
  subtitle: string;
  role: 'student' | 'parent' | 'admin' | 'public';
  plannedPhase: string;
  plannedBrick: string;
  icon?: React.ReactNode;
  capabilities: string[];
  handoffNotes?: string;
}

export const RoutePlaceholder: React.FC<RoutePlaceholderProps> = ({
  title,
  subtitle,
  role,
  plannedPhase,
  plannedBrick,
  icon,
  capabilities,
  handoffNotes,
}) => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title & Roadmap Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3.5">
          {icon && (
            <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-border/60 flex items-center justify-center text-text-primary shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" size="sm">
            {role.toUpperCase()}
          </Badge>
          <Badge variant="default" size="sm">
            Coming Soon: {plannedBrick}
          </Badge>
        </div>
      </div>

      {/* Main Architectural Card */}
      <Card padding="lg" className="border-border/60 shadow-soft space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <Layers className="h-4 w-4" />
            <span>Planned Domain Features ({plannedPhase})</span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            This route establishes the dedicated application boundary for this domain. Actual AI algorithms, database queries, and business workflows belong to future project bricks.
          </p>
        </div>

        {/* Key Feature Capabilities List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {capabilities.map((capability, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-border/30 text-xs sm:text-sm text-text-primary"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{capability}</span>
            </div>
          ))}
        </div>

        {/* Developer Handoff Context */}
        {handoffNotes && (
          <div className="mt-4 p-3.5 rounded-lg bg-white/[0.02] border border-border/40 text-xs text-text-muted space-y-1">
            <div className="font-semibold text-text-secondary">Developer Handoff Note:</div>
            <div>{handoffNotes}</div>
          </div>
        )}
      </Card>
    </div>
  );
};
