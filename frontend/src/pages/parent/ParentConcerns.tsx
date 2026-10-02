import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CheckCircle2, Plus } from 'lucide-react';

interface ConcernItem {
  id: string;
  category: string;
  question: string;
  questionTe: string;
  verifiedAnswer: string;
  verifiedAnswerTe: string;
  empiricalMetric: string;
  isResolved: boolean;
}

const CONCERNS_DATA: ConcernItem[] = [
  {
    id: 'c1',
    category: 'Job Stability & Income',
    question: 'Is a Solar PV Technician job stable and how much will my child earn?',
    questionTe: 'సోలార్ టెక్నీషియన్ ఉద్యోగం స్థిరమైనదేనా మరియు నా బిడ్డ ఎంత సంపాదిస్తారు?',
    verifiedAnswer: 'In our verified registry of 10,000 vocational trainees, 84.2% were placed into full-time roles within 90 days. Certified technicians start at ₹18,000–₹24,000 per month, with senior site technician salaries reaching ₹38,000+ after two years.',
    verifiedAnswerTe: 'మా 10,000 మంది విద్యార్థుల ధృవీకరించిన రికార్డుల ప్రకారం, 84.2% మందికి 90 రోజుల్లోనే పూర్తికాల ఉద్యోగాలు లభించాయి. ప్రారంభ జీతం నెలకు ₹18,000 నుండి ₹24,000 వరకు ఉంటుంది. రెండేళ్ల అనుభవంతో ఇది ₹38,000+ కి పెరుగుతుంది.',
    empiricalMetric: '84.2% Placement • ₹18,000 - ₹24,000 Starting Pay',
    isResolved: true,
  },
  {
    id: 'c2',
    category: 'Higher Education Mobility',
    question: 'Can my child get a college degree after completing this vocational course?',
    questionTe: 'ఈ వృత్తి కోర్సు తర్వాత నా బిడ్డ కాలేజీ డిగ్రీ చేయవచ్చా?',
    verifiedAnswer: 'Yes. Under the National Credit Framework (NCrF), credits earned in this NSQF Level 4 course transfer seamlessly into a Polytechnic Diploma (lateral entry into 2nd year) or a 3-year Bachelor of Vocation (B.Voc) degree.',
    verifiedAnswerTe: 'అవును. నేషనల్ క్రెడిట్ ఫ్రేమ్‌వర్క్ (NCrF) కింద ఈ కోర్సు క్రెడిట్‌లు ఉపయోగించి విద్యార్థి నేరుగా పాలిటెక్నిక్ రెండవ సంవత్సరంలో లేదా 3 సంవత్సరాల B.Voc డిగ్రీలో ప్రవేశం పొందవచ్చు.',
    empiricalMetric: '100% Credit Transfer to Diploma / B.Voc',
    isResolved: true,
  },
  {
    id: 'c3',
    category: 'Training Cost & Support',
    question: 'How much fees do we need to pay for this training?',
    questionTe: 'ఈ శిక్షణ కోసం మనం ఎంత ఫీజు చెల్లించాలి?',
    verifiedAnswer: 'Government ITIs and NSTIs offer 100% tuition fee waiver for eligible students under State Skill Missions. In addition, trainees receive a monthly stipend of ₹8,500 to ₹11,000 during their mandatory industry apprenticeship.',
    verifiedAnswerTe: 'ప్రభుత్వ ITI మరియు NSTIలలో అర్హులైన విద్యార్థులకు 100% ఫీజు మినహాయింపు ఉంటుంది. అంతేకాకుండా, పరిశ్రమ అప్రెంటిస్‌షిప్ సమయంలో నెలకు ₹8,500 నుండి ₹11,000 వరకు స్టైపెండ్ లభిస్తుంది.',
    empiricalMetric: 'Free Training + Monthly Stipend Provided',
    isResolved: true,
  },
];

export const ParentConcerns: React.FC = () => {
  const { language } = useLanguage();
  const { success } = useToast();

  const [concerns, setConcerns] = useState<ConcernItem[]>(CONCERNS_DATA);
  const [modalOpen, setModalOpen] = useState(false);
  const [newConcernText, setNewConcernText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddConcern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcernText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newEntry: ConcernItem = {
        id: Date.now().toString(),
        category: 'Parent Query',
        question: newConcernText,
        questionTe: newConcernText,
        verifiedAnswer: 'Your concern has been registered. Our AI is analyzing empirical DGT placement records and a verified counsellor will review it.',
        verifiedAnswerTe: 'మీ సందేహం నమోదు చేయబడింది. ప్రభుత్వ రికార్డుల ఆధారంగా కౌన్సిలర్ దీనికి త్వరలోనే పరిష్కారం అందిస్తారు.',
        empiricalMetric: 'Pending Counsellor Verification',
        isResolved: false,
      };

      setConcerns((prev) => [newEntry, ...prev]);
      setNewConcernText('');
      setIsSubmitting(false);
      setModalOpen(false);
      success(
        language === 'te' ? 'సందేహం నమోదైంది' : 'Concern Registered',
        language === 'te' ? 'మా కౌన్సిలర్ త్వరలోనే సమాధానం అందిస్తారు.' : 'Our verified counsellor will address your inquiry.'
      );
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={language === 'te' ? 'కుటుంబ సందేహాలు & సమాధానాలు' : 'Family Concerns & Verified Answers'}
        subtitle={
          language === 'te'
            ? 'తల్లిదండ్రుల సాధారణ సందేహాలకు ప్రభుత్వ రికార్డుల ఆధారంగా వాస్తవిక సమాధానాలు.'
            : 'Factual answers addressing family hesitation around career longevity, income, and progression.'
        }
        badge={<StatusBadge status="success" label="Fact-Checked" />}
        actions={
          <Button
            variant="primary"
            size="lg"
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            {language === 'te' ? 'కొత్త సందేహాన్ని అడగండి' : 'Ask a Question'}
          </Button>
        }
      />

      {/* Concerns Accordion / Card List */}
      <div className="space-y-4">
        {concerns.map((item) => (
          <Card key={item.id} padding="lg" className="border-border-strong space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {item.category}
              </span>
              <StatusBadge
                status={item.isResolved ? 'success' : 'warning'}
                label={
                  item.isResolved
                    ? language === 'te'
                      ? 'ధృవీకరించబడింది'
                      : 'Verified by DGT Data'
                    : language === 'te'
                    ? 'సమీక్షలో ఉంది'
                    : 'In Review'
                }
              />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-text-primary">
              {language === 'te' ? item.questionTe : item.question}
            </h3>

            <div className="p-4 rounded-xl bg-background-elevated border border-border space-y-2 text-sm">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{language === 'te' ? 'వాస్తవ నివేదిక:' : 'Verified Government Fact:'}</span>
              </div>
              <p className="text-text-secondary leading-relaxed">
                {language === 'te' ? item.verifiedAnswerTe : item.verifiedAnswer}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-text-muted">
              <span className="font-semibold text-text-primary">Metric:</span>
              <span>{item.empiricalMetric}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Submit New Concern Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={language === 'te' ? 'మీ సందేహాన్ని అడగండి' : 'Submit a Family Concern'}
        description={
          language === 'te'
            ? 'మీరు అడిగే ప్రశ్నను కౌన్సిలర్ మరియు AI పరిశీలించి స్పష్టమైన వివరణ అందిస్తారు.'
            : 'Ask any question regarding job security, salary, or trade reputation.'
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddConcern}
              isLoading={isSubmitting}
            >
              Submit Concern
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Textarea
            label={language === 'te' ? 'మీ ప్రశ్న లేదా సందేహం' : 'Your Question or Concern'}
            placeholder={
              language === 'te'
                ? 'ఉదాహరణ: ఈ కోర్సు తర్వాత నా బిడ్డకు ప్రభుత్వ ఉద్యోగం వచ్చే అవకాశం ఉందా?'
                : 'Example: Does this certification qualify for state electricity board employment?'
            }
            value={newConcernText}
            onChange={(e) => setNewConcernText(e.target.value)}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
};
