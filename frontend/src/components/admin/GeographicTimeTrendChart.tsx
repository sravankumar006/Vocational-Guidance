import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { GeographicTrendPoint } from '@/types/admin';
import { TrendingUp } from 'lucide-react';

interface GeographicTimeTrendChartProps {
  trend: GeographicTrendPoint[];
  dateRange: string;
}

export const GeographicTimeTrendChart: React.FC<GeographicTimeTrendChartProps> = ({
  trend,
  dateRange,
}) => {
  if (!trend || trend.length === 0) {
    return null;
  }

  // Format date display for XAxis
  const chartData = trend.map((p) => {
    let formattedDate = p.date;
    try {
      const parts = p.date.split('-');
      if (parts.length === 3) {
        formattedDate = `${parts[1]}/${parts[2]}`;
      }
    } catch {
      // keep raw date
    }
    return {
      rawDate: p.date,
      displayDate: formattedDate,
      count: p.count,
    };
  });

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            Observed Geographic Activity Over Time
          </h3>
        </div>
        <span className="text-xs text-text-muted">
          {chartData.length} Time Points Recorded ({dateRange})
        </span>
      </div>

      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#9fb3c8"
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
              formatter={(val: any) => [`${val} activities`, 'Recorded Activity']}
              labelFormatter={(_label, payload) => {
                if (payload && payload.length > 0) {
                  return `Date: ${payload[0].payload.rawDate}`;
                }
                return '';
              }}
              contentStyle={{
                backgroundColor: '#18202c',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#f1f5f9',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 3, fill: '#38bdf8' }}
              activeDot={{ r: 5, fill: '#0284c7' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
