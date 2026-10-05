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
import { Compass } from 'lucide-react';

interface DistrictDistributionChartProps {
  data: GeographicLocationItem[];
  selectedState?: string | null;
}

export const DistrictDistributionChart: React.FC<DistrictDistributionChartProps> = ({
  data,
  selectedState,
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Cap at 8 for height balance with State/Region charts
  const chartData = data.slice(0, 8).map((item) => ({
    name: item.location,
    count: item.count,
    percentage: item.percentage,
  }));

  const title = selectedState
    ? `District Breakdown (${selectedState})`
    : 'Top Districts Observed';

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface-base/80 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        <span className="text-xs text-text-muted">
          {data.length} Districts Available
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
                'District Activity',
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
              fill="#38bdf8"
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* District Drilldown Table */}
      <div className="mt-4 border-t border-border/40 pt-3">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          District Drilldown Telemetry
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-[11px] font-semibold text-text-muted uppercase">
                <th className="py-2 pr-3">District</th>
                <th className="py-2 px-2 text-right">Sessions</th>
                <th className="py-2 px-2 text-right">Concerns</th>
                <th className="py-2 px-2 text-right">Escalations</th>
                <th className="py-2 px-2 text-right">AI Resolution</th>
                <th className="py-2 pl-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.slice(0, 10).map((dist) => (
                <tr key={dist.location} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-2 pr-3 font-medium text-text-primary whitespace-nowrap">
                    {dist.location}
                  </td>
                  <td className="py-2 px-2 text-right text-text-secondary">
                    {dist.sessions ?? '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-amber-400 font-medium">
                    {dist.concerns ?? '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-rose-400 font-medium">
                    {dist.escalations ?? '—'}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className={`font-semibold ${
                      (dist.ai_resolution_rate ?? 0) >= 75
                        ? 'text-emerald-400'
                        : (dist.ai_resolution_rate ?? 0) >= 50
                        ? 'text-amber-400'
                        : 'text-text-secondary'
                    }`}>
                      {dist.ai_resolution_rate !== undefined ? `${dist.ai_resolution_rate}%` : '—'}
                    </span>
                  </td>
                  <td className="py-2 pl-3 text-right font-semibold text-sky-400">
                    {dist.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
