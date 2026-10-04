import React from 'react';
import type { SentimentComparisonItem } from '@/types/admin';

interface SentimentComparisonTableProps {
  comparison: SentimentComparisonItem[];
  hasDuringData: boolean;
  canCompare: boolean;
}

const SENTIMENT_COLORS: Record<string, { badge: string; text: string }> = {
  positive: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', text: 'text-emerald-400' },
  neutral: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', text: 'text-blue-400' },
  concerned: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', text: 'text-amber-400' },
  negative: { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', text: 'text-rose-400' },
};

export const SentimentComparisonTable: React.FC<SentimentComparisonTableProps> = ({
  comparison,
  hasDuringData,
  canCompare,
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-surface-base/80 shadow-sm">
      <div className="border-b border-border/40 p-4">
        <h3 className="text-sm font-semibold tracking-tight text-text-primary">
          Observed Sentiment Breakdown by Counselling Stage
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Detailed counts and percentage distributions across recorded interaction stages
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-elevated/80 text-text-muted uppercase tracking-wider text-[11px] border-b border-border/40">
            <tr>
              <th className="py-3 px-4 font-semibold">Sentiment Category</th>
              <th className="py-3 px-4 font-semibold text-right">Before Counselling</th>
              {hasDuringData && (
                <th className="py-3 px-4 font-semibold text-right">During Counselling</th>
              )}
              <th className="py-3 px-4 font-semibold text-right">After Counselling</th>
              <th className="py-3 px-4 font-semibold text-right">Observed Shift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {comparison.map((item) => {
              const styles = SENTIMENT_COLORS[item.sentiment.toLowerCase()] || {
                badge: 'bg-surface-elevated text-text-secondary border-border',
                text: 'text-text-primary',
              };

              return (
                <tr key={item.sentiment} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles.badge}`}
                    >
                      {item.sentiment}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-text-primary">{item.before_count}</span>
                    <span className="ml-1.5 text-text-muted">({item.before_percentage}%)</span>
                  </td>
                  {hasDuringData && (
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-text-primary">{item.during_count ?? 0}</span>
                      <span className="ml-1.5 text-text-muted">
                        ({item.during_percentage != null ? `${item.during_percentage}%` : 'N/A'})
                      </span>
                    </td>
                  )}
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-text-primary">{item.after_count}</span>
                    <span className="ml-1.5 text-text-muted">({item.after_percentage}%)</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canCompare && item.change_percentage != null ? (
                      <span
                        className={`font-semibold ${
                          item.change_percentage > 0
                            ? item.sentiment === 'positive'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                            : item.change_percentage < 0
                            ? item.sentiment === 'positive'
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                            : 'text-text-muted'
                        }`}
                      >
                        {item.change_percentage > 0 ? '+' : ''}
                        {item.change_percentage}%
                      </span>
                    ) : (
                      <span className="text-text-muted italic">Unavailable</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
