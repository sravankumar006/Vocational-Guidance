import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { SentimentShiftAnalytics } from '@/types/admin';
import { HeartHandshake } from 'lucide-react';

interface SentimentShiftChartProps {
  data: SentimentShiftAnalytics;
  fullWidth?: boolean;
}

export const SentimentShiftChart: React.FC<SentimentShiftChartProps> = ({
  data,
  fullWidth = false,
}) => {
  if (!data.has_sentiment_data || data.total_events === 0) {
    return (
      <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
        <div className="mb-4 border-b border-border/40 pb-3">
          <h3 className="text-base font-semibold text-text-primary">
            Observed Sentiment Shift
          </h3>
          <p className="text-xs text-text-secondary">
            Observed sentiment before and after counselling
          </p>
        </div>
        <div className="flex h-56 flex-col items-center justify-center text-center">
          <HeartHandshake className="mb-2 h-8 w-8 text-text-muted/60" />
          <p className="text-sm font-medium text-text-secondary">
            No sentiment data available for this period.
          </p>
          <p className="mt-1 max-w-sm text-xs text-text-muted">
            Sentiment tracking events will appear here once session interactions are scored.
          </p>
        </div>
      </div>
    );
  }

  const hasBeforeAfter = data.can_compare ?? (data.has_before_data && data.has_after_data);
  const hasDuring = data.has_during_data && data.during?.is_available;

  // Transform comparison data for Recharts grouped bar chart
  let chartData: Array<{
    sentiment: string;
    'Before counselling': number;
    'During counselling'?: number;
    'After counselling': number;
  }> = [];

  if (data.comparison && data.comparison.length > 0) {
    chartData = data.comparison.map((item) => ({
      sentiment: item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1),
      'Before counselling': item.before_percentage,
      ...(hasDuring && item.during_percentage != null
        ? { 'During counselling': item.during_percentage }
        : {}),
      'After counselling': item.after_percentage,
    }));
  } else {
    // Fallback mapping from initial/final distributions
    const keys = ['positive', 'neutral', 'concerned', 'negative'];
    const totalInit = Object.values(data.initial_distribution).reduce((a, b) => a + b, 0) || 1;
    const totalFinal = Object.values(data.final_distribution).reduce((a, b) => a + b, 0) || 1;
    chartData = keys.map((k) => ({
      sentiment: k.charAt(0).toUpperCase() + k.slice(1),
      'Before counselling': Math.round(((data.initial_distribution[k] ?? 0) / totalInit) * 1000) / 10,
      'After counselling': Math.round(((data.final_distribution[k] ?? 0) / totalFinal) * 1000) / 10,
    }));
  }

  return (
    <div className={`flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm ${fullWidth ? 'w-full' : ''}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Observed Sentiment Shift
          </h3>
          <p className="text-xs text-text-secondary">
            {hasBeforeAfter
              ? 'Observed sentiment before and after counselling'
              : data.status_message || 'Observed sentiment distribution across recorded sessions'}
          </p>
        </div>

        {data.positive_shift_rate != null && hasBeforeAfter && (
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 border border-emerald-500/20">
            <span className="font-semibold">
              {data.positive_shift_rate >= 0 ? '+' : ''}
              {data.positive_shift_rate}%
            </span>
            <span>Observed Positive Shift</span>
          </div>
        )}
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="sentiment" stroke="#9fb3c8" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              unit="%"
              domain={[0, 'auto']}
            />
            <Tooltip
              formatter={(val: any) => [`${val}%`, '']}
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
            <Bar
              dataKey="Before counselling"
              name="Before counselling (%)"
              fill="#627d98"
              radius={[4, 4, 0, 0]}
            />
            {hasDuring && (
              <Bar
                dataKey="During counselling"
                name="During counselling (%)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            )}
            <Bar
              dataKey="After counselling"
              name="After counselling (%)"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Methodology Note (Section 12) */}
      <p className="mt-3 text-[11px] text-text-muted border-t border-border/30 pt-2 leading-relaxed">
        {data.methodology_note ||
          'Observed sentiment is based on recorded sentiment events. It describes patterns in the available data and does not establish that counselling caused a change in sentiment.'}
      </p>
    </div>
  );
};

