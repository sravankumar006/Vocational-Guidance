import React, { useState } from 'react';
import type { DataTabKey, ImportCsvResponse } from '@/types/adminData';
import { adminDataService } from '@/services/adminDataService';
import { Button } from '@/components/ui/Button';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: DataTabKey;
  onImportSuccess: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onImportSuccess,
}) => {
  const [csvText, setCsvText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportCsvResponse | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text || '');
    };
    reader.onerror = () => {
      setError('Failed to read file. Please ensure it is a valid text/CSV file.');
    };
    reader.readAsText(file);
  };

  const getTemplateHint = (): string => {
    switch (activeTab) {
      case 'courses':
        return 'Required: name\nOptional: sector, qualification_level, duration, delivery_mode, provider_id, data_source_id, description, status (demo/unverified)';
      case 'occupations':
        return 'Required: name\nOptional: sector, description, required_education, skill_keywords, data_source_id, status (demo/unverified)';
      case 'providers':
        return 'Required: name\nOptional: provider_type, location, website, contact_email, contact_phone, accreditation_status, status';
      case 'outcomes':
        return 'Required: occupation_id\nOptional: region, salary_range_min, salary_range_max, employment_rate, experience_level, data_source_id, status';
      case 'career-paths':
        return 'Required: name\nOptional: sector, description, entry_level_qualification, status';
      case 'sources':
        return 'Required: name\nOptional: source_type, url, description, version, status';
    }
  };

  const handleSubmit = async () => {
    if (!csvText.trim()) {
      setError('Please choose a CSV file or paste CSV content.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await adminDataService.importCsv(activeTab, csvText);
      setResult(res);
      if (res.records_imported > 0) {
        onImportSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'CSV import failed. Please verify column formatting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCsvText('');
    setFileName(null);
    setError(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Import CSV — {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <p className="text-xs text-text-muted">
                Imported records default to <span className="font-semibold text-amber-400">Demo</span> or{' '}
                <span className="font-semibold text-text-secondary">Unverified</span> status. Never automatically verified.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* File Picker */}
          <div className="border border-dashed border-border rounded-xl p-5 text-center bg-surface hover:bg-surface-elevated/40 transition-colors">
            <Upload className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-60" />
            <label className="cursor-pointer">
              <span className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                Browse CSV File
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {fileName && (
              <p className="mt-2 text-xs font-mono text-emerald-400 font-medium">
                Selected: {fileName}
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-text-muted">
              Supports standard UTF-8 CSV files with header row
            </p>
          </div>

          {/* Or Paste Raw Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-text-muted">
              <label className="font-medium text-[11px] uppercase tracking-wider">
                Or Paste CSV Content
              </label>
              {csvText && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-text-muted hover:text-text-primary"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setError(null);
                setResult(null);
              }}
              rows={5}
              placeholder="Paste comma-separated rows with column headers here..."
              className="w-full rounded-lg border border-border bg-surface-elevated/50 p-2.5 font-mono text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Schema hints */}
          <div className="p-3 bg-surface-elevated/40 rounded-lg border border-border/70 space-y-1">
            <span className="font-semibold text-text-primary block text-[11px]">
              Expected Column Schema for {activeTab}:
            </span>
            <pre className="text-[10px] font-mono text-text-muted whitespace-pre-wrap leading-relaxed">
              {getTemplateHint()}
            </pre>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Summary */}
          {result && (
            <div className="space-y-2 p-3.5 rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-2 font-semibold text-xs text-text-primary">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Import Analysis Completed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-base font-bold text-emerald-400">{result.records_imported}</div>
                  <div className="text-[10px] text-emerald-300 font-medium">Records Imported</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <div className="text-base font-bold text-rose-400">{result.records_rejected}</div>
                  <div className="text-[10px] text-rose-300 font-medium">Records Rejected</div>
                </div>
              </div>

              {result.validation_errors.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Validation Errors:
                  </span>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-[10px] text-text-secondary max-h-28 overflow-y-auto font-mono">
                    {result.validation_errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated/30 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !csvText.trim()}
              className="bg-brand-600 hover:bg-brand-500 text-white font-medium gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Validating & Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Start Import</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
