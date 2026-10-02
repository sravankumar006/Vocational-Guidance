import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  Database,
  Building2,
  AlertTriangle,
  ArrowRight,
  Activity,
  FileCheck,
} from 'lucide-react';

interface EscalationSummary {
  id: string;
  studentName: string;
  parentName: string;
  trade: string;
  concernCategory: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'resolved';
}

const RECENT_ESCALATIONS: EscalationSummary[] = [
  {
    id: 'ESC-101',
    studentName: 'Aarav Sharma',
    parentName: 'Sunita Sharma',
    trade: 'Solar PV Technician',
    concernCategory: 'Long-term income stability vs traditional BA degree',
    priority: 'medium',
    status: 'pending',
  },
  {
    id: 'ESC-102',
    studentName: 'Rohit Kulkarni',
    parentName: 'Anil Kulkarni',
    trade: 'CNC Operator',
    concernCategory: 'Night shift industrial workplace safety concerns',
    priority: 'high',
    status: 'assigned',
  },
  {
    id: 'ESC-103',
    studentName: 'Priya Meena',
    parentName: 'Ramesh Meena',
    trade: 'Fashion Design & Garment Tech',
    concernCategory: 'Relocation to apparel cluster in Tirupur',
    priority: 'urgent',
    status: 'pending',
  },
];

export const AdminHome: React.FC = () => {
  const columns: Column<EscalationSummary>[] = [
    {
      key: 'id',
      header: 'Case ID',
      render: (item) => <span className="font-mono text-xs font-semibold">{item.id}</span>,
    },
    {
      key: 'studentName',
      header: 'Student & Guardian',
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.studentName}</div>
          <div className="text-xs text-text-muted">{item.parentName}</div>
        </div>
      ),
    },
    {
      key: 'trade',
      header: 'Vocational Trade',
      render: (item) => (
        <span className="text-xs text-text-secondary">{item.trade}</span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => (
        <StatusBadge
          status={
            item.priority === 'urgent' || item.priority === 'high'
              ? 'error'
              : item.priority === 'medium'
              ? 'warning'
              : 'info'
          }
          label={item.priority.toUpperCase()}
        />
      ),
    },
    {
      key: 'status',
      header: 'Workflow Status',
      render: (item) => (
        <StatusBadge
          status={item.status === 'resolved' ? 'success' : 'neutral'}
          label={item.status.toUpperCase()}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Overview"
        subtitle="Platform health, empirical dataset metrics, and family guidance escalations."
        badge={<StatusBadge status="info" label="National Portal" />}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/admin/escalations">
              <Button variant="outline" size="sm">
                View All Escalations
              </Button>
            </Link>
            <Link to="/admin/data">
              <Button variant="primary" size="sm">
                Manage Data Sources
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Empirical Trainee Records"
          value="10,000"
          subtext="Verified DGT / NSDC dataset"
          icon={<Database className="h-5 w-5" />}
          badge={<StatusBadge status="success" label="Active" />}
        />
        <StatCard
          label="Registered Providers"
          value="5"
          subtext="NSTIs & Apex Skill Institutes"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Vocational Trades Mapped"
          value="15"
          subtext="Covering 18 states & 120 districts"
          icon={<FileCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Active Escalation Queue"
          value="3 Open"
          subtext="Requiring Counsellor Call"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={{ value: "2 High Priority", isPositive: false }}
        />
      </div>

      {/* Platform Health and Verification Status Bar */}
      <Card padding="sm" className="bg-white/[0.02] border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-text-primary">System Operational State:</span>
            <span className="text-text-secondary">All API services reporting nominal health (HTTP 200)</span>
          </div>

          <div className="flex items-center gap-4 text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> PostgreSQL Engine
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Fast-API Backend
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> RBAC Engine
            </span>
          </div>
        </div>
      </Card>

      {/* Recent Escalations Requiring Human Intervention */}
      <Section
        title="Pending Human Counsellor Escalations"
        description="Cases where AI guidance flagged complex parental hesitation or specific trade doubt"
        action={
          <Link to="/admin/escalations">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Open Full Queue
            </Button>
          </Link>
        }
      >
        <DataTable
          columns={columns}
          data={RECENT_ESCALATIONS}
          keyExtractor={(item) => item.id}
        />
      </Section>
    </div>
  );
};
