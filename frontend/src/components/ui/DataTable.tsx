import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  isLoading = false,
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-border/60 bg-background-card ${className}`}>
      <table className="w-full text-left text-sm text-text-primary border-collapse">
        <thead className="bg-white/[0.02] border-b border-border/50 text-xs text-text-muted font-medium">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 ${
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-text-secondary">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
                  <span>Loading table records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-text-secondary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-white/[0.02] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3 px-4 ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    } ${col.className || ''}`}
                  >
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
