import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { GeographicLocationItem } from '@/types/admin';
import { Building2 } from 'lucide-react';

interface StateDistributionChartProps {
  data: GeographicLocationItem[];
  total: number;
}

export const StateDistributionChart: React.FC<StateDistributionChartProps> = ({
  data,
  total,
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  const chartData = data.map((item) => ({
    name: item.location,
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-text-primary">
            State Distribution
          </h3>
        </div>
        <span className="text-xs text-text-muted">
          {total} events across {data.length} states
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis
              type="number"
              stroke="#9fb3c8"
              fontSize={11}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#9fb3c8"
              fontSize={11}
              tickLine={false}
              width={100}
            />
            <Tooltip
              formatter={(val: any, _name: any, item: any) => [
                `${val} activities (${item.payload.percentage}%)`,
                'State Activity',
              ]}
              contentStyle={{
                backgroundColor: '#18202c',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#f1f5f9',
              }}
            />
            <Bar
              dataKey="count"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown list */}
      <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
        {data.slice(0, 5).map((st) => (
          <div key={st.location} className="flex items-center justify-between text-xs">
            <span className="font-medium text-text-secondary">{st.location}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">{st.count}</span>
              <span className="text-text-muted w-12 text-right">({st.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
