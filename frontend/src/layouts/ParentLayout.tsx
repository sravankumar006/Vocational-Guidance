import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NavigationItem } from '@/types';
import { Home, HelpCircle, MessageSquare, Mic, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export const ParentLayout: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const parentNavItems: NavigationItem[] = [
    { label: 'Home', labelTe: 'హోమ్', href: '/parent', icon: Home },
    { label: 'Family Concerns', labelTe: 'కుటుంబ సందేహాలు', href: '/parent/concerns', icon: HelpCircle },
    { label: 'Voice & Guidance', labelTe: 'వాయిస్ కౌన్సెలింగ్', href: '/parent/counselling', icon: MessageSquare },
  ];

  const handleVoiceTap = () => {
    setVoiceModalOpen(true);
    setIsRecording(true);
    // Simulate audio listening feedback
    setTimeout(() => {
      setIsRecording(false);
    }, 3000);
  };

  return (
    <AppShell
      navigationItems={parentNavItems}
      sidebarTitle="Parent Decision Support"
      sidebarFooter={
        <div className="p-2.5 rounded-lg bg-white/[0.03] border border-border/30">
          <div className="text-xs font-medium text-text-primary">Aarav Sharma</div>
          <div className="text-[11px] text-text-secondary">Class 10 • Medak, Telangana</div>
        </div>
      }
    >
      {/* Prominent Parent Voice Trigger Banner */}
      <div className="mb-6 p-4 sm:p-5 rounded-xl bg-background-card border border-border/60 shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-soft">
            <Mic className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-text-primary">
              {t('parentVoiceAction')}
            </div>
            <div className="text-xs sm:text-sm text-text-secondary mt-0.5">
              {t('parentVoiceSubtext')}
            </div>
          </div>
        </div>
        <Button
          size="xl"
          variant="primary"
          onClick={handleVoiceTap}
          leftIcon={<Mic className="h-5 w-5 animate-pulse text-white" />}
          className="shrink-0 w-full sm:w-auto"
        >
          {language === 'te' ? 'వాయిస్ ప్రశ్న అడగండి' : 'Ask Voice Question'}
        </Button>
      </div>

      <Outlet />

      {/* Voice Interaction Modal */}
      <Modal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        title={language === 'te' ? 'వాయిస్ సహాయం' : 'Voice Assistance'}
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-text-secondary">
              {language === 'te' ? 'తెలుగు / ఇంగ్లీష్ గుర్తించబడుతుంది' : 'Detecting Telugu / English'}
            </span>
            <Button
              variant="outline"
              onClick={() => {
                setVoiceModalOpen(false);
                navigate('/parent/counselling');
              }}
            >
              {language === 'te' ? 'కౌన్సెలింగ్‌కు వెళ్లండి' : 'Open Counselling Chat'}
            </Button>
          </div>
        }
      >
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all ${
              isRecording
                ? 'bg-status-error animate-pulse shadow-elevated scale-110'
                : 'bg-accent'
            }`}
          >
            <Mic className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-text-primary">
              {isRecording
                ? language === 'te'
                  ? 'మీ సందేహాన్ని చెప్పండి...'
                  : 'Listening to your question...'
                : language === 'te'
                ? 'ప్రశ్న ప్రాసెస్ చేయబడింది'
                : 'Question recognized'}
            </h4>
            <p className="text-sm text-text-secondary max-w-sm">
              {isRecording
                ? language === 'te'
                  ? 'ఉదాహరణ: "ఈ కోర్సు తర్వాత నెలకు ఎంత జీతం వస్తుంది?"'
                  : 'Example: "What is the expected salary after completing this course?"'
                : language === 'te'
                ? 'మీ ప్రశ్న: "ఈ కోర్సు పూర్తయిన తర్వాత ఉద్యోగ భద్రత ఎలా ఉంటుంది?"'
                : 'Recognized: "How secure is the job placement after this course?"'}
            </p>
          </div>
          {!isRecording && (
            <div className="p-3.5 rounded-xl bg-background-elevated border border-border text-xs text-text-primary text-left w-full space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Sparkles className="h-4 w-4" />
                <span>Verified Empirical Answer:</span>
              </div>
              <p className="text-text-secondary">
                In our verified database of 10,000 trainees, Solar PV Technicians have an 84% placement rate with starting salary between ₹18,000 and ₹24,000/month.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </AppShell>
  );
};
