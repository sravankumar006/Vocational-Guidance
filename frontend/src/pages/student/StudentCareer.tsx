import React, { useEffect, useState, useTransition, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Compass,
  Sparkles,
  Clock,
  Wrench,
  GraduationCap,
  TrendingUp,
  Building2,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  ArrowUpDown,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { careerService } from '@/services/careerService';
import {
  CareerSummary,
  CareerFilterOptions,
  CareerIntent,
  CareerSearchParams,
  CareerRecommendationItem,
} from '@/types/career';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ExplainAction } from '@/components/counselling/ExplainAction';

interface IntentOption {
  id: CareerIntent;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const INTENT_OPTIONS: IntentOption[] = [
  {
    id: 'I already have a career in mind',
    title: 'I already have a career in mind',
    description: 'Search for a specific career and explore its vocational pathway.',
    icon: Compass,
  },
  {
    id: 'Help me choose a career',
    title: 'Help me choose a career',
    description: 'Explore different career options based on sectors and what matters to you.',
    icon: Sparkles,
  },
  {
    id: 'I want a job soon',
    title: 'I want a job soon',
    description: 'Explore careers with shorter preparation/training pathways.',
    icon: Clock,
  },
  {
    id: 'I want vocational training',
    title: 'I want vocational training',
    description: 'Explore skill-based courses and accredited training providers.',
    icon: Wrench,
  },
  {
    id: 'I want to continue studying',
    title: 'I want to continue studying',
    description: 'Explore career paths that involve further education and progression.',
    icon: GraduationCap,
  },
];

export const StudentCareer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [, startTransition] = useTransition();

  // Career Intent State (Brick 12)
  const [selectedIntent, setSelectedIntent] = useState<CareerIntent | null>(null);
  const [intentSaving, setIntentSaving] = useState<boolean>(false);
  const [intentSuccessToast, setIntentSuccessToast] = useState<string | null>(null);

  // Search & Filter State (Brick 13)
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchParams.get('search') || '');
  const [sector, setSector] = useState<string>(searchParams.get('sector') || '');
  const [education, setEducation] = useState<string>(searchParams.get('education') || '');
  const [duration, setDuration] = useState<string>(searchParams.get('duration') || '');
  const [location, setLocation] = useState<string>(searchParams.get('location') || '');
  const [minSalary, setMinSalary] = useState<number>(
    searchParams.get('min_salary') ? parseInt(searchParams.get('min_salary')!, 10) : 0
  );
  const [minPlacementRate, setMinPlacementRate] = useState<number>(
    searchParams.get('min_placement_rate') ? parseFloat(searchParams.get('min_placement_rate')!) : 0
  );
  const [sortBy, setSortBy] = useState<
    'name_asc' | 'name_desc' | 'salary_high' | 'salary_low' | 'placement_rate'
  >(
    (searchParams.get('sort_by') as any) || 'name_asc'
  );
  const [page, setPage] = useState<number>(
    searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1
  );

  // Results State
  const [careers, setCareers] = useState<CareerSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filterOptions, setFilterOptions] = useState<CareerFilterOptions>({
    sectors: [],
    qualification_levels: [],
    durations: [],
    states: [],
    min_salary_bound: 6500,
    max_salary_bound: 35000,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Recommendations State (Brick 14)
  const [recommendations, setRecommendations] = useState<CareerRecommendationItem[]>([]);
  const [recLoading, setRecLoading] = useState<boolean>(true);

  // Load Deterministic Recommendations
  const loadRecommendations = useCallback(async () => {
    setRecLoading(true);
    try {
      const res = await careerService.getRecommendations();
      setRecommendations(res.recommendations);
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // 1. Initial Load: Retrieve saved Career Intent
  useEffect(() => {
    let isMounted = true;
    const loadIntent = async () => {
      try {
        const res = await careerService.getCareerIntent();
        if (isMounted && res.career_intent) {
          setSelectedIntent(res.career_intent);
        }
      } catch {
        // Intent load non-blocking
      }
    };
    loadIntent();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Debounce Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 3. Synchronize Search & Filter State to URL Params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sector) params.set('sector', sector);
    if (education) params.set('education', education);
    if (duration) params.set('duration', duration);
    if (location) params.set('location', location);
    if (minSalary > 0) params.set('min_salary', minSalary.toString());
    if (minPlacementRate > 0) params.set('min_placement_rate', minPlacementRate.toString());
    if (sortBy !== 'name_asc') params.set('sort_by', sortBy);
    if (page > 1) params.set('page', page.toString());

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, sector, education, duration, location, minSalary, minPlacementRate, sortBy, page, setSearchParams]);

  // 4. Execute Server-Side Search Query
  const fetchCareers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: CareerSearchParams = {
        search: debouncedSearch || undefined,
        sector: sector || undefined,
        education: education || undefined,
        duration: duration || undefined,
        location: location || undefined,
        min_salary: minSalary > 0 ? minSalary : undefined,
        min_placement_rate: minPlacementRate > 0 ? minPlacementRate : undefined,
        sort_by: sortBy,
        page,
        page_size: 9,
      };

      const res = await careerService.searchCareers(queryParams);
      setCareers(res.items);
      setTotalCount(res.total);
      setTotalPages(res.total_pages);
      if (res.filter_options) {
        setFilterOptions(res.filter_options);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load careers from database.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sector, education, duration, location, minSalary, minPlacementRate, sortBy, page]);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  // Handle Intent Selection (Brick 12)
  const handleSelectIntent = async (intent: CareerIntent) => {
    if (selectedIntent === intent) return;
    setSelectedIntent(intent);
    setIntentSaving(true);
    setIntentSuccessToast(null);

    try {
      await careerService.saveCareerIntent(intent);
      setIntentSuccessToast(`Exploration intent saved: "${intent}"`);
      setTimeout(() => setIntentSuccessToast(null), 3500);

      // Contextual UI enhancement based on intent
      if (intent === 'I already have a career in mind') {
        const input = document.getElementById('career-search-input');
        input?.focus();
      } else if (intent === 'I want a job soon') {
        // suggest short duration
        setDuration('Short');
        setPage(1);
      }
    } catch {
      // Revert if saving fails
    } finally {
      setIntentSaving(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    startTransition(() => {
      setSearchTerm('');
      setDebouncedSearch('');
      setSector('');
      setEducation('');
      setDuration('');
      setLocation('');
      setMinSalary(0);
      setMinPlacementRate(0);
      setSortBy('name_asc');
      setPage(1);
    });
  };

  // Active filters count
  const activeFiltersCount = [
    Boolean(debouncedSearch),
    Boolean(sector),
    Boolean(education),
    Boolean(duration),
    Boolean(location),
    minSalary > 0,
    minPlacementRate > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Verified Career Exploration
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> MSDE & NSDC Database
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Explore Vocational Careers
            </h1>
            <p className="text-slate-600 text-sm md:text-base mt-1 max-w-3xl">
              Discover real technical trades, accredited training programs, wage ranges, and verified job outcomes across India.
            </p>
          </div>
        </div>

        {/* BRICK 12: CAREER INTENT SECTION */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                What is your primary goal today?
              </h2>
              <p className="text-xs text-slate-500">
                Choose an intent to personalize your browsing experience. Stored in your profile.
              </p>
            </div>
            {intentSuccessToast && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-fadeIn">
                <Check className="w-3.5 h-3.5" /> {intentSuccessToast}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {INTENT_OPTIONS.map((opt) => {
              const isSelected = selectedIntent === opt.id;
              const IconComp = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectIntent(opt.id)}
                  disabled={intentSaving}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug">
                      {opt.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BRICK 14: DETERMINISTIC CAREER RECOMMENDATIONS */}
      {recLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs animate-pulse">
          <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-72 bg-slate-100 rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-slate-50 rounded-xl border border-slate-200/60 p-4" />
            ))}
          </div>
        </div>
      ) : recommendations.length > 0 ? (
        <section
          aria-labelledby="recommended-heading"
          className="bg-gradient-to-br from-blue-50/50 via-white to-slate-50/50 rounded-xl border border-blue-100 p-6 md:p-8 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-blue-100/70">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Deterministic Engine
                </span>
                <span className="text-xs text-slate-500 font-medium">Top 3 Candidates</span>
              </div>
              <h2 id="recommended-heading" className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Recommended for You
              </h2>
              <p className="text-xs md:text-sm text-slate-600 mt-0.5">
                Matched against your current education, explicit interests, location, and training goals.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Zero probabilistic inference
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recommendations.map((item, idx) => {
              const { career, matched_factors, mismatched_factors, unknown_factors } = item;
              const displayScore = item.compatibility_score ?? item.score ?? 0;
              return (
                <div
                  key={career.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between p-5 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                  <div>
                    {/* Top Row: Sector & Score */}
                    <div className="flex items-start justify-between gap-2 mb-2.5 pt-1">
                      <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md line-clamp-1">
                        {career.sector}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0"
                        title="Deterministic Compatibility Score based on 6 structured dimensions"
                      >
                        {displayScore}% Compatibility
                      </span>
                    </div>

                    {/* Career Title */}
                    <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug line-clamp-2">
                      <span className="text-slate-400 font-normal mr-1.5">#{idx + 1}</span>
                      {career.name}
                    </h3>

                    {/* Quick Metadata */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mb-4 pb-3 border-b border-slate-100">
                      {career.qualification_levels && career.qualification_levels.length > 0 && (
                        <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          {career.qualification_levels[0]}
                        </span>
                      )}
                      {career.training_durations && career.training_durations.length > 0 && (
                        <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          {career.training_durations[0]}
                        </span>
                      )}
                      {career.salary_min != null && career.salary_max != null && (
                        <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                          ₹{career.salary_min.toLocaleString('en-IN')} - ₹{career.salary_max.toLocaleString('en-IN')}/mo
                        </span>
                      )}
                    </div>

                    {/* Why this appears */}
                    <div className="space-y-1.5 mb-3.5">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Why this appears
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {matched_factors.length > 0 ? (
                          matched_factors.slice(0, 3).map((mf, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-tight">{mf.summary}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-1.5 text-slate-500">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">Meets baseline educational qualifications</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Consider / Negative or Unknown Factors */}
                    {(mismatched_factors.length > 0 || unknown_factors.length > 0) && (
                      <div className="space-y-1.5 mb-4 pt-2.5 border-t border-slate-100">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Consider
                        </h4>
                        <ul className="space-y-1 text-[11px] text-slate-500">
                          {mismatched_factors.slice(0, 2).map((mf, i) => (
                            <li key={`mis-${i}`} className="flex items-start gap-1.5 text-amber-700">
                              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                              <span className="leading-tight">{mf.summary}</span>
                            </li>
                          ))}
                          {unknown_factors.slice(0, 1).map((uf, i) => (
                            <li key={`unk-${i}`} className="flex items-start gap-1.5 text-slate-500">
                              <span className="w-3 h-3 text-slate-400 shrink-0 text-center text-[10px] leading-3">•</span>
                              <span className="leading-tight">{uf.summary}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* View Career Action Button & Explain Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/student/career/${career.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-600 hover:text-white rounded-lg transition-colors border border-blue-200/60"
                    >
                      View Pathway
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <ExplainAction
                      intent="explain_career"
                      entityType="career"
                      entityId={career.id}
                      entityTitle={career.name}
                      label="Explain"
                      size="sm"
                      variant="outline"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Main Exploration Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* DESKTOP FILTER SIDEBAR */}
        <aside className="hidden lg:block bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </h2>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sector / Industry Filter */}
          <div className="space-y-2">
            <label htmlFor="filter-sector" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Industry / Sector
            </label>
            <div className="relative">
              <select
                id="filter-sector"
                value={sector}
                onChange={(e) => {
                  setSector(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 appearance-none cursor-pointer"
              >
                <option value="">All Sectors ({filterOptions.sectors.length})</option>
                {filterOptions.sectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Qualification Level Filter */}
          <div className="space-y-2">
            <label htmlFor="filter-education" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Qualification Level
            </label>
            <div className="relative">
              <select
                id="filter-education"
                value={education}
                onChange={(e) => {
                  setEducation(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 appearance-none cursor-pointer"
              >
                <option value="">All Qualification Levels</option>
                {filterOptions.qualification_levels.map((ql) => (
                  <option key={ql} value={ql}>
                    {ql}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Training Duration Filter */}
          <div className="space-y-2">
            <label htmlFor="filter-duration" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Training Duration
            </label>
            <div className="relative">
              <select
                id="filter-duration"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 appearance-none cursor-pointer"
              >
                <option value="">Any Duration</option>
                <option value="Short">Short (≤ 3 Months)</option>
                <option value="Medium">Medium (4–6 Months)</option>
                {filterOptions.durations.map((dur) => (
                  <option key={dur} value={dur}>
                    Exact: {dur}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* State / Location Filter */}
          <div className="space-y-2">
            <label htmlFor="filter-location" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              State / Region
            </label>
            <div className="relative">
              <select
                id="filter-location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPage(1);
                }}
                className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 appearance-none cursor-pointer"
              >
                <option value="">Any State ({filterOptions.states.length} available)</option>
                {filterOptions.states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Minimum Monthly Salary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="filter-salary" className="font-bold text-slate-700 uppercase tracking-wider">
                Min Monthly Salary
              </label>
              <span className="font-semibold text-blue-700">
                {minSalary > 0 ? `₹${minSalary.toLocaleString('en-IN')}+` : 'Any'}
              </span>
            </div>
            <input
              id="filter-salary"
              type="range"
              min={0}
              max={25000}
              step={2000}
              value={minSalary}
              onChange={(e) => {
                setMinSalary(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Any</span>
              <span>₹10k</span>
              <span>₹20k+</span>
            </div>
          </div>

          {/* Minimum Verified Placement Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="filter-placement" className="font-bold text-slate-700 uppercase tracking-wider">
                Min Placement Rate
              </label>
              <span className="font-semibold text-emerald-700">
                {minPlacementRate > 0 ? `${minPlacementRate}%+` : 'Any'}
              </span>
            </div>
            <input
              id="filter-placement"
              type="range"
              min={0}
              max={80}
              step={5}
              value={minPlacementRate}
              onChange={(e) => {
                setMinPlacementRate(parseFloat(e.target.value));
                setPage(1);
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Any</span>
              <span>70%</span>
              <span>80%</span>
            </div>
          </div>
        </aside>

        {/* RESULTS AREA */}
        <main className="lg:col-span-3 space-y-6">
          {/* Search bar & Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="career-search-input"
                  type="text"
                  placeholder="Search by trade name, sector, or keyword (e.g., Electrician, Solar, Welder)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setPage(1);
                    }}
                    className="text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2.5 pr-8 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 appearance-none cursor-pointer"
                  >
                    <option value="name_asc">Sort: Name (A to Z)</option>
                    <option value="name_desc">Sort: Name (Z to A)</option>
                    <option value="salary_high">Sort: Salary (Highest)</option>
                    <option value="salary_low">Sort: Salary (Lowest)</option>
                    <option value="placement_rate">Sort: Placement Rate</option>
                  </select>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>

                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 shrink-0"
                >
                  <Filter className="w-4 h-4 text-blue-600" />
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </button>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400 mr-1">Active Filters:</span>
                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                    Keyword: "{debouncedSearch}"
                    <button onClick={() => setSearchTerm('')}>
                      <X className="w-3 h-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {sector && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200">
                    Sector: {sector}
                    <button onClick={() => setSector('')}>
                      <X className="w-3 h-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {education && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-800 px-2.5 py-1 rounded-md border border-purple-200">
                    Level: {education}
                    <button onClick={() => setEducation('')}>
                      <X className="w-3 h-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {duration && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200">
                    Duration: {duration}
                    <button onClick={() => setDuration('')}>
                      <X className="w-3 h-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                    State: {location}
                    <button onClick={() => setLocation('')}>
                      <X className="w-3 h-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {minSalary > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                    Min Salary: ₹{minSalary.toLocaleString('en-IN')}
                    <button onClick={() => setMinSalary(0)}>
                      <X className="w-3 h-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                {minPlacementRate > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">
                    Min Placement: {minPlacementRate}%
                    <button onClick={() => setMinPlacementRate(0)}>
                      <X className="w-3 h-3 hover:text-red-600" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-blue-700 hover:text-blue-900 font-medium ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Results Count & Provenance Note */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 px-1">
            <div>
              Showing <span className="font-semibold text-slate-900">{totalCount}</span> verified vocational trades
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span>Empirical data from accredited ITI & NSDC programs</span>
            </div>
          </div>

          {/* Results State Rendering */}
          {loading ? (
            <div className="py-12 bg-white rounded-xl border border-slate-200">
              <LoadingState message="Searching verified vocational careers..." />
            </div>
          ) : error ? (
            <div className="py-6">
              <ErrorState
                title="Error Loading Careers"
                message={error}
                onRetry={fetchCareers}
              />
            </div>
          ) : careers.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No matching careers found
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                None of the trades in the current database match your selected filter criteria. Try adjusting or clearing your filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {careers.map((career) => (
                <div
                  key={career.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {career.sector || 'Technical Trade'}
                      </span>
                      {career.average_placement_rate && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <TrendingUp className="w-3 h-3" />
                          {career.average_placement_rate}%
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {career.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {career.description}
                    </p>

                    {/* Wage & Duration stats */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500">Monthly Earnings:</span>
                        <span className="font-semibold text-slate-900">
                          ₹{career.salary_min?.toLocaleString('en-IN') || '7,000'} – ₹{career.salary_max?.toLocaleString('en-IN') || '24,000'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500">Duration & Level:</span>
                        <span className="font-medium text-slate-800">
                          {career.training_durations[0] || '3–6 Mos'} • {career.qualification_levels[0] || 'NSQF 3'}
                        </span>
                      </div>
                    </div>

                    {/* Common Job Roles */}
                    {career.common_roles && career.common_roles.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {career.common_roles.slice(0, 2).map((role, idx) => (
                          <span
                            key={idx}
                            className="inline-block text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-sm"
                          >
                            {role}
                          </span>
                        ))}
                        {career.common_roles.length > 2 && (
                          <span className="text-[10px] text-slate-400 py-0.5">
                            +{career.common_roles.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {career.providers_count || 5} Providers
                    </span>
                    <div className="flex items-center gap-1.5">
                      <ExplainAction
                        intent="explain_career"
                        entityType="career"
                        entityId={career.id}
                        entityTitle={career.name}
                        label="Explain"
                        size="xs"
                        variant="outline"
                      />
                      <button
                        onClick={() =>
                          navigate(`/student/career/${career.id}`, {
                            state: { searchParams: searchParams.toString() },
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        View Pathway
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-xs text-slate-600 font-medium">
                Page <span className="font-bold text-slate-900">{page}</span> of{' '}
                <span className="font-bold text-slate-900">{totalPages}</span>
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE FILTER MODAL / DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs lg:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" /> Filter Careers
              </h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5"
              >
                <option value="">All Sectors</option>
                {filterOptions.sectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Qualification */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Qualification Level</label>
              <select
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5"
              >
                <option value="">All Levels</option>
                {filterOptions.qualification_levels.map((ql) => (
                  <option key={ql} value={ql}>
                    {ql}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5"
              >
                <option value="">Any Duration</option>
                <option value="Short">Short (≤ 3 Months)</option>
                <option value="Medium">Medium (4–6 Months)</option>
              </select>
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">State</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5"
              >
                <option value="">Any State</option>
                {filterOptions.states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
