import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { CounsellingVolumeAnalytics } from '@/types/admin';
import { MessageSquareQuote, MessagesSquare } from 'lucide-react';

interface CounsellingVolumeChartProps {
  data: CounsellingVolumeAnalytics;
}

export const CounsellingVolumeChart: React.FC<CounsellingVolumeChartProps> = ({
  data,
}) => {
  const hasTrends = data.activity_trends && data.activity_trends.length > 0;

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Counselling Activity Volume
          </h3>
          <p className="text-xs text-text-secondary">
            Aggregated session starts and message exchanges over time
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <MessageSquareQuote className="h-4 w-4 text-brand-400" />
            <span className="font-semibold text-text-primary">
              {data.total_sessions}
            </span>
            <span>Sessions</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <MessagesSquare className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-text-primary">
              {data.total_messages}
            </span>
            <span>Messages</span>
          </div>
        </div>
      </div>

      {!hasTrends || (data.total_sessions === 0 && data.total_messages === 0) ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-text-secondary">
            No counselling activity data for this period.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            New session activity will chart dynamically here.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.activity_trends}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="sessionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#829ab1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#829ab1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="msgFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val: string) => {
                  if (!val) return '';
                  const parts = val.split('-');
                  return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val;
                }}
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
                labelStyle={{ fontWeight: 600, color: '#9fb3c8', marginBottom: '0.25rem' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '0.75rem', paddingBottom: '0.5rem' }}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="#829ab1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#sessionFill)"
              />
              <Area
                type="monotone"
                dataKey="messages"
                name="Messages"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#msgFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
