import React from 'react';
import {
  IndianRupee,
  ShieldCheck,
  GraduationCap,
  TrendingUp,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { ParentQuestionCard } from './ParentQuestionCard';
import { useLanguage } from '@/context/LanguageContext';
import type { ParentQuestionAction, ParentQuestionTopic } from '@/types/parent';

interface ParentQuestionGridProps {
  onSelectAction: (action: ParentQuestionAction) => void;
  isLoading?: boolean;
}

const getActionIcon = (id: ParentQuestionTopic): React.ReactNode => {
  switch (id) {
    case 'income':
      return <IndianRupee className="w-5 h-5" />;
    case 'job_security':
      return <ShieldCheck className="w-5 h-5" />;
    case 'further_education':
      return <GraduationCap className="w-5 h-5" />;
    case 'career_growth':
      return <TrendingUp className="w-5 h-5" />;
    case 'work_near_home':
      return <MapPin className="w-5 h-5" />;
    case 'talk_to_ai':
      return <MessageSquare className="w-5 h-5" />;
    default:
      return <MessageSquare className="w-5 h-5" />;
  }
};

export const ParentQuestionGrid: React.FC<ParentQuestionGridProps> = ({
  onSelectAction,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const actions: ParentQuestionAction[] = [
    {
      id: 'income',
      title: t('cardIncomeTitle'),
      description: t('cardIncomeDesc'),
      question: t('cardIncomeQuestion'),
      intent: 'explain_salary',
    },
    {
      id: 'job_security',
      title: t('cardJobSecurityTitle'),
      description: t('cardJobSecurityDesc'),
      question: t('cardJobSecurityQuestion'),
      intent: 'explain_placement',
    },
    {
      id: 'further_education',
      title: t('cardFurtherEducationTitle'),
      description: t('cardFurtherEducationDesc'),
      question: t('cardFurtherEducationQuestion'),
      intent: 'explain_training',
    },
    {
      id: 'career_growth',
      title: t('cardCareerGrowthTitle'),
      description: t('cardCareerGrowthDesc'),
      question: t('cardCareerGrowthQuestion'),
      intent: 'explain_pathway',
    },
    {
      id: 'work_near_home',
      title: t('cardWorkNearHomeTitle'),
      description: t('cardWorkNearHomeDesc'),
      question: t('cardWorkNearHomeQuestion'),
      intent: 'explain_career',
    },
    {
      id: 'talk_to_ai',
      title: t('cardTalkToAiTitle'),
      description: t('cardTalkToAiDesc'),
      question: null,
    },
  ];

  return (
    <section className="space-y-4" aria-labelledby="parent-questions-heading">
      <div className="text-center md:text-left space-y-1">
        <h2
          id="parent-questions-heading"
          className="text-lg md:text-xl font-bold text-slate-100 tracking-tight"
        >
          {t('whatWouldYouLikeToKnow')}
        </h2>
        <p className="text-xs md:text-sm text-slate-400 font-normal">
          {t('parentQuestionSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
        {actions.map((action) => (
          <ParentQuestionCard
            key={action.id}
            id={action.id}
            title={action.title}
            description={action.description}
            icon={getActionIcon(action.id)}
            onClick={() => onSelectAction(action)}
            disabled={isLoading}
          />
        ))}
      </div>
    </section>
  );
};

