import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { ConcernTrendItem } from '@/types/admin';
import { TrendingUp, Clock } from 'lucide-react';

interface ConcernTrendChartProps {
  trend: ConcernTrendItem[];
  dateRange: string;
}

export const ConcernTrendChart: React.FC<ConcernTrendChartProps> = ({
  trend,
  dateRange,
}) => {
  const hasData = trend && trend.length > 0;

  const getAggregationLabel = (range: string) => {
    switch (range) {
      case '7d':
        return 'Daily granularity (Last 7 Days)';
      case '30d':
        return 'Daily granularity (Last 30 Days)';
      case '90d':
        return 'Weekly aggregated buckets (Last 90 Days)';
      case 'year':
        return 'Monthly aggregated progression (This Year)';
      case 'all':
        return 'Monthly historical progression (All Time)';
      default:
        return 'Aggregated chronological trend';
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-400" />
            <h3 className="text-base font-semibold text-text-primary">
              Concern Trends Over Time
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            {getAggregationLabel(dateRange)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5 text-brand-300" />
          <span>{trend.length} time points</span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <Clock className="h-8 w-8 text-text-muted mb-2" />
          <p className="text-sm font-medium text-text-secondary">
            No trend data recorded for the selected period.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            New parent objections submitted during this interval will populate here.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="concernTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="period"
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
                formatter={(val: any) => [`${val ?? 0} concerns`, 'Total Objections']}
                labelFormatter={(label: any) => `Period: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Concerns"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#concernTrendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
