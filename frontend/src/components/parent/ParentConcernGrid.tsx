import React from 'react';
import type { ParentConcernCardDef } from '@/types/parent';
import { ParentConcernCard } from './ParentConcernCard';

export const CONCERN_CARD_DEFINITIONS: ParentConcernCardDef[] = [
  {
    category: 'Income',
    intent: 'concern_income',
    titleKey: 'concernIncomeTitle',
    subtitleKey: 'concernIncomeSubtitle',
    questionKey: 'concernIncomeQuestion',
    iconName: 'Coins',
    accentColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200/80',
  },
  {
    category: 'Job Security',
    intent: 'concern_job_security',
    titleKey: 'concernJobSecurityTitle',
    subtitleKey: 'concernJobSecuritySubtitle',
    questionKey: 'concernJobSecurityQuestion',
    iconName: 'Briefcase',
    accentColor: 'bg-blue-100 text-blue-800 border border-blue-200/80',
  },
  {
    category: 'Further Education',
    intent: 'concern_further_education',
    titleKey: 'concernFurtherEducationTitle',
    subtitleKey: 'concernFurtherEducationSubtitle',
    questionKey: 'concernFurtherEducationQuestion',
    iconName: 'GraduationCap',
    accentColor: 'bg-purple-100 text-purple-800 border border-purple-200/80',
  },
  {
    category: 'Social Perception',
    intent: 'concern_social_perception',
    titleKey: 'concernSocialPerceptionTitle',
    subtitleKey: 'concernSocialPerceptionSubtitle',
    questionKey: 'concernSocialPerceptionQuestion',
    iconName: 'Users',
    accentColor: 'bg-rose-100 text-rose-800 border border-rose-200/80',
  },
  {
    category: 'Distance',
    intent: 'concern_distance',
    titleKey: 'concernDistanceTitle',
    subtitleKey: 'concernDistanceSubtitle',
    questionKey: 'concernDistanceQuestion',
    iconName: 'MapPin',
    accentColor: 'bg-amber-100 text-amber-800 border border-amber-200/80',
  },
  {
    category: 'Working Conditions',
    intent: 'concern_working_conditions',
    titleKey: 'concernWorkingConditionsTitle',
    subtitleKey: 'concernWorkingConditionsSubtitle',
    questionKey: 'concernWorkingConditionsQuestion',
    iconName: 'Wrench',
    accentColor: 'bg-teal-100 text-teal-800 border border-teal-200/80',
  },
  {
    category: 'Career Growth',
    intent: 'concern_career_growth',
    titleKey: 'concernCareerGrowthTitle',
    subtitleKey: 'concernCareerGrowthSubtitle',
    questionKey: 'concernCareerGrowthQuestion',
    iconName: 'TrendingUp',
    accentColor: 'bg-indigo-100 text-indigo-800 border border-indigo-200/80',
  },
  {
    category: 'Other',
    intent: 'concern_other',
    titleKey: 'concernOtherTitle',
    subtitleKey: 'concernOtherSubtitle',
    questionKey: 'concernOtherQuestion',
    iconName: 'HelpCircle',
    accentColor: 'bg-slate-100 text-slate-800 border border-slate-200/80',
  },
];

interface ParentConcernGridProps {
  onSelectConcern: (card: ParentConcernCardDef) => void;
  isLoading?: boolean;
}

export const ParentConcernGrid: React.FC<ParentConcernGridProps> = ({
  onSelectConcern,
  isLoading = false,
}) => {
  return (
    <div
      role="region"
      aria-label="Parent Concern Categories"
      className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto"
    >
      {CONCERN_CARD_DEFINITIONS.map((card) => (
        <ParentConcernCard
          key={card.category}
          card={card}
          onSelect={onSelectConcern}
          disabled={isLoading}
        />
      ))}
    </div>
  );
};
