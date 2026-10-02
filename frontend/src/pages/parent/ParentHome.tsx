import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Briefcase,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  PhoneCall,
  CheckCircle,
} from 'lucide-react';

export const ParentHome: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-7 max-w-4xl mx-auto">
      {/* Primary Section: What is my child planning to do? */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
            {t('parentQuestion')}
          </h2>
          <StatusBadge status="success" label="Active Track" />
        </div>
        <p className="text-sm text-text-secondary">
          {t('parentChildSummary')}
        </p>

        {/* Child Plan Highlight Card */}
        <Card padding="lg" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div>
              <div className="text-xs text-text-muted uppercase font-medium">
                {language === 'te' ? 'విద్యార్థి పేరు' : 'Student Name'}
              </div>
              <div className="text-base font-semibold text-text-primary">
                Aarav Sharma (Class 10)
              </div>
            </div>
            <div className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5 self-start sm:self-auto">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>{language === 'te' ? 'ప్రభుత్వ ధృవీకరించిన కోర్సు' : 'Government Verified'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs text-text-muted uppercase font-medium">
              {language === 'te' ? 'ఎంచుకున్న వృత్తి కోర్సు' : 'Chosen Vocational Trade'}
            </div>
            <div className="text-lg sm:text-xl font-semibold text-text-primary">
              Solar PV Installation & Maintenance Technician
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {language === 'te'
                ? 'ఈ కోర్సు ద్వారా విద్యార్థి సోలార్ ప్యానెల్స్ అమర్చడం, ఇన్వర్టర్లు రిపేర్ చేయడం మరియు గ్రీన్ ఎనర్జీ సంస్థల్లో పనిచేయడం నేర్చుకుంటారు.'
                : 'Practical skill certification in solar panel installation, inverter maintenance, and green energy power generation.'}
            </p>
          </div>
        </Card>
      </div>

      {/* 3 Large Touch Cards: What Parents Want to Know */}
      <div className="space-y-3.5">
        <h3 className="text-base font-semibold text-text-primary">
          {language === 'te' ? 'మీ ముఖ్యమైన సందేహాలు — వాస్తవ సమాచారం' : 'Key Questions Parents Ask — Verified Facts'}
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {/* Question 1: Salary & Stability */}
          <Link to="/parent/concerns">
            <Card
              padding="md"
              variant="interactive"
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] text-emerald-400 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-base font-semibold text-text-primary">
                  {t('parentSalaryConcern')}
                </div>
                <div className="text-sm text-text-secondary leading-relaxed">
                  {language === 'te'
                    ? 'ధృవీకరించబడిన డేటా ప్రకారం, ప్రారంభ జీతం ₹18,000 నుండి ₹24,000 వరకు ఉంటుంది. 84% మంది విద్యార్థులకు మొదటి 90 రోజుల్లోనే ఉద్యోగం లభిస్తుంది.'
                    : 'Verified records show median starting salary is ₹18,000 - ₹24,000/mo with 84.2% direct placement.'}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted shrink-0 mt-2" />
            </Card>
          </Link>

          {/* Question 2: Higher Education */}
          <Link to="/parent/concerns">
            <Card
              padding="md"
              variant="interactive"
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] text-brand-300 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-base font-semibold text-text-primary">
                  {t('parentProgressionConcern')}
                </div>
                <div className="text-sm text-text-secondary leading-relaxed">
                  {language === 'te'
                    ? 'అవును. నేషనల్ క్రెడిట్ ఫ్రేమ్‌వర్క్ (NCrF) ద్వారా విద్యార్థి నేరుగా పాలిటెక్నిక్ లేదా B.Voc డిగ్రీలో చేరవచ్చు.'
                    : 'Yes. Trainees can progress via lateral entry to a Polytechnic Diploma or B.Voc degree with full credit transfer.'}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted shrink-0 mt-2" />
            </Card>
          </Link>

          {/* Question 3: Safety & Environment */}
          <Link to="/parent/concerns">
            <Card
              padding="md"
              variant="interactive"
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] text-slate-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-base font-semibold text-text-primary">
                  {t('parentSafetyConcern')}
                </div>
                <div className="text-sm text-text-secondary leading-relaxed">
                  {language === 'te'
                    ? 'అన్ని శిక్షణా సంస్థలు ప్రభుత్వ భద్రతా ప్రమాణాలను పాటిస్తాయి. పూర్తి టూల్ కిట్ మరియు ప్రమాద బీమా సౌకర్యం ఉంటుంది.'
                    : '100% compliant with National Safety Standards. Safety gear, medical insurance, and regulated work sites provided.'}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-text-muted shrink-0 mt-2" />
            </Card>
          </Link>
        </div>
      </div>

      {/* Direct Counsellor Call Action */}
      <div className="p-5 rounded-xl bg-background-card border border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-base font-semibold text-text-primary">
            {language === 'te' ? 'కౌన్సెలర్‌తో మాట్లాడాలనుకుంటున్నారా?' : 'Would you like to speak to a human counsellor?'}
          </div>
          <p className="text-xs text-text-secondary">
            {language === 'te'
              ? 'ఉచిత ప్రభుత్వ టోల్-ఫ్రీ లేదా నేరుగా కాల్ సంప్రదింపు సౌకర్యం అందుబాటులో ఉంది.'
              : 'Free government consultation available in Telugu and English.'}
          </p>
        </div>

        <Link to="/parent/counselling">
          <Button
            size="lg"
            variant="outline"
            leftIcon={<PhoneCall className="h-4 w-4 text-emerald-400" />}
            className="w-full sm:w-auto"
          >
            {t('parentTalkCounsellor')}
          </Button>
        </Link>
      </div>
    </div>
  );
};
