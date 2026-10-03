import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { studentService } from '@/services/studentService';
import { StudentProfileDetail } from '@/types/student';
import { SelectOption } from '@/types';
import {
  User,
  GraduationCap,
  Users,
  Sparkles,
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
  ShieldCheck,
  Plus,
  X,
  Compass,
} from 'lucide-react';

const EDUCATION_LEVEL_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select Current Education Level' },
  { value: 'School', label: 'School (Class 8–10)' },
  { value: 'Intermediate / Higher Secondary', label: 'Intermediate / Higher Secondary (Class 11–12)' },
  { value: 'ITI', label: 'Industrial Training Institute (ITI Certificate)' },
  { value: 'Diploma', label: 'Polytechnic Diploma' },
  { value: 'Undergraduate', label: 'Undergraduate Degree (BA / BSc / BCom / BTech)' },
  { value: 'Postgraduate', label: 'Postgraduate Degree' },
  { value: 'Other', label: 'Other Vocational / Non-formal Training' },
];

const INCOME_RANGE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select Household Income Range' },
  { value: 'Below ₹1 lakh', label: 'Below ₹1 lakh / annum' },
  { value: '₹1–3 lakh', label: '₹1–3 lakh / annum' },
  { value: '₹3–5 lakh', label: '₹3–5 lakh / annum' },
  { value: '₹5–10 lakh', label: '₹5–10 lakh / annum' },
  { value: '₹10 lakh+', label: '₹10 lakh+ / annum' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const PRESET_INTERESTS = [
  'Technology',
  'Engineering',
  'Healthcare',
  'Business',
  'Design',
  'Agriculture',
  'Skilled Trades',
  'Finance',
  'Education',
  'Public Service',
  'Creative Work',
  'Hospitality',
  'Automotive',
  'Solar & Renewable Energy',
  'Electronics',
  'Construction & Fabrication',
];

const PRESET_WORK_LOCATIONS = [
  'Local / Near Home',
  'Same State',
  'Anywhere in India',
  'Urban',
  'Rural',
  'Remote / Work From Home',
  'Open to Relocation',
];

const PRESET_CAREER_PREFERENCES = [
  'Technical / Hands-on',
  'Office / Knowledge Work',
  'Creative',
  'Healthcare',
  'Business / Entrepreneurship',
  'Government / Public Service',
  'Skilled Trade',
  'Outdoor / Field Work',
  'People-focused',
  'Research-oriented',
];

const PRESET_STRENGTHS = [
  'Mathematics',
  'Science',
  'Practical / Workshop',
  'Languages & Communication',
  'Computer Literacy',
  'Art & Design',
  'Problem Solving',
  'Mechanical Aptitude',
];

export const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfileDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states per section
  // Section 1: About You
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [savingSection1, setSavingSection1] = useState<boolean>(false);
  const [savedSuccess1, setSavedSuccess1] = useState<boolean>(false);
  const [section1Error, setSection1Error] = useState<string | null>(null);

  // Section 2: Education
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [educationStream, setEducationStream] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [academicStrengths, setAcademicStrengths] = useState<string[]>([]);
  const [savingSection2, setSavingSection2] = useState<boolean>(false);
  const [savedSuccess2, setSavedSuccess2] = useState<boolean>(false);
  const [section2Error, setSection2Error] = useState<string | null>(null);

  // Section 3: Family Context
  const [householdIncome, setHouseholdIncome] = useState<string>('');
  const [savingSection3, setSavingSection3] = useState<boolean>(false);
  const [savedSuccess3, setSavedSuccess3] = useState<boolean>(false);
  const [section3Error, setSection3Error] = useState<string | null>(null);

  // Section 4: Interests
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState<string>('');
  const [savingSection4, setSavingSection4] = useState<boolean>(false);
  const [savedSuccess4, setSavedSuccess4] = useState<boolean>(false);
  const [section4Error, setSection4Error] = useState<string | null>(null);

  // Section 5: Work Preferences
  const [workLocations, setWorkLocations] = useState<string[]>([]);
  const [careerPreferences, setCareerPreferences] = useState<string[]>([]);
  const [savingSection5, setSavingSection5] = useState<boolean>(false);
  const [savedSuccess5, setSavedSuccess5] = useState<boolean>(false);
  const [section5Error, setSection5Error] = useState<string | null>(null);

  const populateForm = (data: StudentProfileDetail) => {
    setProfile(data);
    setName(data.name || '');
    setAge(data.age !== null && data.age !== undefined ? String(data.age) : '');
    setLocation(data.location || '');
    setEducationLevel(data.education_level || '');
    setEducationStream(data.education_stream || '');
    setInstitution(data.institution || '');
    setAcademicStrengths(data.academic_strengths || []);
    setHouseholdIncome(data.household_income_range || '');
    setInterests(data.interests || []);
    setWorkLocations(data.work_location_preferences || []);
    setCareerPreferences(data.career_preferences || []);
  };

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getProfile();
      populateForm(data);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve your student profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Section 1 Save Handler
  const handleSaveSection1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSection1Error(null);
    setSavedSuccess1(false);

    const cleanName = name.trim();
    if (!cleanName) {
      setSection1Error('Name cannot be empty.');
      return;
    }

    let parsedAge: number | null = null;
    if (age.trim()) {
      parsedAge = parseInt(age.trim(), 10);
      if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 80) {
        setSection1Error('Please enter a valid age between 10 and 80.');
        return;
      }
    }

    setSavingSection1(true);
    try {
      const updated = await studentService.updateProfile({
        name: cleanName,
        age: parsedAge,
        location: location.trim() || null,
      });
      populateForm(updated);
      setSavedSuccess1(true);
      setTimeout(() => setSavedSuccess1(false), 3000);
    } catch (err: any) {
      setSection1Error(err.message || 'Failed to save About You information.');
    } finally {
      setSavingSection1(false);
    }
  };

  // Section 2 Save Handler
  const handleSaveSection2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSection2Error(null);
    setSavedSuccess2(false);

    setSavingSection2(true);
    try {
      const updated = await studentService.updateProfile({
        education_level: educationLevel || null,
        education_stream: educationStream.trim() || null,
        institution: institution.trim() || null,
        academic_strengths: academicStrengths,
      });
      populateForm(updated);
      setSavedSuccess2(true);
      setTimeout(() => setSavedSuccess2(false), 3000);
    } catch (err: any) {
      setSection2Error(err.message || 'Failed to save Education details.');
    } finally {
      setSavingSection2(false);
    }
  };

  // Section 3 Save Handler
  const handleSaveSection3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSection3Error(null);
    setSavedSuccess3(false);

    setSavingSection3(true);
    try {
      const updated = await studentService.updateProfile({
        household_income_range: householdIncome || null,
      });
      populateForm(updated);
      setSavedSuccess3(true);
      setTimeout(() => setSavedSuccess3(false), 3000);
    } catch (err: any) {
      setSection3Error(err.message || 'Failed to save Family Context.');
    } finally {
      setSavingSection3(false);
    }
  };

  // Section 4 Save Handler
  const handleSaveSection4 = async () => {
    setSection4Error(null);
    setSavedSuccess4(false);

    setSavingSection4(true);
    try {
      const updated = await studentService.updateProfile({
        interests,
      });
      populateForm(updated);
      setSavedSuccess4(true);
      setTimeout(() => setSavedSuccess4(false), 3000);
    } catch (err: any) {
      setSection4Error(err.message || 'Failed to save Interests.');
    } finally {
      setSavingSection4(false);
    }
  };

  // Section 5 Save Handler
  const handleSaveSection5 = async () => {
    setSection5Error(null);
    setSavedSuccess5(false);

    setSavingSection5(true);
    try {
      const updated = await studentService.updateProfile({
        work_location_preferences: workLocations,
        career_preferences: careerPreferences,
      });
      populateForm(updated);
      setSavedSuccess5(true);
      setTimeout(() => setSavedSuccess5(false), 3000);
    } catch (err: any) {
      setSection5Error(err.message || 'Failed to save Work Preferences.');
    } finally {
      setSavingSection5(false);
    }
  };

  // Toggle helper for arrays
  const toggleArrayItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInterest.trim();
    if (clean && !interests.includes(clean)) {
      setInterests([...interests, clean]);
      setCustomInterest('');
    }
  };

  if (loading) {
    return <LoadingState message="Loading your progressive profile..." fullHeight />;
  }

  if (error || !profile) {
    return (
      <div className="py-8 max-w-4xl mx-auto">
        <ErrorState
          title="Student Profile Unavailable"
          message={error || 'Failed to load profile data.'}
          onRetry={fetchProfile}
        />
      </div>
    );
  }

  const completionPct = profile.profile_completion_percentage;
  const sections = profile.section_completion;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* 1. Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Student Profile
            </h1>
            <StatusBadge status="neutral" label="Progressive" withDot={false} />
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Build your profile at your own pace. Each section saves independently to personalize career and counselling guidance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/student/career')}
          rightIcon={<Compass className="h-3.5 w-3.5" />}
        >
          Explore Careers
        </Button>
      </div>

      {/* 2. Completion Status Card */}
      <Card padding="lg" className="border-border/60 bg-background-card/60">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Profile Readiness
              </span>
              <div className="text-lg font-bold text-text-primary mt-0.5">
                {completionPct}% Complete
              </div>
            </div>

            {/* Section Badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span
                className={`px-2 py-0.5 rounded border ${
                  sections.about_you
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/[0.02] text-text-muted border-border/40'
                }`}
              >
                1. About You
              </span>
              <span
                className={`px-2 py-0.5 rounded border ${
                  sections.education
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/[0.02] text-text-muted border-border/40'
                }`}
              >
                2. Education
              </span>
              <span
                className={`px-2 py-0.5 rounded border ${
                  sections.family_context
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/[0.02] text-text-muted border-border/40'
                }`}
              >
                3. Family
              </span>
              <span
                className={`px-2 py-0.5 rounded border ${
                  sections.interests
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/[0.02] text-text-muted border-border/40'
                }`}
              >
                4. Interests
              </span>
              <span
                className={`px-2 py-0.5 rounded border ${
                  sections.work_preferences
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/[0.02] text-text-muted border-border/40'
                }`}
              >
                5. Preferences
              </span>
            </div>
          </div>

          <ProgressBar value={completionPct} variant="primary" size="md" />

          <p className="text-xs text-text-muted">
            All fields are optional until you are ready. Saving any section immediately updates your recommendations and dashboard metrics.
          </p>
        </div>
      </Card>

      {/* 3. Section 1 — About You */}
      <Card padding="lg" className="border-border/60">
        <form onSubmit={handleSaveSection1} className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-border/60 flex items-center justify-center text-text-muted">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Section 1 — About You
                </h2>
                <p className="text-xs text-text-muted">
                  Basic identifying details and geographic location.
                </p>
              </div>
            </div>
            {sections.about_you && (
              <StatusBadge status="success" label="Complete" />
            )}
          </div>

          {section1Error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{section1Error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              required
            />

            <Input
              label="Age (Years)"
              type="number"
              min={10}
              max={80}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 17"
              helperText="Sensible range: 10–80 years"
            />

            <div className="sm:col-span-2">
              <Input
                label="General Location (City, State, Country)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Medak, Telangana, India"
                leftIcon={<MapPin className="h-4 w-4" />}
                helperText="General city and state only. Zero GPS coordinates or street addresses are collected."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess1 ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Saved successfully
              </span>
            ) : (
              <span />
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingSection1}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save About You
            </Button>
          </div>
        </form>
      </Card>

      {/* 4. Section 2 — Education & Academic Background */}
      <Card padding="lg" className="border-border/60">
        <form onSubmit={handleSaveSection2} className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-border/60 flex items-center justify-center text-text-muted">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Section 2 — Education & Academic Background
                </h2>
                <p className="text-xs text-text-muted">
                  Current qualification, specialization stream, and academic strengths.
                </p>
              </div>
            </div>
            {sections.education && (
              <StatusBadge status="success" label="Complete" />
            )}
          </div>

          {section2Error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{section2Error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Current Education Level"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              options={EDUCATION_LEVEL_OPTIONS}
            />

            <Input
              label="Specialization / Stream"
              value={educationStream}
              onChange={(e) => setEducationStream(e.target.value)}
              placeholder="e.g. Science / MPC, Electrical ITI, General"
            />

            <div className="sm:col-span-2">
              <Input
                label="School / College / Institution Name"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Government Junior College, Medak"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-text-secondary select-none">
                Academic Strengths & Subjects of Interest
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_STRENGTHS.map((strength) => {
                  const active = academicStrengths.includes(strength);
                  return (
                    <button
                      key={strength}
                      type="button"
                      onClick={() =>
                        toggleArrayItem(academicStrengths, strength, setAcademicStrengths)
                      }
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all text-left ${
                        active
                          ? 'bg-accent/20 border-accent text-text-primary font-medium'
                          : 'bg-white/[0.02] border-border/50 text-text-secondary hover:border-border'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {strength}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess2 ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Saved successfully
              </span>
            ) : (
              <span />
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingSection2}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save Education
            </Button>
          </div>
        </form>
      </Card>

      {/* 5. Section 3 — Family Context */}
      <Card padding="lg" className="border-border/60">
        <form onSubmit={handleSaveSection3} className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-border/60 flex items-center justify-center text-text-muted">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Section 3 — Family Context
                </h2>
                <p className="text-xs text-text-muted">
                  Household income range to match eligible government vocational schemes.
                </p>
              </div>
            </div>
            {sections.family_context && (
              <StatusBadge status="success" label="Complete" />
            )}
          </div>

          {section3Error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{section3Error}</span>
            </div>
          )}

          <div className="max-w-md">
            <Select
              label="Household Income Range (Annual)"
              value={householdIncome}
              onChange={(e) => setHouseholdIncome(e.target.value)}
              options={INCOME_RANGE_OPTIONS}
              helperText="Only broad ranges are collected. Exact salary or bank proofs are never requested."
            />
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-border/40 text-xs text-text-muted space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-text-secondary">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Confidentiality Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Household income range is strictly private. It is never displayed publicly or to other students. It only serves to inform scholarship and free vocational training recommendations.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess3 ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Saved successfully
              </span>
            ) : (
              <span />
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingSection3}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save Family Context
            </Button>
          </div>
        </form>
      </Card>

      {/* 6. Section 4 — Interests */}
      <Card padding="lg" className="border-border/60">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-border/60 flex items-center justify-center text-text-muted">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Section 4 — Vocational Interests
                </h2>
                <p className="text-xs text-text-muted">
                  Choose sectors and industry categories that resonate with you.
                </p>
              </div>
            </div>
            {sections.interests && (
              <StatusBadge status="success" label="Complete" />
            )}
          </div>

          {section4Error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{section4Error}</span>
            </div>
          )}

          {/* Selectable Interest Tags */}
          <div className="flex flex-wrap gap-2">
            {PRESET_INTERESTS.map((interest) => {
              const selected = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleArrayItem(interests, interest, setInterests)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${
                    selected
                      ? 'bg-accent/20 border-accent text-text-primary font-medium'
                      : 'bg-white/[0.02] border-border/50 text-text-secondary hover:border-border'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}
                  {interest}
                </button>
              );
            })}
          </div>

          {/* Custom Interest Input */}
          <form onSubmit={handleAddCustomInterest} className="flex gap-2 max-w-sm pt-1">
            <Input
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              placeholder="Add other custom interest..."
              className="py-1.5 text-xs"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!customInterest.trim()}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add
            </Button>
          </form>

          {/* Currently Selected Interest Badges */}
          {interests.length > 0 && (
            <div className="pt-2 border-t border-border/20">
              <span className="text-[11px] text-text-muted block mb-1.5">
                Active Interests ({interests.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-border/60 text-xs text-text-primary"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => toggleArrayItem(interests, item, setInterests)}
                      className="text-text-muted hover:text-text-primary"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {savedSuccess4 ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Saved successfully
              </span>
            ) : (
              <span />
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveSection4}
              isLoading={savingSection4}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save Interests
            </Button>
          </div>
        </div>
      </Card>

      {/* 7. Section 5 — Work & Career Preferences */}
      <Card padding="lg" className="border-border/60">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-border/60 flex items-center justify-center text-text-muted">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Section 5 — Work & Career Preferences
                </h2>
                <p className="text-xs text-text-muted">
                  Preferred working environments, mobility, and vocational styles.
                </p>
              </div>
            </div>
            {sections.work_preferences && (
              <StatusBadge status="success" label="Complete" />
            )}
          </div>

          {section5Error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{section5Error}</span>
            </div>
          )}

          {/* Sub-block A: Preferred Work Locations */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary select-none">
              Preferred Work Location & Mobility (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_WORK_LOCATIONS.map((loc) => {
                const selected = workLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleArrayItem(workLocations, loc, setWorkLocations)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${
                      selected
                        ? 'bg-accent/20 border-accent text-text-primary font-medium'
                        : 'bg-white/[0.02] border-border/50 text-text-secondary hover:border-border'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-block B: Career Work Styles */}
          <div className="space-y-2 pt-2 border-t border-border/20">
            <label className="block text-xs font-medium text-text-secondary select-none">
              Career Style & Working Environment Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_CAREER_PREFERENCES.map((pref) => {
                const selected = careerPreferences.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() =>
                      toggleArrayItem(careerPreferences, pref, setCareerPreferences)
                    }
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${
                      selected
                        ? 'bg-accent/20 border-accent text-text-primary font-medium'
                        : 'bg-white/[0.02] border-border/50 text-text-secondary hover:border-border'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {pref}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess5 ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Saved successfully
              </span>
            ) : (
              <span />
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveSection5}
              isLoading={savingSection5}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save Work Preferences
            </Button>
          </div>
        </div>
      </Card>

      {/* 8. Bottom Security Notice */}
      <div className="p-3.5 rounded-xl bg-white/[0.01] border border-border/30 flex items-center gap-2.5 text-xs text-text-muted">
        <ShieldCheck className="h-4 w-4 text-text-secondary shrink-0" />
        <span>
          <strong className="text-text-secondary">Progressive Privacy Architecture: </strong>
          Student profile updates are scoped strictly to your authenticated session. Partial updates never overwrite unmentioned fields. Zero Aadhaar or biometric data is collected.
        </span>
      </div>
    </div>
  );
};

export default StudentProfile;
