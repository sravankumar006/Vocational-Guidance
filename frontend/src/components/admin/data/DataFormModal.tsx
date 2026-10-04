import React, { useState, useEffect } from 'react';
import type { DataTabKey, DataOptionsResponse } from '@/types/adminData';
import { Button } from '@/components/ui/Button';
import { X, Save, RefreshCw } from 'lucide-react';

interface DataFormModalProps {
  isOpen: boolean;
  tab: DataTabKey;
  initialData?: Record<string, any> | null;
  options: DataOptionsResponse | null;
  isLoading: boolean;
  onSave: (payload: Record<string, any>) => Promise<void>;
  onClose: () => void;
}

export const DataFormModal: React.FC<DataFormModalProps> = ({
  isOpen,
  tab,
  initialData,
  options,
  isLoading,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      // Default blank values
      const defaults: Record<string, any> = {
        status: 'unverified',
      };
      if (tab === 'courses') {
        defaults.qualification_level = 'NSQF Level 4';
        defaults.delivery_mode = 'Classroom / Practical';
      } else if (tab === 'outcomes') {
        defaults.salary_currency = 'INR';
      }
      setFormData(defaults);
    }
    setErrors({});
  }, [initialData, tab, isOpen]);

  if (!isOpen) return null;

  const isEdit = Boolean(initialData?.id);

  const getTitle = () => {
    const action = isEdit ? 'Edit' : 'Add New';
    switch (tab) {
      case 'courses': return `${action} Course`;
      case 'occupations': return `${action} Occupation`;
      case 'providers': return `${action} Training Provider`;
      case 'outcomes': return `${action} Job Outcome`;
      case 'career-paths': return `${action} Career Path`;
      case 'sources': return `${action} Data Source`;
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (tab !== 'outcomes' && (!formData.name || !formData.name.trim())) {
      errs.name = 'Name is required (min 2 characters)';
    }

    if (tab === 'outcomes') {
      if (formData.employment_rate !== undefined && formData.employment_rate !== '') {
        const rate = parseFloat(formData.employment_rate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          errs.employment_rate = 'Placement rate must be between 0 and 100%';
        }
      }
      if (formData.salary_range_min && formData.salary_range_max) {
        if (parseInt(formData.salary_range_max) < parseInt(formData.salary_range_min)) {
          errs.salary_range_max = 'Max salary cannot be less than min salary';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Convert numbers
    const payload = { ...formData };
    if (payload.provider_id) payload.provider_id = parseInt(payload.provider_id);
    if (payload.data_source_id) payload.data_source_id = parseInt(payload.data_source_id);
    if (payload.occupation_id) payload.occupation_id = parseInt(payload.occupation_id);
    if (payload.career_path_id) payload.career_path_id = parseInt(payload.career_path_id);
    if (payload.employment_rate !== undefined && payload.employment_rate !== '') {
      payload.employment_rate = parseFloat(payload.employment_rate);
    }
    if (payload.salary_range_min !== undefined && payload.salary_range_min !== '') {
      payload.salary_range_min = parseInt(payload.salary_range_min);
    }
    if (payload.salary_range_max !== undefined && payload.salary_range_max !== '') {
      payload.salary_range_max = parseInt(payload.salary_range_max);
    }

    await onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-surface-elevated shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-surface">
          <div>
            <h2 className="text-base font-bold text-text-primary">{getTitle()}</h2>
            <p className="text-xs text-text-muted">
              {isEdit ? 'Update existing vocational catalog entity.' : 'Register a new catalog record for RAG knowledge.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          {/* General Fields: Name (if not outcome) */}
          {tab !== 'outcomes' && (
            <div className="space-y-1">
              <label className="font-medium text-text-secondary">
                Title / Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Solar PV Installation Technician"
                className={`w-full rounded-lg border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                  errors.name ? 'border-rose-500' : 'border-border'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-400">{errors.name}</p>}
            </div>
          )}

          {/* Sector (Courses / Occupations) */}
          {(tab === 'courses' || tab === 'occupations') && (
            <div className="space-y-1">
              <label className="font-medium text-text-secondary">Sector / Industry</label>
              <input
                type="text"
                list="sector-options"
                value={formData.sector || ''}
                onChange={(e) => handleChange('sector', e.target.value)}
                placeholder="e.g. Renewable Energy, Automotive, Electronics"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <datalist id="sector-options">
                {options?.sectors.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          )}

          {/* Courses specifics: Duration, NSQF, Mode, Provider */}
          {tab === 'courses' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-text-secondary">NSQF / Qualification Level</label>
                <input
                  type="text"
                  value={formData.qualification_level || ''}
                  onChange={(e) => handleChange('qualification_level', e.target.value)}
                  placeholder="e.g. NSQF Level 4"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-text-secondary">Duration</label>
                <input
                  type="text"
                  value={formData.duration || ''}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="e.g. 6 Months / 600 Hours"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-text-secondary">Delivery Mode</label>
                <input
                  type="text"
                  value={formData.delivery_mode || ''}
                  onChange={(e) => handleChange('delivery_mode', e.target.value)}
                  placeholder="e.g. Classroom / Practical Workshop"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-text-secondary">Training Provider</label>
                <select
                  value={formData.provider_id || ''}
                  onChange={(e) => handleChange('provider_id', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Select Training Provider...</option>
                  {options?.providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.extra ? `(${p.extra})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Providers specifics: Location & Type */}
          {tab === 'providers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-text-secondary">Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="e.g. Hyderabad, Telangana"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-text-secondary">Provider Type</label>
                <input
                  type="text"
                  value={formData.provider_type || ''}
                  onChange={(e) => handleChange('provider_type', e.target.value)}
                  placeholder="e.g. Government ITI, Private Center"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* Outcomes specifics: Occupation, Region, Salary, Placement */}
          {tab === 'outcomes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-text-secondary">Related Occupation</label>
                  <select
                    value={formData.occupation_id || ''}
                    onChange={(e) => handleChange('occupation_id', e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Select Occupation...</option>
                    {options?.occupations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-text-secondary">Geographic Region</label>
                  <input
                    type="text"
                    value={formData.region || ''}
                    onChange={(e) => handleChange('region', e.target.value)}
                    placeholder="e.g. Hyderabad, Telangana or National"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-text-secondary">Min Salary (₹/mo)</label>
                  <input
                    type="number"
                    value={formData.salary_range_min || ''}
                    onChange={(e) => handleChange('salary_range_min', e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-text-secondary">Max Salary (₹/mo)</label>
                  <input
                    type="number"
                    value={formData.salary_range_max || ''}
                    onChange={(e) => handleChange('salary_range_max', e.target.value)}
                    placeholder="e.g. 35000"
                    className={`w-full rounded-lg border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                      errors.salary_range_max ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.salary_range_max && <p className="text-[11px] text-rose-400">{errors.salary_range_max}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-text-secondary">Placement Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.employment_rate || ''}
                    onChange={(e) => handleChange('employment_rate', e.target.value)}
                    placeholder="e.g. 82.5"
                    className={`w-full rounded-lg border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                      errors.employment_rate ? 'border-rose-500' : 'border-border'
                    }`}
                  />
                  {errors.employment_rate && <p className="text-[11px] text-rose-400">{errors.employment_rate}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Sources specifics: Type, URL, Version */}
          {tab === 'sources' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-text-secondary">Source Type / Authority</label>
                <input
                  type="text"
                  value={formData.source_type || ''}
                  onChange={(e) => handleChange('source_type', e.target.value)}
                  placeholder="e.g. NCVET Official Portal / DGT Registry"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-text-secondary">Version</label>
                <input
                  type="text"
                  value={formData.version || ''}
                  onChange={(e) => handleChange('version', e.target.value)}
                  placeholder="e.g. 2026.1"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-medium text-text-secondary">URL / Reference</label>
                <input
                  type="url"
                  value={formData.url || ''}
                  onChange={(e) => handleChange('url', e.target.value)}
                  placeholder="https://ncvet.gov.in/..."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* Description */}
          {tab !== 'outcomes' && (
            <div className="space-y-1">
              <label className="font-medium text-text-secondary">Description</label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Comprehensive details regarding this vocational entry..."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
              />
            </div>
          )}

          {/* Linked Data Source (for Courses, Occupations, Providers, Outcomes, Career Paths) */}
          {tab !== 'sources' && (
            <div className="space-y-1 pt-2 border-t border-border/40">
              <label className="font-medium text-text-secondary flex items-center gap-1.5">
                <span>Associated Data Source</span>
                <span className="text-[11px] text-text-muted">(Required for Verification)</span>
              </label>
              <select
                value={formData.data_source_id || ''}
                onChange={(e) => handleChange('data_source_id', e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">None (Unlinked)</option>
                {options?.sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.extra ? `[${s.extra}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Initial Status */}
          <div className="space-y-1 pt-2">
            <label className="font-medium text-text-secondary">Record Status</label>
            <select
              value={formData.status || 'unverified'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="demo">Demo / Generated (Development)</option>
              <option value="unverified">Unverified (Pending Admin Review)</option>
              <option value="verified">Verified (Authoritative for RAG)</option>
              <option value="inactive">Inactive (Excluded from RAG)</option>
            </select>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="border-border/80 text-text-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="bg-brand-600 hover:bg-brand-500 text-white font-medium gap-1.5"
            >
              {isLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{isEdit ? 'Save Changes' : 'Create Record'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
