import React from 'react';
import { User, Briefcase, MapPin, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ChildSummaryProps {
  childName?: string | null;
  careerTitle: string;
  hasCareer: boolean;
  relationshipType?: string | null;
  educationLevel?: string | null;
  location?: string | null;
}

export const ChildSummary: React.FC<ChildSummaryProps> = ({
  childName,
  careerTitle,
  hasCareer,
  relationshipType,
  educationLevel,
  location,
}) => {
  const { t, localizeName, localizeCareerTitle, localizeEducation, localizeLocation } = useLanguage();

  const getLocalizedRelationship = (rel?: string | null) => {
    if (!rel) return null;
    const lower = rel.toLowerCase();
    if (lower.includes('mother')) return t('relMother');
    if (lower.includes('father')) return t('relFather');
    if (lower.includes('guardian')) return t('relGuardian');
    return rel;
  };

  const localizedRel = getLocalizedRelationship(relationshipType);
  const displayName = localizeName(childName);
  const displayCareer = localizeCareerTitle(careerTitle);
  const displayEducation = localizeEducation(educationLevel);
  const displayLocation = localizeLocation(location);

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-2xs">
      {/* 1. Header Label */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 text-slate-700 border border-slate-200/70 text-xs font-medium tracking-wide uppercase">
        <User className="w-3.5 h-3.5 text-slate-600" />
        <span>{t('yourChild')}</span>
        {localizedRel && (
          <span className="text-slate-400 font-normal lowercase">• {localizedRel}</span>
        )}
      </div>

      {/* 2. Child Name */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          {displayName}
        </h1>

        {/* 3. Authoritative Career Title */}
        <div className="pt-1">
          {hasCareer ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-base md:text-lg">
              <Briefcase className="w-4 h-4 text-slate-600" />
              <span>{displayCareer}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-500 font-medium text-sm md:text-base">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{t('careerNotSelected')}</span>
            </div>
          )}
        </div>
      </div>


      {/* 4. Subtle Supporting Context */}
      {(displayEducation || displayLocation) && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs text-slate-500 font-normal">
          {displayEducation && (
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>{displayEducation}</span>
            </span>
          )}
          {displayEducation && displayLocation && <span className="text-slate-300">•</span>}
          {displayLocation && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{displayLocation}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
