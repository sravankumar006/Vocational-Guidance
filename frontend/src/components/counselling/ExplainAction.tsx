import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, HelpCircle } from 'lucide-react';
import type { CounsellingIntent, CounsellingEntityType, CounsellingContext } from '@/types/counselling';
import { useAuth } from '@/context/AuthContext';

export interface ExplainActionProps {
  /** The structured vocational explanation intent (Brick 26) */
  intent: CounsellingIntent;
  /** Domain classification of the entity */
  entityType: CounsellingEntityType;
  /** Primary identifier of the entity (occupation, course, metric, etc.) */
  entityId: string | number;
  /** Optional human-readable title for conversational attribution */
  entityTitle?: string;
  /** Action label (e.g. "Explain", "Explain this", "Explain this path") */
  label?: string;
  /** Optional role override ('student' | 'parent') */
  targetRole?: 'student' | 'parent';
  /** Visual presentation style */
  variant?: 'primary' | 'secondary' | 'outline' | 'badge' | 'ghost';
  /** Button sizing */
  size?: 'xs' | 'sm' | 'md';
  /** Extra CSS classes */
  className?: string;
  /** Optional custom icon */
  icon?: React.ReactNode;
  /** Prevent event propagation for buttons nested inside clickable cards */
  stopPropagation?: boolean;
}

/**
 * Reusable ExplainAction Component (Brick 26 — Contextual Explain -> AI Counsellor).
 *
 * Connects any factual card (career, course, salary, placement, training duration,
 * career pathway ladder, job availability, or NSQF level) directly to the existing
 * AI counselling system without opening a blank chatbot.
 *
 * Transfers minimum identifying context via route state (no database records or sensitive data in URL).
 */
export const ExplainAction: React.FC<ExplainActionProps> = ({
  intent,
  entityType,
  entityId,
  entityTitle,
  label = 'Explain',
  targetRole,
  variant = 'outline',
  size = 'sm',
  className = '',
  icon,
  stopPropagation = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleExplain = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      e.stopPropagation();
    }

    // Determine target counselling route based on role or active location
    const isParentContext =
      targetRole === 'parent' ||
      user?.role === 'parent' ||
      location.pathname.startsWith('/parent');

    const targetRoute = isParentContext ? '/parent/counselling' : '/student/counselling';

    const explainPayload: CounsellingContext = {
      intent,
      entity_type: entityType,
      entity_id: String(entityId),
      entity_title: entityTitle,
    };

    // Navigate with structured context in route state (zero sensitive data in URL)
    navigate(targetRoute, {
      state: {
        explainContext: explainPayload,
      },
    });
  };

  // Size styles
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-sm gap-2',
  }[size];

  // Variant styles
  const variantClasses = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-800 shadow-xs border border-transparent font-semibold',
    secondary:
      'bg-blue-50 text-blue-700 hover:bg-blue-100/90 border border-blue-200/80 font-semibold',
    outline:
      'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-300 font-medium shadow-2xs',
    badge:
      'bg-amber-50/80 text-amber-900 hover:bg-amber-100 border border-amber-200/70 font-semibold rounded-full',
    ghost:
      'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium',
  }[variant];

  const defaultIcon =
    variant === 'badge' ? (
      <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
    ) : (
      <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
    );

  return (
    <button
      type="button"
      onClick={handleExplain}
      className={`inline-flex items-center justify-center rounded-lg transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 ${sizeClasses} ${variantClasses} ${className}`}
      title={`Ask AI Counsellor to explain ${entityTitle || entityType}`}
      aria-label={`Explain ${entityTitle || entityType} with AI Counsellor`}
    >
      {icon || defaultIcon}
      <span className="leading-none">{label}</span>
    </button>
  );
};
