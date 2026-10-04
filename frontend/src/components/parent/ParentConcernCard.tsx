import React, { useState } from 'react';
import {
  Coins,
  Briefcase,
  GraduationCap,
  Users,
  MapPin,
  Wrench,
  TrendingUp,
  HelpCircle,
  Volume2,
  VolumeX,
  ChevronRight,
} from 'lucide-react';
import type { ParentConcernCardDef } from '@/types/parent';
import { useLanguage } from '@/context/LanguageContext';
import { voiceService } from '@/services/voice';

interface ParentConcernCardProps {
  card: ParentConcernCardDef;
  onSelect: (card: ParentConcernCardDef) => void;
  disabled?: boolean;
}

export const ParentConcernCard: React.FC<ParentConcernCardProps> = ({
  card,
  onSelect,
  disabled = false,
}) => {
  const { t, language } = useLanguage();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const getIcon = (name: string) => {
    const iconProps = { className: 'w-7 h-7 sm:w-8 sm:h-8 stroke-[2]' };
    switch (name) {
      case 'Coins':
        return <Coins {...iconProps} />;
      case 'Briefcase':
        return <Briefcase {...iconProps} />;
      case 'GraduationCap':
        return <GraduationCap {...iconProps} />;
      case 'Users':
        return <Users {...iconProps} />;
      case 'MapPin':
        return <MapPin {...iconProps} />;
      case 'Wrench':
        return <Wrench {...iconProps} />;
      case 'TrendingUp':
        return <TrendingUp {...iconProps} />;
      case 'HelpCircle':
      default:
        return <HelpCircle {...iconProps} />;
    }
  };

  const title = t(card.titleKey);
  const subtitle = t(card.subtitleKey);

  const handleReadAloud = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      voiceService.stopSpeaking();
      setIsPlaying(false);
      return;
    }

    voiceService.stopSpeaking();
    setIsPlaying(true);
    const textToRead = `${title}. ${subtitle}`;

    voiceService.speak(
      textToRead,
      language,
      () => setIsPlaying(false),
      () => setIsPlaying(false)
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && onSelect(card)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          onSelect(card);
        }
      }}
      aria-label={`${title}: ${subtitle}`}
      className={`relative group w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none
        bg-white hover:bg-slate-50/80 active:scale-[0.99]
        border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs
        focus:outline-hidden focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-3.5 sm:gap-4.5">
        {/* Large Visual Icon Pill with Warm Tone */}
        <div
          className={`flex-shrink-0 w-13 h-13 sm:w-15 sm:h-15 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${card.accentColor}`}
        >
          {getIcon(card.iconName)}
        </div>

        {/* Minimal High-Clarity Text (Low-Literacy Friendly) */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors leading-snug truncate">
              {title}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-2 mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Action Controls: Audio Read-Aloud + Forward Arrow */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pl-1">
          {/* Read Aloud Affordance Button for Low-Literacy / Audio preference */}
          {voiceService.isTtsSupported() && (
            <button
              type="button"
              onClick={handleReadAloud}
              aria-label={isPlaying ? t('playingAudio') : t('readAloud')}
              title={isPlaying ? t('playingAudio') : t('readAloud')}
              className={`p-2.5 rounded-xl border transition-colors flex items-center justify-center
                ${
                  isPlaying
                    ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200/90 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
            >
              {isPlaying ? (
                <VolumeX className="w-4 h-4 text-amber-800" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-600 group-hover:text-slate-800" />
              )}
            </button>
          )}

          <div className="p-1.5 text-slate-400 group-hover:text-blue-600 transition-colors hidden xs:block">
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
