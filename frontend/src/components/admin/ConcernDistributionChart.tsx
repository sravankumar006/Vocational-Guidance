import React from 'react';
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
import type { ConcernCategoryItem } from '@/types/admin';
import {
  DollarSign,
  ShieldAlert,
  GraduationCap,
  Users,
  MapPin,
  HeartPulse,
  Briefcase,
  HelpCircle,
  BarChart2,
} from 'lucide-react';

interface ConcernDistributionChartProps {
  categories: ConcernCategoryItem[];
  total: number;
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

const CANONICAL_ORDER = [
  'Income',
  'Job Security',
  'Further Education',
  'Social Perception',
  'Distance',
  'Working Conditions',
  'Career Growth',
  'Other',
];

export const ConcernDistributionChart: React.FC<ConcernDistributionChartProps> = ({
  categories,
  total,
}) => {
  // Sort canonical categories in the required order while preserving any extra non-canonical categories
  const sortedCategories = [...categories].sort((a, b) => {
    const idxA = CANONICAL_ORDER.indexOf(a.category);
    const idxB = CANONICAL_ORDER.indexOf(b.category);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return b.count - a.count;
  });

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-brand-400" />
            <h3 className="text-base font-semibold text-text-primary">
              Concern Category Distribution
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            Horizontal distribution across the seven canonical vocational objection areas
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className="font-semibold text-text-primary">{total}</span>
          <span>total recorded concerns</span>
        </div>
      </div>

      {/* Horizontal Bar Chart for maximum category label legibility */}
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
                'Frequency',
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

      {/* Responsive Category Grid with exact counts and calculated percentages */}
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
  );
};
