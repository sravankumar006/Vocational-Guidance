import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { HelpCircle, MessageSquare, ArrowRight } from 'lucide-react';

export const ParentHome: React.FC = () => {
  const { user } = useAuth();

  const parentModules = [
    {
      title: 'Family Concerns',
      description: 'Address real questions regarding safety, placement guarantees, and degree parity.',
      href: '/parent/concerns',
      icon: <HelpCircle className="h-5 w-5 text-accent" />,
      brick: 'Concerns Engine',
    },
    {
      title: 'Voice & Guidance Dialogue',
      description: 'Participate in bilingual voice guidance and joint parent-student counseling.',
      href: '/parent/counselling',
      icon: <MessageSquare className="h-5 w-5 text-accent" />,
      brick: 'Family Decision Support',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Parent Workspace
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Welcome to your parent workspace{user ? `, ${user.name}` : ''}.
          </p>
        </div>
        <Badge variant="default" size="md">
          PARENT PORTAL
        </Badge>
      </div>

      {/* Navigation Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parentModules.map((mod) => (
          <Card
            key={mod.href}
            padding="lg"
            className="border-border/60 hover:border-border/80 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-border/60 flex items-center justify-center">
                {mod.icon}
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  {mod.title}
                </h2>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-border/20 flex items-center justify-between">
              <span className="text-[11px] text-text-muted">{mod.brick}</span>
              <Link
                to={mod.href}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
              >
                <span>Open</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Domain Context Box */}
      <Card padding="md" className="border-border/40 bg-white/[0.01] text-xs text-text-muted">
        <span className="font-semibold text-text-secondary">Family Context Security: </span>
        Parent operations are authorized via server-side `ParentStudentAssociation` records. Parents can only access context belonging to their verified children.
      </Card>
    </div>
  );
};
