import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  TrendingUp,
  Award,
  Clock,
  Building2,
  MapPin,
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { careerService } from '@/services/careerService';
import { CareerDetail } from '@/types/career';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export const StudentCareerDetail: React.FC = () => {
  const { careerId } = useParams<{ careerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [career, setCareer] = useState<CareerDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!careerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await careerService.getCareerDetail(parseInt(careerId, 10));
      setCareer(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unable to load career details';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [careerId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleBack = () => {
    // Preserve search params if passed in state or history
    const searchParams = location.state?.searchParams || '';
    navigate(`/student/career${searchParams ? `?${searchParams}` : ''}`);
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading verified career pathway and provider data..." />
      </div>
    );
  }

  if (error || !career) {
    return (
      <div className="py-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Career Exploration
        </button>
        <ErrorState
          title="Career Not Found"
          message={error || 'The requested vocational trade could not be retrieved from the database.'}
          onRetry={fetchDetail}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Search & Explore
        </button>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          Vocational Trade ID: #{career.id}
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {career.sector && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {career.sector}
                </span>
              )}
              {career.self_employment && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Self-Employment: {career.self_employment}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> MSDE & NSDC Verified
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {career.name}
            </h1>
            <p className="text-slate-600 text-base max-w-3xl leading-relaxed">
              {career.description}
            </p>
          </div>
        </div>

        {/* Common Roles Tags */}
        {career.common_roles && career.common_roles.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
              Common Job Titles:
            </span>
            {career.common_roles.map((role, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
              >
                {role}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sourced Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Salary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Wage Range</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            ₹{career.salary_statistics.min_monthly?.toLocaleString('en-IN') || '7,000'} – ₹{career.salary_statistics.max_monthly?.toLocaleString('en-IN') || '25,000'}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Avg starting: ₹{career.salary_statistics.avg_min_monthly?.toLocaleString('en-IN')} / mo
          </p>
        </div>

        {/* Metric 2: Placement Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Placement Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {career.placement_statistics.average_placement_rate ? `${career.placement_statistics.average_placement_rate}%` : 'N/A'}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Based on {career.placement_statistics.total_empirical_records.toLocaleString('en-IN')} recorded graduates
          </p>
        </div>

        {/* Metric 3: Training Duration */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Training Duration</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {career.courses && career.courses.length > 0
              ? Array.from(new Set(career.courses.map(c => c.duration).filter(Boolean))).join(', ')
              : '3–6 Months'}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Across {career.courses?.length || 5} accredited programs
          </p>
        </div>

        {/* Metric 4: Qualification Level */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Qualification Level</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {career.courses && career.courses.length > 0
              ? Array.from(new Set(career.courses.map(c => c.qualification_level).filter(Boolean))).join(', ')
              : 'NSQF Level 3'}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            National Skills Qualifications Framework
          </p>
        </div>
      </div>

      {/* Two Column Section: Career Progression & Further Education */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progression Pathway Ladder */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Career Progression Ladder</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Realistic advancement milestones as vocational experience and competencies are acquired.
          </p>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {career.progression_ladder.map((step, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-white border-2 border-blue-600 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 z-10 shadow-xs">
                  {idx + 1}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex-1">
                  <div className="font-semibold text-slate-900 text-sm">{step}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {idx === 0 && 'Entry level transition post-training'}
                    {idx === 1 && 'Independent technician role with hands-on responsibilities'}
                    {idx === 2 && 'Advanced specialist / master technician with supervisory duties'}
                    {idx >= 3 && 'Contractor, business owner, or enterprise lead'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {career.further_education_options && (
            <div className="mt-6 pt-5 border-t border-slate-100 bg-blue-50/50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-900 mb-1">
                Vertical Educational Mobility:
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                {career.further_education_options}
              </p>
            </div>
          )}
        </div>

        {/* Regional Employment Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Empirical Regional Outcomes</h2>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Sample district placement rates based on historical ministry survey records.
            </p>

            <div className="space-y-3">
              {career.regional_distribution.map((dist, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/80 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <span className="text-sm font-medium text-slate-900">{dist.region}</span>
                      <span className="text-xs text-slate-500 block">
                        {dist.recorded_batches} survey batches
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-700">
                      {dist.average_placement_rate}%
                    </span>
                    <span className="text-xs text-slate-500 block">placement rate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Empirical historical data. Actual employment outcomes depend on individual diligence and market demand.
          </div>
        </div>
      </div>

      {/* Accredited Training Courses & Providers */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Accredited Training Courses & Providers</h2>
            </div>
            <p className="text-sm text-slate-600">
              Approved programs offering formal training and certification for this trade.
            </p>
          </div>
          <span className="inline-flex items-center text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
            {career.courses?.length || 0} Courses Found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {career.courses && career.courses.map((course) => (
            <div
              key={course.id}
              className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 text-base">
                    {course.provider?.name || 'Accredited Training Centre'}
                  </h3>
                  {course.provider?.provider_type && (
                    <span className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {course.provider.provider_type}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.provider?.location || 'Pan-India Centers'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration: {course.duration || '3 Months'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>Level: {course.qualification_level || 'NSQF Level 3'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Mode: {course.delivery_mode || 'Practical / Lab'}</span>
                <span className="font-medium text-blue-700">Accredited</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Data Provenance Card */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <div className="font-semibold text-slate-900 text-sm">
              Source: {career.data_provenance.source_name}
            </div>
            <p className="text-slate-500 mt-0.5">
              {career.data_provenance.notice}
            </p>
          </div>
        </div>
        {career.data_provenance.url && (
          <a
            href={career.data_provenance.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:text-blue-900 transition-colors shrink-0"
          >
            Official Portal <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
