import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { AIPerformanceTrendPoint } from '@/types/admin';
import { TrendingUp } from 'lucide-react';

interface AIPerformanceTrendProps {
  trend: AIPerformanceTrendPoint[];
}

export const AIPerformanceTrend: React.FC<AIPerformanceTrendProps> = ({ trend }) => {
  if (!trend || trend.length === 0) {
    return null;
  }

  const chartData = trend.map((p) => {
    let displayDate = p.date;
    try {
      const parts = p.date.split('-');
      if (parts.length === 3) {
        displayDate = `${parts[1]}/${parts[2]}`;
      }
    } catch {
      // keep raw date
    }

    return {
      rawDate: p.date,
      displayDate,
      'Total Sessions': p.total_sessions,
      'Resolved Automatically': p.resolved,
      'Escalated to Human': p.escalated,
      'Low Confidence': p.low_confidence,
      'Unanswered Inquiries': p.unanswered ?? p.escalated,
    };
  });

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            AI Performance Over Time
          </h3>
        </div>
        <span className="text-xs text-text-muted">
          {trend.length} Dates Recorded
        </span>
      </div>

      <div className="h-72 w-full pt-1">
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
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '0.75rem', paddingBottom: '0.5rem' }}
            />
            <Line
              type="monotone"
              dataKey="Total Sessions"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 2.5 }}
            />
            <Line
              type="monotone"
              dataKey="Resolved Automatically"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 2.5 }}
            />
            <Line
              type="monotone"
              dataKey="Escalated to Human"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 2.5 }}
            />
            <Line
              type="monotone"
              dataKey="Low Confidence"
              stroke="#a855f7"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 2 }}
            />
            <Line
              type="monotone"
              dataKey="Unanswered Inquiries"
              stroke="#ec4899"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
