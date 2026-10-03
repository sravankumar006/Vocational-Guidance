import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { studentService } from '@/services/studentService';
import { StudentDashboardData } from '@/types/student';
import {
  Compass,
  BookOpen,
  MessageSquare,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  GraduationCap,
  Clock,
} from 'lucide-react';

export const StudentHome: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to load student dashboard data. Please verify your connection.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <LoadingState message="Loading your student workspace..." fullHeight />;
  }

  if (error || !dashboardData) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <ErrorState
          title="Student Dashboard Unavailable"
          message={error || 'Unable to retrieve your student records at this time.'}
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const {
    profile,
    current_career,
    recommended_careers,
    latest_counselling_session,
    family_status,
  } = dashboardData;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 1. Header & Identity Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Student Dashboard
            </h1>
            <StatusBadge status="neutral" label="Student Portal" withDot={false} />
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Welcome back, <span className="font-semibold text-text-primary">{profile.name}</span>. Review your profile readiness, career exploration track, and family guidance context.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/profile')}
            leftIcon={<GraduationCap className="h-3.5 w-3.5" />}
          >
            My Profile
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/student/career')}
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          >
            Explore Careers
          </Button>
        </div>
      </div>

      {/* 2. Profile Summary Card (Compact, Non-sensitive) */}
      <Card padding="lg" className="border-border/60 bg-background-card/50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left: Identity Details */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-border/70 flex items-center justify-center font-bold text-lg text-text-primary shrink-0">
                {profile.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {profile.name}
                  </h2>
                  {profile.education_level && (
                    <Badge variant="default" size="sm">
                      {profile.education_level}
                    </Badge>
                  )}
                  {profile.education_stream && (
                    <Badge variant="outline" size="sm">
                      {profile.education_stream}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                  {profile.email && <span>{profile.email}</span>}
                  {profile.phone && <span>{profile.phone}</span>}
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-text-muted" />
                      {profile.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tags for Interests & Skills */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-border/50 text-text-secondary"
                >
                  {interest}
                </span>
              ))}
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-border/50 text-text-secondary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Profile Readiness Checklist */}
          <div className="border-t lg:border-t-0 lg:border-l border-border/40 pt-4 lg:pt-0 lg:pl-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-text-secondary">Profile Readiness</span>
              <span className="font-semibold text-text-primary">
                {profile.profile_completion_percentage}%
              </span>
            </div>
            <ProgressBar
              value={profile.profile_completion_percentage}
              variant="primary"
              size="md"
            />
            <p className="text-[11px] text-text-muted leading-relaxed">
              Based on education level, location, vocational interests, and verified technical skills.
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Primary Dashboard Grid (Career & Recommendations vs Counselling & Family) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Career Center (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Current Career Section */}
          <Card padding="lg" className="border-border/60">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Current Career Selection
                </h3>
              </div>
              <StatusBadge
                status={current_career ? 'success' : 'neutral'}
                label={current_career ? 'Selected' : 'None Selected'}
              />
            </div>

            {current_career ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-border/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-text-primary">
                      {current_career.name}
                    </h4>
                    {current_career.sector && (
                      <Badge variant="outline" size="sm">
                        {current_career.sector}
                      </Badge>
                    )}
                  </div>
                  {current_career.description && (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {current_career.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/student/career')}
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    View Career Blueprint
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Compass className="h-6 w-6 text-text-muted" />}
                title="No Career Selected Yet"
                description="You haven't committed to an active vocational trade track yet. Browse 10,000+ verified job outcomes, certified providers, and curriculum roadmaps."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/student/career')}
                    leftIcon={<BookOpen className="h-3.5 w-3.5" />}
                  >
                    Explore 15 Vocational Trades
                  </Button>
                }
              />
            )}
          </Card>

          {/* Recommended Careers Section */}
          <Card padding="lg" className="border-border/60">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Recommended Careers
                </h3>
              </div>
              <Badge variant="outline" size="sm">
                Aptitude Matching
              </Badge>
            </div>

            {recommended_careers.length > 0 ? (
              <div className="space-y-3">
                {recommended_careers.map((career) => (
                  <div
                    key={career.id}
                    className="p-3.5 rounded-lg bg-white/[0.02] border border-border/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">
                        {career.name}
                      </h4>
                      {career.sector && (
                        <span className="text-xs text-text-muted">{career.sector}</span>
                      )}
                      {career.match_reason && (
                        <p className="text-xs text-text-secondary mt-1">
                          {career.match_reason}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/student/career')}
                    >
                      Inspect
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Sparkles className="h-6 w-6 text-text-muted" />}
                title="Career Recommendations Pending"
                description="Career recommendations will appear here after your profile, vocational interests, and aptitude assessments are analyzed."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/student/career')}
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    Browse Trades Catalog
                  </Button>
                }
              />
            )}
          </Card>
        </div>

        {/* Right Column: Counselling & Family Context (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Counselling Continuation Card */}
          <Card padding="lg" className="border-border/60">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Counselling Advisory
                </h3>
              </div>
              <StatusBadge
                status={latest_counselling_session ? 'success' : 'neutral'}
                label={
                  latest_counselling_session
                    ? latest_counselling_session.status
                    : 'Not Started'
                }
              />
            </div>

            {latest_counselling_session ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-border/40 space-y-2">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-text-muted" />
                      Started: {formatDate(latest_counselling_session.started_at)}
                    </span>
                    <span>
                      {latest_counselling_session.message_count} message
                      {latest_counselling_session.message_count === 1 ? '' : 's'}
                    </span>
                  </div>

                  {latest_counselling_session.last_message_preview && (
                    <div className="text-xs text-text-secondary italic border-l-2 border-border/60 pl-2.5 py-0.5">
                      "{latest_counselling_session.last_message_preview}..."
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/student/counselling')}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Continue Counselling Session
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={<MessageSquare className="h-6 w-6 text-text-muted" />}
                title="Start Advisory Session"
                description="Engage in AI-assisted vocational counselling to clarify course stability, fee structures, and career advancement."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/student/counselling')}
                  >
                    Start First Session
                  </Button>
                }
              />
            )}
          </Card>

          {/* Parent / Family Status Card */}
          <Card padding="lg" className="border-border/60">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-text-muted" />
                <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Family Status
                </h3>
              </div>
              <StatusBadge
                status={family_status.has_linked_parent ? 'success' : 'neutral'}
                label={
                  family_status.has_linked_parent ? 'Connected' : 'Unlinked'
                }
              />
            </div>

            <div className="space-y-3">
              {family_status.has_linked_parent ? (
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      Linked Guardian / Parent:
                    </span>
                    <span className="text-xs font-semibold text-text-primary">
                      {family_status.parent_name || 'Associated Parent'}
                    </span>
                  </div>
                  {family_status.relationship_type && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Relationship:</span>
                      <span className="text-text-secondary">
                        {family_status.relationship_type}
                      </span>
                    </div>
                  )}
                  {family_status.linked_at && (
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>Connected since:</span>
                      <span>{formatDate(family_status.linked_at)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-border/40 text-xs text-text-secondary leading-relaxed">
                  No parent account is currently linked to your student profile. Linking allows family members to participate in career discussions.
                </div>
              )}

              <p className="text-[11px] text-text-muted leading-relaxed">
                Family context allows parents to review career guidance without disclosing sensitive Aadhaar or personal financial details.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Quick Actions Utility Grid */}
      <Card padding="lg" className="border-border/60">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => navigate('/student/career')}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-border/40 hover:border-border/80 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-border/60 flex items-center justify-center shrink-0">
              <Compass className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary group-hover:text-text-primary">
                Explore Careers
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 leading-snug">
                Browse 15 vocational trades, verified wage benchmarks, and courses.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/profile')}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-border/40 hover:border-border/80 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-border/60 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary group-hover:text-text-primary">
                View Profile
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 leading-snug">
                Review your academic level, stream, technical skills, and trade interests.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/counselling')}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-border/40 hover:border-border/80 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-border/60 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary group-hover:text-text-primary">
                Counselling Advisory
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 leading-snug">
                Engage in bilingual career advisory sessions to clarify pathway doubts.
              </div>
            </div>
          </button>
        </div>
      </Card>

      {/* 5. Architectural Compliance & Privacy Guardrail Notice */}
      <div className="p-3.5 rounded-xl bg-white/[0.01] border border-border/30 flex items-center gap-2.5 text-xs text-text-muted">
        <ShieldCheck className="h-4 w-4 text-text-secondary shrink-0" />
        <span>
          <strong className="text-text-secondary">Security & Privacy Guardrail: </strong>
          Dashboard context is derived strictly on the server from the authenticated JWT session. Zero Aadhaar or sensitive identification data is stored, requested, or returned.
        </span>
      </div>
    </div>
  );
};
