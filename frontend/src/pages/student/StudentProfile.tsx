import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { User, MapPin, ShieldCheck } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [name, setName] = useState(user?.name || 'Aarav Sharma');
  const [educationLevel, setEducationLevel] = useState(user?.education_level || 'Class 10 Passed');
  const [district, setDistrict] = useState(user?.district || 'Medak');
  const [state, setState] = useState(user?.state || 'Telangana');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('Profile updated', 'Your academic profile and preferences have been preserved.');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        subtitle="Manage your personal background, academic credentials, and family linkage."
        badge={<StatusBadge status="success" label="Active Profile" />}
        breadcrumbs={[
          { label: 'Student', href: '/student' },
          { label: 'My Profile' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Academic & Personal Form */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Academic & Personal Details">
            <Card padding="lg">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    leftIcon={<User className="h-4 w-4" />}
                  />
                  <Input
                    label="Email Address"
                    value={user?.email || 'student@sih.gov.in'}
                    disabled
                    helperText="Managed by platform administrator"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Education Level"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    options={[
                      { value: 'Class 8 Passed', label: 'Class 8 Passed' },
                      { value: 'Class 10 Passed', label: 'Class 10 Passed' },
                      { value: 'Class 12 (Science)', label: 'Class 12 (Science)' },
                      { value: 'Class 12 (Arts/Commerce)', label: 'Class 12 (Arts/Commerce)' },
                      { value: 'ITI Trainee', label: 'ITI Trainee' },
                    ]}
                  />

                  <Input
                    label="Contact Phone"
                    value={user?.phone || '+91 98765 43210'}
                    disabled
                    helperText="Verified via OTP"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="District"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    leftIcon={<MapPin className="h-4 w-4" />}
                  />
                  <Input
                    label="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    leftIcon={<MapPin className="h-4 w-4" />}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" isLoading={isSaving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </Section>

          {/* Interests & Skills */}
          <Section title="Vocational Interests & Competencies">
            <Card padding="md" className="space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Expressed Interests
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="pill">Solar Energy</Badge>
                  <Badge variant="pill">Electrical Circuitry</Badge>
                  <Badge variant="pill">Hands-on Maintenance</Badge>
                  <Badge variant="pill">Green Tech</Badge>
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Aptitude Strengths
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="neutral">Mechanical Reasoning (88%)</Badge>
                  <Badge variant="neutral">Spatial Visualization (82%)</Badge>
                  <Badge variant="neutral">Practical Problem Solving (90%)</Badge>
                </div>
              </div>
            </Card>
          </Section>
        </div>

        {/* Right Column: Family Context & Data Privacy */}
        <div className="space-y-6">
          <Section title="Family Unit Linkage">
            <Card padding="md" className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                  SS
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">Sunita Sharma</div>
                  <div className="text-xs text-text-secondary">Mother • Linked Guardian</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background-elevated border border-border text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-text-muted">Family Reference ID:</span>
                  <span className="font-mono text-text-primary font-semibold">FAM-9042</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Decision Status:</span>
                  <span className="text-emerald-400 font-semibold">Aligned</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Last Voice Consultation:</span>
                  <span className="text-text-primary">Yesterday, 4:15 PM</span>
                </div>
              </div>

              <p className="text-xs text-text-secondary">
                Parental queries and career facts are synchronized within this verified family unit.
              </p>
            </Card>
          </Section>

          <Section title="Data Privacy Guarantee">
            <Card padding="md" className="space-y-2 border-emerald-950/60 bg-emerald-950/10">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero Aadhaar Protocol</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                In strict compliance with statutory guidelines, this platform never collects, stores, or processes Aadhaar numbers, biometric proofs, or identity documents.
              </p>
            </Card>
          </Section>
        </div>
      </div>
    </div>
  );
};
