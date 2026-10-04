import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/adminService';
import type {
  AdminOverviewResponse,
  AdminFamilyItem,
  AdminStudentItem,
  AdminParentItem,
  AdminSessionItem,
  AdminEscalationItem,
} from '@/types/admin';

// UI Design System Components
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge, StatusType } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

// Modals
import { FamilyInspectionModal } from '@/components/admin/FamilyInspectionModal';
import { EscalationDetailModal } from '@/components/admin/EscalationDetailModal';

// Lucide Icons
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShieldCheck,
  MessageSquareQuote,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  Clock,
  Eye,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';

type TabKey = 'overview' | 'families' | 'students' | 'parents' | 'sessions' | 'escalations';

export const AdminHome: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active navigation tab
  const activeTab = (searchParams.get('tab') as TabKey) || 'overview';
  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  // Data states
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [families, setFamilies] = useState<AdminFamilyItem[]>([]);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [parents, setParents] = useState<AdminParentItem[]>([]);
  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [escalations, setEscalations] = useState<AdminEscalationItem[]>([]);

  // Loading & error handling
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modal inspection states
  const [selectedFamily, setSelectedFamily] = useState<AdminFamilyItem | null>(null);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState<boolean>(false);

  const [selectedEscalation, setSelectedEscalation] = useState<AdminEscalationItem | null>(null);
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState<boolean>(false);

  // Filter & Search states per section
  const [familySearch, setFamilySearch] = useState('');
  const [familyStatusFilter, setFamilyStatusFilter] = useState('all');
  const [familySortBy, setFamilySortBy] = useState('name_asc');

  const [studentSearch, setStudentSearch] = useState('');
  const [studentEduFilter, setStudentEduFilter] = useState('all');
  const [studentSortBy, setStudentSortBy] = useState('name_asc');

  const [parentSearch, setParentSearch] = useState('');
  const [parentRoleFilter, setParentRoleFilter] = useState('all');

  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('all');
  const [sessionEscalationFilter, setSessionEscalationFilter] = useState('all');

  const [escalationSearch, setEscalationSearch] = useState('');
  const [escalationPriorityFilter, setEscalationPriorityFilter] = useState('all');
  const [escalationStatusFilter, setEscalationStatusFilter] = useState('all');

  // Load all platform data
  const loadDashboardData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [overviewData, familiesData, studentsData, parentsData, sessionsData, escalationsData] =
        await Promise.all([
          adminService.getOverview(),
          adminService.getFamilies(),
          adminService.getStudents(),
          adminService.getParents(),
          adminService.getSessions(),
          adminService.getEscalations(),
        ]);

      setOverview(overviewData);
      setFamilies(familiesData);
      setStudents(studentsData);
      setParents(parentsData);
      setSessions(sessionsData);
      setEscalations(escalationsData);
    } catch (err: any) {
      console.error('Failed to load admin dashboard data:', err);
      setError('Unable to load administration telemetry. Please ensure administrative authorization is active.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Helper for priority badges
  const renderPriorityBadge = (priority?: string | null) => {
    const p = (priority || 'medium').toLowerCase();
    switch (p) {
      case 'urgent':
        return <StatusBadge status="error" label="URGENT" />;
      case 'high':
        return <StatusBadge status="warning" label="HIGH" />;
      case 'medium':
        return <StatusBadge status="info" label="MEDIUM" />;
      case 'low':
      default:
        return <StatusBadge status="neutral" label="LOW" />;
    }
  };

  // Helper for status badges
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let statusType: StatusType = 'neutral';
    if (s === 'active' || s === 'completed' || s === 'resolved') {
      statusType = 'success';
    } else if (s === 'pending' || s === 'in_progress') {
      statusType = 'warning';
    } else if (s === 'cancelled' || s === 'failed') {
      statusType = 'error';
    }
    return <StatusBadge status={statusType} label={status.replace('_', ' ').toUpperCase()} />;
  };

  // --- FILTERED DATASETS ---

  // 1. Filtered Families
  const filteredFamilies = useMemo(() => {
    let result = [...families];
    if (familySearch.trim()) {
      const q = familySearch.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q)
      );
    }
    if (familyStatusFilter !== 'all') {
      result = result.filter((f) => f.status.toLowerCase() === familyStatusFilter.toLowerCase());
    }
    result.sort((a, b) => {
      if (familySortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (familySortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (familySortBy === 'members_desc') {
        return (b.students_count + b.parents_count) - (a.students_count + a.parents_count);
      }
      return 0;
    });
    return result;
  }, [families, familySearch, familyStatusFilter, familySortBy]);

  // 2. Filtered Students
  const filteredStudents = useMemo(() => {
    let result = [...students];
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.family_name.toLowerCase().includes(q) ||
          s.career_interest.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q)
      );
    }
    if (studentEduFilter !== 'all') {
      result = result.filter((s) => s.education_level.toLowerCase().includes(studentEduFilter.toLowerCase()));
    }
    result.sort((a, b) => {
      if (studentSortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (studentSortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (studentSortBy === 'sessions_desc') return b.sessions_count - a.sessions_count;
      return 0;
    });
    return result;
  }, [students, studentSearch, studentEduFilter, studentSortBy]);

  // 3. Filtered Parents
  const filteredParents = useMemo(() => {
    let result = [...parents];
    if (parentSearch.trim()) {
      const q = parentSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.linked_student_name.toLowerCase().includes(q) ||
          p.family_id.toLowerCase().includes(q) ||
          (p.occupation && p.occupation.toLowerCase().includes(q))
      );
    }
    if (parentRoleFilter !== 'all') {
      result = result.filter((p) => p.relationship_to_student.toLowerCase() === parentRoleFilter.toLowerCase());
    }
    return result;
  }, [parents, parentSearch, parentRoleFilter]);

  // 4. Filtered Counselling Sessions
  const filteredSessions = useMemo(() => {
    let result = [...sessions];
    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.student_name.toLowerCase().includes(q) ||
          s.family_name.toLowerCase().includes(q) ||
          s.counsellor.toLowerCase().includes(q) ||
          s.session_type.toLowerCase().includes(q)
      );
    }
    if (sessionStatusFilter !== 'all') {
      result = result.filter((s) => s.status.toLowerCase() === sessionStatusFilter.toLowerCase());
    }
    if (sessionEscalationFilter === 'escalated') {
      result = result.filter((s) => s.has_escalation);
    } else if (sessionEscalationFilter === 'standard') {
      result = result.filter((s) => !s.has_escalation);
    }
    return result;
  }, [sessions, sessionSearch, sessionStatusFilter, sessionEscalationFilter]);

  // 5. Filtered Human Escalations
  const filteredEscalations = useMemo(() => {
    let result = [...escalations];
    if (escalationSearch.trim()) {
      const q = escalationSearch.toLowerCase();
      result = result.filter(
        (e) =>
          (e.student_name && e.student_name.toLowerCase().includes(q)) ||
          (e.parent_name && e.parent_name.toLowerCase().includes(q)) ||
          (e.career_title && e.career_title.toLowerCase().includes(q)) ||
          (e.concern && e.concern.toLowerCase().includes(q)) ||
          (e.reason && e.reason.toLowerCase().includes(q))
      );
    }
    if (escalationPriorityFilter !== 'all') {
      result = result.filter((e) => (e.priority || '').toLowerCase() === escalationPriorityFilter.toLowerCase());
    }
    if (escalationStatusFilter !== 'all') {
      result = result.filter((e) => e.status.toLowerCase() === escalationStatusFilter.toLowerCase());
    }
    return result;
  }, [escalations, escalationSearch, escalationPriorityFilter, escalationStatusFilter]);

  // --- TABLE COLUMN DEFINITIONS ---

  // Families Columns
  const familyColumns: Column<AdminFamilyItem>[] = [
    {
      key: 'id',
      header: 'Identifier',
      render: (item) => (
        <span className="font-mono text-xs text-text-secondary bg-white/[0.03] px-2 py-0.5 rounded border border-border/40">
          {item.id}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Family Unit Name',
      render: (item) => (
        <div className="font-medium text-text-primary text-sm flex items-center gap-2">
          <span>{item.name}</span>
        </div>
      ),
    },
    {
      key: 'students_count',
      header: 'Students',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <GraduationCap className="h-3.5 w-3.5 text-accent" />
          <span>{item.students_count} {item.students_count === 1 ? 'Student' : 'Students'}</span>
        </div>
      ),
    },
    {
      key: 'parents_count',
      header: 'Parents / Guardians',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Users className="h-3.5 w-3.5 text-accent" />
          <span>{item.parents_count} {item.parents_count === 1 ? 'Parent' : 'Parents'}</span>
        </div>
      ),
    },
    {
      key: 'last_activity',
      header: 'Last Activity',
      render: (item) => (
        <span className="text-xs text-text-muted">{item.last_activity}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => renderStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Inspection',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedFamily(item);
            setIsFamilyModalOpen(true);
          }}
          className="text-xs py-1 px-2.5 h-auto flex items-center gap-1.5 hover:border-accent"
        >
          <Eye className="h-3.5 w-3.5 text-accent" />
          <span>Inspect</span>
        </Button>
      ),
    },
  ];

  // Students Columns
  const studentColumns: Column<AdminStudentItem>[] = [
    {
      key: 'name',
      header: 'Student Name',
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary text-sm">{item.name}</div>
          <div className="text-[11px] text-text-muted">Student ID #{item.id}</div>
        </div>
      ),
    },
    {
      key: 'family_name',
      header: 'Family Unit',
      render: (item) => (
        <div>
          <div className="text-xs font-medium text-text-secondary">{item.family_name}</div>
          <div className="text-[10px] text-text-muted font-mono">{item.family_id}</div>
        </div>
      ),
    },
    {
      key: 'education_level',
      header: 'Class / Education',
      render: (item) => (
        <Badge variant="default" size="sm">
          {item.education_level || 'General'}
        </Badge>
      ),
    },
    {
      key: 'career_interest',
      header: 'Vocational Target',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-accent font-medium max-w-[200px] truncate">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{item.career_interest || 'Exploratory Phase'}</span>
        </div>
      ),
    },
    {
      key: 'sessions_count',
      header: 'Counselling Sessions',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <MessageSquareQuote className="h-3.5 w-3.5 text-text-muted" />
          <span>{item.sessions_count} sessions</span>
        </div>
      ),
    },
    {
      key: 'last_activity',
      header: 'Last Active',
      render: (item) => <span className="text-xs text-text-muted">{item.last_activity}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => renderStatusBadge(item.status),
    },
  ];

  // Parents Columns
  const parentColumns: Column<AdminParentItem>[] = [
    {
      key: 'name',
      header: 'Parent Name',
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary text-sm">{item.name}</div>
          <div className="text-[11px] text-text-muted">Parent ID #{item.id}</div>
        </div>
      ),
    },
    {
      key: 'relationship_to_student',
      header: 'Role / Relation',
      render: (item) => (
        <Badge variant="outline" size="sm">
          {item.relationship_to_student}
        </Badge>
      ),
    },
    {
      key: 'linked_student_name',
      header: 'Associated Student & Family',
      render: (item) => (
        <div>
          <div className="text-xs font-medium text-text-primary">{item.linked_student_name}</div>
          <div className="text-[10px] text-text-muted font-mono">{item.family_id}</div>
        </div>
      ),
    },
    {
      key: 'contact_identifier',
      header: 'Contact Identifier (Masked)',
      render: (item) => (
        <span className="font-mono text-xs text-text-muted bg-white/[0.02] px-2 py-0.5 rounded border border-border/30">
          {item.contact_identifier}
        </span>
      ),
    },
    {
      key: 'occupation',
      header: 'Occupation',
      render: (item) => (
        <span className="text-xs text-text-secondary">{item.occupation || 'Employed'}</span>
      ),
    },
    {
      key: 'concerns_count',
      header: 'Recorded Concerns',
      render: (item) => (
        <span className="text-xs font-medium text-text-secondary">
          {item.concerns_count} logged
        </span>
      ),
    },
    {
      key: 'last_activity',
      header: 'Last Active',
      render: (item) => <span className="text-xs text-text-muted">{item.last_activity}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => renderStatusBadge(item.status),
    },
  ];

  // Counselling Sessions Columns
  const sessionColumns: Column<AdminSessionItem>[] = [
    {
      key: 'id',
      header: 'Session',
      render: (item) => (
        <span className="font-mono text-xs text-text-secondary bg-white/[0.03] px-2 py-0.5 rounded border border-border/40">
          #{item.id}
        </span>
      ),
    },
    {
      key: 'student_name',
      header: 'Student & Family',
      render: (item) => (
        <div>
          <div className="font-medium text-text-primary text-sm">{item.student_name}</div>
          <div className="text-[11px] text-text-muted">{item.family_name}</div>
        </div>
      ),
    },
    {
      key: 'session_type',
      header: 'Guidance Topic',
      render: (item) => (
        <div className="text-xs text-text-secondary font-medium capitalize">
          {item.session_type.replace('_', ' ')}
        </div>
      ),
    },
    {
      key: 'counsellor',
      header: 'Counsellor / Agent',
      render: (item) => (
        <div className="text-xs text-text-secondary flex items-center gap-1.5">
          <UserCheck className="h-3.5 w-3.5 text-accent" />
          <span>{item.counsellor}</span>
        </div>
      ),
    },
    {
      key: 'messages_count',
      header: 'Exchanges',
      render: (item) => (
        <span className="text-xs text-text-muted">{item.messages_count} messages</span>
      ),
    },
    {
      key: 'started_at',
      header: 'Started At',
      render: (item) => (
        <div className="text-xs text-text-muted flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{item.started_at}</span>
        </div>
      ),
    },
    {
      key: 'has_escalation',
      header: 'Escalation State',
      render: (item) =>
        item.has_escalation ? (
          <div className="flex items-center gap-1">
            <StatusBadge status="warning" label="Escalated" />
            {item.escalation_priority && (
              <Badge variant="default" size="sm">
                {item.escalation_priority.toUpperCase()}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-text-muted">Standard</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => renderStatusBadge(item.status),
    },
  ];

  // Human Escalations Columns
  const escalationColumns: Column<AdminEscalationItem>[] = [
    {
      key: 'id',
      header: 'Case ID',
      render: (item) => (
        <span className="font-mono text-xs text-text-secondary bg-white/[0.03] px-2 py-0.5 rounded border border-border/40">
          #{item.id}
        </span>
      ),
    },
    {
      key: 'student_name',
      header: 'Student & Family',
      render: (item) => (
        <div>
          <div className="font-medium text-text-primary text-sm">
            {item.student_name || 'Anonymous Student'}
          </div>
          <div className="text-[11px] text-text-muted">
            Parent: {item.parent_name || 'Family Unit'}
          </div>
        </div>
      ),
    },
    {
      key: 'career_title',
      header: 'Target Occupation',
      render: (item) => (
        <div className="text-xs font-medium text-accent flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[180px]">{item.career_title || 'General Vocational'}</span>
        </div>
      ),
    },
    {
      key: 'concern',
      header: 'Reason / Concern Statement',
      render: (item) => (
        <div className="max-w-[240px]">
          <div className="text-xs font-medium text-text-primary capitalize">
            {item.concern || 'Vocational Discrepancy'}
          </div>
          <div className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
            {item.reason || 'Requested human counsellor intervention'}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => renderPriorityBadge(item.priority),
    },
    {
      key: 'assigned_counsellor',
      header: 'Assigned Counsellor',
      render: (item) => (
        <span className="text-xs text-text-secondary">
          {item.assigned_counsellor || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Flagged Date',
      render: (item) => (
        <span className="text-xs text-text-muted">{item.created_at}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => renderStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedEscalation(item);
            setIsEscalationModalOpen(true);
          }}
          className="text-xs py-1 px-2.5 h-auto flex items-center gap-1.5 hover:border-accent"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
          <span>Review</span>
        </Button>
      ),
    },
  ];

  // Global loading state
  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading administrative dashboard telemetry..." />
      </div>
    );
  }

  // Global error state
  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Administrative Telemetry Unavailable"
          message={error}
          onRetry={() => loadDashboardData()}
        />
      </div>
    );
  }

  const stats = overview?.stats || {
    total_families: families.length,
    total_students: students.length,
    total_parents: parents.length,
    total_sessions: sessions.length,
    total_escalations: escalations.length,
    active_sessions: sessions.filter((s) => s.status.toLowerCase() === 'active').length,
    pending_escalations: escalations.filter((e) => e.status.toLowerCase() === 'pending').length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Administration Workspace
            </h1>
            <Badge variant="default" size="sm">
              GOVERNANCE CONSOLE
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Logged in as <span className="font-semibold text-text-primary">{user?.name}</span> (Administrator) &bull; Enforcing server-side RBAC across all records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(true)}
            isLoading={isRefreshing}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 1. Summary Cards (Always accessible at high-level) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Total Families"
          value={stats.total_families}
          icon={<Users className="h-5 w-5 text-accent" />}
          subtext="Registered households"
          className="border-border/60 hover:border-border/80 transition-all cursor-pointer"
          onClick={() => setActiveTab('families')}
        />
        <StatCard
          label="Total Students"
          value={stats.total_students}
          icon={<GraduationCap className="h-5 w-5 text-accent" />}
          subtext="Vocational profiles"
          className="border-border/60 hover:border-border/80 transition-all cursor-pointer"
          onClick={() => setActiveTab('students')}
        />
        <StatCard
          label="Total Parents"
          value={stats.total_parents}
          icon={<ShieldCheck className="h-5 w-5 text-accent" />}
          subtext="Engaged guardians"
          className="border-border/60 hover:border-border/80 transition-all cursor-pointer"
          onClick={() => setActiveTab('parents')}
        />
        <StatCard
          label="Counselling Sessions"
          value={stats.total_sessions}
          icon={<MessageSquareQuote className="h-5 w-5 text-accent" />}
          subtext={`${stats.active_sessions} currently active`}
          className="border-border/60 hover:border-border/80 transition-all cursor-pointer"
          onClick={() => setActiveTab('sessions')}
        />
        <StatCard
          label="Human Escalations"
          value={stats.total_escalations}
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
          subtext={`${stats.pending_escalations} pending review`}
          badge={
            stats.pending_escalations > 0 ? (
              <StatusBadge status="warning" label={`${stats.pending_escalations} PENDING`} />
            ) : undefined
          }
          className="border-border/60 hover:border-border/80 transition-all cursor-pointer"
          onClick={() => setActiveTab('escalations')}
        />
      </div>

      {/* 7. Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/40 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('families')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'families'
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Families ({families.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Students ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parents')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'parents'
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Parents ({parents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
          }`}
        >
          <MessageSquareQuote className="h-4 w-4" />
          <span>Counselling Sessions ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('escalations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'escalations'
              ? 'bg-accent/15 text-accent border border-accent/30'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Human Escalations</span>
          {stats.pending_escalations > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center border border-amber-500/30">
              {stats.pending_escalations}
            </span>
          )}
        </button>
      </div>

      {/* --- TAB CONTENT SECTIONS --- */}

      {/* SECTION 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Escalations Attention Banner */}
          {stats.pending_escalations > 0 && (
            <Card padding="md" className="border-amber-500/30 bg-amber-500/[0.03]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">
                      {stats.pending_escalations} Human Escalation Cases Pending Review
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Vocational guidance sessions flagged severe parental anxiety or career conflict requiring certified counsellor intervention.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('escalations')}
                  className="whitespace-nowrap shrink-0 text-xs"
                >
                  Review Escalation Queue
                </Button>
              </div>
            </Card>
          )}

          {/* Quick Jumps & Platform Telemetry Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sessions Box */}
            <Card padding="lg" className="border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Recent Counselling Sessions
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('sessions')}
                  className="text-xs text-accent hover:text-accent-hover h-auto py-1 px-2"
                >
                  View all ({sessions.length}) &rarr;
                </Button>
              </div>

              <div className="space-y-2">
                {sessions.slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-xl bg-white/[0.01] border border-border/40 hover:border-border/70 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-text-primary flex items-center gap-2">
                        <span>{session.student_name}</span>
                        {session.has_escalation && (
                          <StatusBadge status="warning" label="Escalated" />
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        Topic: <span className="capitalize">{session.session_type.replace('_', ' ')}</span> &bull; {session.started_at}
                      </div>
                    </div>
                    <div>
                      {renderStatusBadge(session.status)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Escalation Cases Box */}
            <Card padding="lg" className="border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Human Escalation Cases
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('escalations')}
                  className="text-xs text-accent hover:text-accent-hover h-auto py-1 px-2"
                >
                  Review queue ({escalations.length}) &rarr;
                </Button>
              </div>

              <div className="space-y-2">
                {escalations.length === 0 ? (
                  <p className="text-xs text-text-muted italic py-4 text-center">
                    No active escalations recorded.
                  </p>
                ) : (
                  escalations.slice(0, 4).map((esc) => (
                    <div
                      key={esc.id}
                      className="p-3 rounded-xl bg-white/[0.01] border border-border/40 hover:border-border/70 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-text-primary flex items-center gap-2">
                          <span>{esc.student_name || 'Anonymous Student'}</span>
                          {renderPriorityBadge(esc.priority)}
                        </div>
                        <div className="text-[11px] text-text-muted line-clamp-1">
                          {esc.concern || 'Vocational Pathway Concern'}: {esc.reason || 'Requested intervention'}
                        </div>
                      </div>
                      <div>
                        {renderStatusBadge(esc.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Platform Governance Metadata Note */}
          <Card padding="md" className="border-border/40 bg-white/[0.01] text-xs text-text-muted">
            <span className="font-semibold text-text-secondary">Security & RBAC Assurance: </span>
            Admin endpoints enforce strict token authentication via `require_admin`. Sensitive credentials, plaintext passwords, Aadhaar identifiers, and API keys are zero-exposed across all administrative payloads.
          </Card>
        </div>
      )}

      {/* SECTION 2: FAMILIES */}
      {activeTab === 'families' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Families Directory</h2>
              <p className="text-xs text-text-secondary">
                Registered households bridging students and parents with aligned career milestones.
              </p>
            </div>
            <div className="text-xs text-text-muted">
              Showing <span className="font-semibold text-text-primary">{filteredFamilies.length}</span> of {families.length} families
            </div>
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white/[0.01] border border-border/40">
            <SearchInput
              value={familySearch}
              onChange={setFamilySearch}
              placeholder="Search by family name or ID..."
            />
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Families' },
                { value: 'inactive', label: 'Inactive Families' },
              ]}
              value={familyStatusFilter}
              onChange={(e) => setFamilyStatusFilter(e.target.value)}
            />
            <Select
              options={[
                { value: 'name_asc', label: 'Sort: Name (A-Z)' },
                { value: 'name_desc', label: 'Sort: Name (Z-A)' },
                { value: 'members_desc', label: 'Sort: Most Members' },
              ]}
              value={familySortBy}
              onChange={(e) => setFamilySortBy(e.target.value)}
            />
          </div>

          {/* Data Table */}
          {filteredFamilies.length === 0 ? (
            <EmptyState
              title="No Families Found"
              description="No family units match your current search criteria or status filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFamilySearch('');
                    setFamilyStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={familyColumns}
              data={filteredFamilies}
              keyExtractor={(item) => item.id}
            />
          )}
        </div>
      )}

      {/* SECTION 3: STUDENTS */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Students Directory</h2>
              <p className="text-xs text-text-secondary">
                Empirical vocational trajectories, class levels, and counselling engagement history.
              </p>
            </div>
            <div className="text-xs text-text-muted">
              Showing <span className="font-semibold text-text-primary">{filteredStudents.length}</span> of {students.length} students
            </div>
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white/[0.01] border border-border/40">
            <SearchInput
              value={studentSearch}
              onChange={setStudentSearch}
              placeholder="Search by student, career, or city..."
            />
            <Select
              options={[
                { value: 'all', label: 'All Education Levels' },
                { value: '10', label: 'Class 10th' },
                { value: '12', label: 'Class 12th' },
                { value: 'iti', label: 'ITI / Polytechnic' },
              ]}
              value={studentEduFilter}
              onChange={(e) => setStudentEduFilter(e.target.value)}
            />
            <Select
              options={[
                { value: 'name_asc', label: 'Sort: Name (A-Z)' },
                { value: 'name_desc', label: 'Sort: Name (Z-A)' },
                { value: 'sessions_desc', label: 'Sort: Most Sessions' },
              ]}
              value={studentSortBy}
              onChange={(e) => setStudentSortBy(e.target.value)}
            />
          </div>

          {/* Data Table */}
          {filteredStudents.length === 0 ? (
            <EmptyState
              title="No Students Found"
              description="No student profiles match your search query or educational filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStudentSearch('');
                    setStudentEduFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={studentColumns}
              data={filteredStudents}
              keyExtractor={(item) => item.id}
            />
          )}
        </div>
      )}

      {/* SECTION 4: PARENTS */}
      {activeTab === 'parents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Parents & Guardians</h2>
              <p className="text-xs text-text-secondary">
                Registered guardians with privacy-preserved contact identifiers and linked children.
              </p>
            </div>
            <div className="text-xs text-text-muted">
              Showing <span className="font-semibold text-text-primary">{filteredParents.length}</span> of {parents.length} parents
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.01] border border-border/40">
            <SearchInput
              value={parentSearch}
              onChange={setParentSearch}
              placeholder="Search by parent name, child name, or occupation..."
            />
            <Select
              options={[
                { value: 'all', label: 'All Roles / Relations' },
                { value: 'mother', label: 'Mother' },
                { value: 'father', label: 'Father' },
                { value: 'guardian', label: 'Guardian' },
              ]}
              value={parentRoleFilter}
              onChange={(e) => setParentRoleFilter(e.target.value)}
            />
          </div>

          {/* Data Table */}
          {filteredParents.length === 0 ? (
            <EmptyState
              title="No Parents Found"
              description="No parent records match your query."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setParentSearch('');
                    setParentRoleFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={parentColumns}
              data={filteredParents}
              keyExtractor={(item) => item.id}
            />
          )}
        </div>
      )}

      {/* SECTION 5: COUNSELLING SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text-primary">Counselling Sessions</h2>
              <p className="text-xs text-text-secondary">
                Audit trail of AI dialogue interactions and human counsellor engagements across the platform.
              </p>
            </div>
            <div className="text-xs text-text-muted">
              Showing <span className="font-semibold text-text-primary">{filteredSessions.length}</span> of {sessions.length} sessions
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white/[0.01] border border-border/40">
            <SearchInput
              value={sessionSearch}
              onChange={setSessionSearch}
              placeholder="Search by student, topic, or counsellor..."
            />
            <Select
              options={[
                { value: 'all', label: 'All Session States' },
                { value: 'active', label: 'Active Sessions' },
                { value: 'completed', label: 'Completed Sessions' },
                { value: 'cancelled', label: 'Cancelled Sessions' },
              ]}
              value={sessionStatusFilter}
              onChange={(e) => setSessionStatusFilter(e.target.value)}
            />
            <Select
              options={[
                { value: 'all', label: 'All Escalation States' },
                { value: 'escalated', label: 'Escalated Only' },
                { value: 'standard', label: 'Standard (Non-escalated)' },
              ]}
              value={sessionEscalationFilter}
              onChange={(e) => setSessionEscalationFilter(e.target.value)}
            />
          </div>

          {/* Data Table */}
          {filteredSessions.length === 0 ? (
            <EmptyState
              title="No Sessions Found"
              description="No counselling sessions matched your current filter criteria."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSessionSearch('');
                    setSessionStatusFilter('all');
                    setSessionEscalationFilter('all');
                  }}
                >
                  Reset Session Filters
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={sessionColumns}
              data={filteredSessions}
              keyExtractor={(item) => item.id}
            />
          )}
        </div>
      )}

      {/* SECTION 6: HUMAN ESCALATIONS */}
      {activeTab === 'escalations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary">Human Escalations Queue</h2>
                {stats.pending_escalations > 0 && (
                  <Badge variant="default" size="sm">
                    {stats.pending_escalations} PENDING ACTION
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-secondary">
                Certified counsellor resolution workflow for high-anxiety student sessions and parental concerns.
              </p>
            </div>
            <div className="text-xs text-text-muted">
              Showing <span className="font-semibold text-text-primary">{filteredEscalations.length}</span> of {escalations.length} cases
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white/[0.01] border border-border/40">
            <SearchInput
              value={escalationSearch}
              onChange={setEscalationSearch}
              placeholder="Search by student, concern, or reason..."
            />
            <Select
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' },
              ]}
              value={escalationPriorityFilter}
              onChange={(e) => setEscalationPriorityFilter(e.target.value)}
            />
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending Review' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
              ]}
              value={escalationStatusFilter}
              onChange={(e) => setEscalationStatusFilter(e.target.value)}
            />
          </div>

          {/* Data Table */}
          {filteredEscalations.length === 0 ? (
            <EmptyState
              title="No Escalation Cases Found"
              description="No human escalation records match the selected priority and status filters."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEscalationSearch('');
                    setEscalationPriorityFilter('all');
                    setEscalationStatusFilter('all');
                  }}
                >
                  Reset Escalation Filters
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={escalationColumns}
              data={filteredEscalations}
              keyExtractor={(item) => item.id}
            />
          )}
        </div>
      )}

      {/* --- MODALS --- */}
      <FamilyInspectionModal
        family={selectedFamily}
        isOpen={isFamilyModalOpen}
        onClose={() => {
          setIsFamilyModalOpen(false);
          setSelectedFamily(null);
        }}
      />

      <EscalationDetailModal
        escalation={selectedEscalation}
        isOpen={isEscalationModalOpen}
        onClose={() => {
          setIsEscalationModalOpen(false);
          setSelectedEscalation(null);
        }}
        onStatusUpdated={() => {
          // Silently refresh data to sync new status
          loadDashboardData(true);
        }}
      />
    </div>
  );
};
