import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { EscalationAnalytics } from '@/types/admin';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface EscalationChartProps {
  data: EscalationAnalytics;
}

type BreakdownTab = 'status' | 'priority' | 'concern' | 'career' | 'language';

const PALETTE = ['#e06c75', '#f59e0b', '#627d98', '#10b981', '#829ab1', '#9fb3c8'];

export const EscalationChart: React.FC<EscalationChartProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<BreakdownTab>('status');
  const hasData = data.total > 0;

  let activeBreakdownData = data.by_status;
  if (activeTab === 'priority') activeBreakdownData = data.by_priority;
  else if (activeTab === 'concern') activeBreakdownData = data.by_concern;
  else if (activeTab === 'career') activeBreakdownData = data.by_career;
  else if (activeTab === 'language') activeBreakdownData = data.by_language;

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Human Escalation Caseload
          </h3>
          <p className="text-xs text-text-secondary">
            Telemetry for cases routed to human professional counsellors
          </p>
        </div>

        {/* Status Count Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-1 text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending: {data.pending}</span>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2.5 py-1 text-blue-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>In Progress: {data.in_progress}</span>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Resolved: {data.resolved}</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-text-secondary">
            No escalation records found for this period.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Escalated cases requiring counsellor intervention will display here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs for Breakdown Selection */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border/30 pb-2.5 text-xs">
            <button
              onClick={() => setActiveTab('status')}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                activeTab === 'status'
                  ? 'bg-surface-elevated text-text-primary shadow-sm ring-1 ring-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              By Status
            </button>
            <button
              onClick={() => setActiveTab('priority')}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                activeTab === 'priority'
                  ? 'bg-surface-elevated text-text-primary shadow-sm ring-1 ring-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              By Priority
            </button>
            <button
              onClick={() => setActiveTab('concern')}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                activeTab === 'concern'
                  ? 'bg-surface-elevated text-text-primary shadow-sm ring-1 ring-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              By Concern
            </button>
            <button
              onClick={() => setActiveTab('career')}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                activeTab === 'career'
                  ? 'bg-surface-elevated text-text-primary shadow-sm ring-1 ring-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              By Career
            </button>
            <button
              onClick={() => setActiveTab('language')}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                activeTab === 'language'
                  ? 'bg-surface-elevated text-text-primary shadow-sm ring-1 ring-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              By Language
            </button>
          </div>

          {/* Chart Display */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeBreakdownData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="key"
                  stroke="#9fb3c8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18202c',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#f1f5f9',
                  }}
                  formatter={(val: any, _name: any, item: any) => [
                    `${val ?? 0} (${item?.payload?.percentage ?? 0}%)`,
                    'Escalations',
                  ]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {activeBreakdownData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PALETTE[index % PALETTE.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
