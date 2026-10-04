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
import { MapPin, Info } from 'lucide-react';

interface GeographicConcentrationChartProps {
  data: GeographicLocationItem[];
  total: number;
  selectedState?: string | null;
  selectedCareer?: string | null;
  selectedConcern?: string | null;
}

export const GeographicConcentrationChart: React.FC<GeographicConcentrationChartProps> = ({
  data,
  total,
  selectedState,
  selectedCareer,
  selectedConcern,
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Take top 10 for clean readability
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.location,
    activity: item.count,
    percentage: item.percentage,
  }));

  const dynamicSubtitle = () => {
    const parts = [];
    if (selectedState) parts.push(`in ${selectedState}`);
    if (selectedCareer) parts.push(`for ${selectedCareer}`);
    if (selectedConcern) parts.push(`addressing ${selectedConcern}`);
    return parts.length > 0 ? parts.join(' ') : 'across all monitored regions';
  };

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-400" />
            <h3 className="text-base font-semibold text-text-primary">
              Geographic Concentration
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            Ranked observed activity {dynamicSubtitle()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-xs font-medium text-text-muted border border-border/70">
            Top {chartData.length} Districts
          </span>
          <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-300 border border-brand-500/20">
            {total} Total Observed Events
          </span>
        </div>
      </div>

      {/* Main Ranked Horizontal Bar Chart */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
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
              fontSize={12}
              tickLine={false}
              width={110}
            />
            <Tooltip
              formatter={(val: any, _name: any, item: any) => [
                `${val} activities (${item.payload.percentage}%)`,
                'Observed Activity',
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
              dataKey="activity"
              fill="#38bdf8"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-border/30 pt-2 text-[11px] text-text-muted">
        <Info className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <span>
          Ranking reflects recorded counselling sessions and parent-concern inquiries in the generated development dataset.
        </span>
      </div>
    </div>
  );
};
