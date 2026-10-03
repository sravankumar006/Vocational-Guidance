import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BarChart3, Database, AlertTriangle, ArrowRight } from 'lucide-react';

export const AdminHome: React.FC = () => {
  const { user } = useAuth();

  const adminModules = [
    {
      title: 'Platform Analytics',
      description: 'District telemetry, cohort completion rates, and empirical placement distributions.',
      href: '/admin/analytics',
      icon: <BarChart3 className="h-5 w-5 text-accent" />,
      brick: 'Analytics Module',
    },
    {
      title: 'Data Management',
      description: 'Administration of 10,000+ verified courses, training providers, and qualification benchmarks.',
      href: '/admin/data',
      icon: <Database className="h-5 w-5 text-accent" />,
      brick: 'Data Provenance',
    },
    {
      title: 'Human Escalations',
      description: 'Resolution workflow for complex cases and high-anxiety student sessions.',
      href: '/admin/escalations',
      icon: <AlertTriangle className="h-5 w-5 text-accent" />,
      brick: 'Counselor Queue',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Administration Workspace
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Welcome to the administration workspace{user ? `, ${user.name}` : ''}.
          </p>
        </div>
        <Badge variant="default" size="md">
          ADMIN CONSOLE
        </Badge>
      </div>

      {/* Navigation Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {adminModules.map((mod) => (
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
        <span className="font-semibold text-text-secondary">Security & RBAC Enforcement: </span>
        Administrative endpoints and routes are strictly protected by `require_admin` server-side dependencies. Admin accounts cannot be created via public registration.
      </Card>
    </div>
  );
};
