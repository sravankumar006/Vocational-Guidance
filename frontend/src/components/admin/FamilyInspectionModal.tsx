import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Users, GraduationCap, Briefcase, MapPin, ShieldCheck } from 'lucide-react';
import type { AdminFamilyItem } from '@/types/admin';

interface FamilyInspectionModalProps {
  family: AdminFamilyItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyInspectionModal: React.FC<FamilyInspectionModalProps> = ({
  family,
  isOpen,
  onClose,
}) => {
  if (!family) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${family.name} (${family.id})`}
      description="Administrative inspection of registered family members, linked vocational pathways, and engagement telemetry."
      size="lg"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {/* Top Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-border/40 text-xs">
          <div>
            <div className="text-text-muted text-[11px]">Family ID</div>
            <div className="font-semibold text-text-primary mt-0.5">{family.id}</div>
          </div>
          <div>
            <div className="text-text-muted text-[11px]">Total Members</div>
            <div className="font-semibold text-text-primary mt-0.5">
              {family.students_count + family.parents_count} Members
            </div>
          </div>
          <div>
            <div className="text-text-muted text-[11px]">Status</div>
            <div className="mt-0.5">
              <StatusBadge
                status={family.status.toLowerCase() === 'active' ? 'success' : 'neutral'}
                label={family.status}
              />
            </div>
          </div>
          <div>
            <div className="text-text-muted text-[11px]">Last Activity</div>
            <div className="font-medium text-text-secondary mt-0.5">{family.last_activity}</div>
          </div>
        </div>

        {/* Students in Family */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary uppercase tracking-wider">
            <GraduationCap className="h-4 w-4 text-accent" />
            <span>Associated Students ({family.students.length})</span>
          </div>

          {family.students.length === 0 ? (
            <p className="text-xs text-text-muted italic">No students linked to this family record.</p>
          ) : (
            <div className="space-y-2">
              {family.students.map((student) => (
                <div
                  key={student.id}
                  className="p-3.5 rounded-xl bg-white/[0.01] border border-border/50 hover:border-border/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-primary">{student.name}</span>
                      <Badge variant="outline" size="sm">ID #{student.id}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                      {student.education_level && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 text-text-muted" />
                          <span>{student.education_level}</span>
                        </span>
                      )}
                      {student.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-text-muted" />
                          <span>{student.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {student.career_interest && (
                    <div className="sm:text-right">
                      <div className="text-[11px] text-text-muted">Target Vocational Career</div>
                      <div className="text-xs font-medium text-accent mt-0.5 flex items-center sm:justify-end gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{student.career_interest}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parents / Guardians in Family */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-primary uppercase tracking-wider">
            <Users className="h-4 w-4 text-accent" />
            <span>Associated Parents / Guardians ({family.parents.length})</span>
          </div>

          {family.parents.length === 0 ? (
            <p className="text-xs text-text-muted italic">No parents linked to this family record.</p>
          ) : (
            <div className="space-y-2">
              {family.parents.map((parent) => (
                <div
                  key={parent.id}
                  className="p-3.5 rounded-xl bg-white/[0.01] border border-border/50 hover:border-border/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-primary">{parent.name}</span>
                      <Badge variant="default" size="sm">{parent.relationship || 'Guardian'}</Badge>
                    </div>
                    <div className="text-xs text-text-secondary flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      <span>Legally verified family association</span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-[11px] text-text-muted">Occupation</div>
                    <div className="text-xs text-text-secondary font-medium mt-0.5">
                      {parent.occupation || 'Employed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
