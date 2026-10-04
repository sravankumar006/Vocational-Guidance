import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface CounsellingErrorProps {
  message: string;
  onRetry?: () => void;
}

export const CounsellingError: React.FC<CounsellingErrorProps> = ({
  message,
  onRetry,
}) => {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 shadow-sm flex items-start justify-between gap-3 my-2">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-rose-900 leading-relaxed">
          <span className="font-semibold">Unable to complete request: </span>
          <span>{message}</span>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 active:scale-95 transition-all shadow-2xs"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
