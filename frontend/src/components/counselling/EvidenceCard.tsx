import React from 'react';
import { ShieldCheck, BookOpen, ExternalLink } from 'lucide-react';
import type { CounsellingEvidenceItem } from '@/types/counselling';

interface EvidenceCardProps {
  evidence: CounsellingEvidenceItem[];
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  if (!evidence || evidence.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-slate-600" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          Verified Evidence Citations ({evidence.length})
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evidence.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-2"
          >
            <div>
              {/* Type Badge & Verified Status */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {item.type || 'Knowledge Item'}
                </span>

                {item.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h5 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1">
                {item.title}
              </h5>

              {/* Content Snippet */}
              <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                {item.content}
              </p>
            </div>

            {/* Source & Link */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate max-w-[200px]" title={item.source}>
                {item.source}
              </span>
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-slate-700 hover:text-slate-900 font-medium ml-1"
                >
                  <span>Ref</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
