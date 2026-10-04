import React from 'react';
import { Landmark, ExternalLink } from 'lucide-react';
import type { CounsellingSourceItem } from '@/types/counselling';

interface SourcesListProps {
  sources: CounsellingSourceItem[];
}

export const SourcesList: React.FC<SourcesListProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3.5 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <Landmark className="w-3.5 h-3.5 text-slate-500" />
        <span>Authoritative Statutory Sources:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((src, idx) => (
          <div
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs"
          >
            <span className="font-medium text-slate-900">{src.source}</span>
            {src.title && <span className="text-slate-500">• {src.title}</span>}
            {src.url && (
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 hover:text-slate-950 inline-flex items-center ml-0.5"
                title={`Open official reference from ${src.source}`}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
