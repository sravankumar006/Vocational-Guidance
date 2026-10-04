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
  AreaChart,
  Area,
} from 'recharts';
import type { ParentConcernsAnalytics } from '@/types/admin';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  Layers,
  Clock,
  Briefcase,
  GraduationCap,
  Users,
  MapPin,
  HeartPulse,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

interface ParentConcernsChartProps {
  data: ParentConcernsAnalytics;
  fullWidth?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Income': <DollarSign className="h-4 w-4 text-emerald-400" />,
  'Job Security': <ShieldAlert className="h-4 w-4 text-blue-400" />,
  'Further Education': <GraduationCap className="h-4 w-4 text-indigo-400" />,
  'Social Perception': <Users className="h-4 w-4 text-purple-400" />,
  'Distance': <MapPin className="h-4 w-4 text-amber-400" />,
  'Working Conditions': <HeartPulse className="h-4 w-4 text-rose-400" />,
  'Career Growth': <Briefcase className="h-4 w-4 text-teal-400" />,
  'Other': <HelpCircle className="h-4 w-4 text-slate-400" />,
};

const BAR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#64748b', // slate
];

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981',
};

const STATUS_COLORS: Record<string, string> = {
  RESOLVED: '#10b981',
  ADDRESSED: '#3b82f6',
  OPEN: '#f59e0b',
};

export const ParentConcernsChart: React.FC<ParentConcernsChartProps> = ({
  data,
  fullWidth = false,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'trends' | 'severity_status'>('categories');
  const hasConcerns = data.total_concerns > 0;

  // Canonical order matching A3 specifications
  const canonicalOrder = [
    'Income',
    'Job Security',
    'Further Education',
    'Social Perception',
    'Distance',
    'Working Conditions',
    'Career Growth',
    'Other',
  ];

  const sortedCategories = [...(data.categories || [])].sort((a, b) => {
    const idxA = canonicalOrder.indexOf(a.category);
    const idxB = canonicalOrder.indexOf(b.category);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return b.count - a.count;
  });

  return (
    <div className={`flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm ${fullWidth ? 'w-full' : ''}`}>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">
              Parent Concern Analytics
            </h3>
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-300 ring-1 ring-inset ring-brand-500/20">
              A3 Spec
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Aggregated empirical concerns across vocational resistance categories
          </p>
        </div>

        {/* View Switcher Tabs */}
        {hasConcerns && (
          <div className="flex items-center rounded-lg border border-border/60 bg-surface-elevated p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Categories</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                activeTab === 'trends'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('severity_status')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                activeTab === 'severity_status'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Severity & Status</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Highlight Badges */}
      <div className="grid grid-cols-2 gap-2.5 pb-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border/50 bg-surface-elevated/40 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-text-secondary">Total Logged</span>
            <ShieldAlert className="h-3.5 w-3.5 text-brand-300" />
          </div>
          <div className="mt-1 text-lg font-bold text-text-primary">
            {data.total_concerns}
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-surface-elevated/40 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-text-secondary">Highest Area</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-1 text-sm font-bold text-text-primary truncate">
            {data.highest_concern || 'None'}
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-surface-elevated/40 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-text-secondary">High Severity</span>
            <span className="text-[10px] font-semibold text-rose-400">
              {data.total_concerns > 0 ? Math.round(((data.high_severity_count || 0) / data.total_concerns) * 100) : 0}%
            </span>
          </div>
          <div className="mt-1 text-lg font-bold text-rose-400">
            {data.high_severity_count || 0}
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-surface-elevated/40 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-text-secondary">Resolution Rate</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 text-lg font-bold text-emerald-400">
            {data.resolution_rate != null ? `${data.resolution_rate}%` : '0%'}
          </div>
        </div>
      </div>

      {!hasConcerns ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-text-secondary">
            No parent concerns match the current filter criteria.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Try adjusting the date period, severity, or concern area filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TAB 1: Categories Breakdown */}
          {activeTab === 'categories' && (
            <div>
              <div className="h-80 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedCategories}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#6b7280"
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke="#9fb3c8"
                      fontSize={11}
                      tickLine={false}
                      width={105}
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
                        `${val ?? 0} concerns (${item?.payload?.percentage ?? 0}%)`,
                        'Count',
                      ]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {sortedCategories.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BAR_COLORS[index % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 7 Required Canonical Category Cards */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 border-t border-border/40 pt-4">
                {sortedCategories.map((c) => (
                  <div
                    key={c.category}
                    className="flex flex-col justify-between rounded-lg border border-border/40 bg-surface-elevated/40 p-2.5 transition-colors hover:border-border/80"
                  >
                    <div className="flex items-center gap-1.5">
                      {CATEGORY_ICONS[c.category] || <HelpCircle className="h-4 w-4 text-slate-400" />}
                      <span className="text-xs font-medium text-text-secondary truncate">
                        {c.category}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-base font-bold text-text-primary">{c.count}</span>
                      <span className="text-xs font-semibold text-text-muted">
                        {c.percentage}%
                      </span>
                    </div>
                    {/* Visual proportion bar */}
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-base">
                      <div
                        className="h-full rounded-full bg-brand-400"
                        style={{ width: `${Math.min(100, c.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Timeline Trends */}
          {activeTab === 'trends' && (
            <div className="space-y-4">
              {data.trends && data.trends.length > 0 ? (
                <div className="h-80 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.trends}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="concernTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        fontSize={11}
                        tickLine={false}
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
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Total Concerns"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#concernTrendGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <Clock className="h-8 w-8 text-text-muted mb-2" />
                  <p className="text-sm font-medium text-text-secondary">
                    No trend history points recorded for this date range.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Severity & Status Breakdowns */}
          {activeTab === 'severity_status' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2">
              {/* Severity Breakdown */}
              <div className="rounded-lg border border-border/50 bg-surface-elevated/30 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Severity Distribution
                </h4>
                <div className="space-y-3">
                  {(data.by_severity && data.by_severity.length > 0
                    ? data.by_severity
                    : [
                        { severity: 'HIGH', count: 0, percentage: 0 },
                        { severity: 'MEDIUM', count: 0, percentage: 0 },
                        { severity: 'LOW', count: 0, percentage: 0 },
                      ]
                  ).map((item) => (
                    <div key={item.severity} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-text-secondary">
                          {item.severity}
                        </span>
                        <span className="font-semibold text-text-primary">
                          {item.count}{' '}
                          <span className="text-text-muted font-normal">
                            ({item.percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-base">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, item.percentage)}%`,
                            backgroundColor: SEVERITY_COLORS[item.severity] || '#64748b',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="rounded-lg border border-border/50 bg-surface-elevated/30 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Resolution Status Distribution
                </h4>
                <div className="space-y-3">
                  {(data.by_status && data.by_status.length > 0
                    ? data.by_status
                    : [
                        { status: 'OPEN', count: 0, percentage: 0 },
                        { status: 'ADDRESSED', count: 0, percentage: 0 },
                        { status: 'RESOLVED', count: 0, percentage: 0 },
                      ]
                  ).map((item) => (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-text-secondary">
                          {item.status}
                        </span>
                        <span className="font-semibold text-text-primary">
                          {item.count}{' '}
                          <span className="text-text-muted font-normal">
                            ({item.percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-base">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, item.percentage)}%`,
                            backgroundColor: STATUS_COLORS[item.status] || '#64748b',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
