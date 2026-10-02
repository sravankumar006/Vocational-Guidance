import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  Compass,
  Briefcase,
  TrendingUp,
  Award,
  Users,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

export const StudentHome: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('studentWelcome')}, ${user?.name || 'Aarav'}!`}
        subtitle="Empirical career pathways and family alignment powered by 10,000+ verified vocational training benchmarks."
        badge={<StatusBadge status="success" label="Active Learner" />}
        actions={
          <Link to="/student/counselling">
            <Button
              variant="primary"
              size="md"
              leftIcon={<MessageSquare className="h-4 w-4" />}
            >
              Start AI Guidance Session
            </Button>
          </Link>
        }
      />

      {/* Top Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Recommended Trade"
          value="Solar PV"
          subtext="Green Energy & Electrical"
          icon={<Compass className="h-5 w-5" />}
        />
        <StatCard
          label="Placement Rate"
          value="84.2%"
          subtext="Empirical Benchmark"
          trend={{ value: "+4.1% vs avg", isPositive: true }}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Median Starting Salary"
          value="₹19,500"
          subtext="Per month (Certified Trainees)"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          label="Family Status"
          value="Aligned"
          subtext="Parent shared consent"
          icon={<Users className="h-5 w-5" />}
          badge={<StatusBadge status="success" label="Verified" />}
        />
      </div>

      {/* Primary Vocational Pathway Card */}
      <Section
        title="Active Career Exploration"
        description="Your primary trade track and academic credit progression milestones"
      >
        <Card padding="lg" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge status="info" label="NSQF Level 4" />
                <span className="text-xs text-text-muted">• 6 Months Duration</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary">
                Solar PV Installation & Maintenance Technician
              </h3>
              <p className="text-sm text-text-secondary">
                Offered by National Skill Training Institute (NSTI), Hyderabad with industry apprenticeship.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Link to="/student/career">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Explore Details
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/40">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-border/30">
              <div className="text-xs text-text-muted">Top Recruiting Sector</div>
              <div className="text-sm font-medium text-text-primary mt-0.5">
                Renewable Energy EPCs
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-border/30">
              <div className="text-xs text-text-muted">Apprenticeship Stipend</div>
              <div className="text-sm font-medium text-text-primary mt-0.5">
                ₹8,500 - ₹11,000 / month
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-border/30">
              <div className="text-xs text-text-muted">Higher Degree Route</div>
              <div className="text-sm font-medium text-text-primary mt-0.5">
                Eligible for B.Voc (Electrical)
              </div>
            </div>
          </div>

          <div className="pt-1">
            <ProgressBar
              value={65}
              label="Vocational Readiness & Assessment Completion"
              showPercent
              variant="success"
            />
          </div>
        </Card>
      </Section>

      {/* Dual Column: Family Harmony & Quick Discovery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Family Harmony Card */}
        <Card padding="md" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/[0.04] text-text-secondary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Family Decision Alignment
                </h4>
                <p className="text-xs text-text-secondary">
                  Linked parent account: Sunita Sharma (Mother)
                </p>
              </div>
            </div>
            <StatusBadge status="success" label="Connected" />
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-border/30 text-xs text-text-secondary space-y-1.5">
            <div className="flex items-center justify-between text-text-primary font-medium">
              <span>Parent's Primary Inquiry:</span>
              <span className="text-emerald-400">Addressed by Data</span>
            </div>
            <p className="leading-relaxed">
              "Is the job permanent and safe?" — Answered via government verified placement reports with 84% placement rate in Telangana and neighboring states.
            </p>
          </div>

          <div className="flex items-center justify-end">
            <Link to="/parent">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                View Family Perspective
              </Button>
            </Link>
          </div>
        </Card>

        {/* Explore Verified Trades */}
        <Card padding="md" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/[0.04] text-text-secondary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Verified Vocational Trades
                </h4>
                <p className="text-xs text-text-secondary">
                  From official DGT & NSDC empirical dataset
                </p>
              </div>
            </div>
            <span className="text-xs text-text-muted font-medium">15 Trades</span>
          </div>

          <div className="space-y-1.5">
            {[
              { name: 'Electrician (Domestic & Industrial)', salary: '₹19,000/mo', placement: '86%' },
              { name: 'CNC Machine Operator & Programmer', salary: '₹22,000/mo', placement: '91%' },
              { name: 'Automotive Service Technician', salary: '₹18,500/mo', placement: '82%' },
            ].map((trade, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-border/20 text-xs"
              >
                <div className="font-medium text-text-primary">{trade.name}</div>
                <div className="flex items-center gap-3 text-text-muted">
                  <span>{trade.salary}</span>
                  <span className="text-emerald-400 font-medium">{trade.placement}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end">
            <Link to="/student/career">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                View All 15 Trades
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
