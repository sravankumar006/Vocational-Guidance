import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Volume2, PhoneCall, Send } from 'lucide-react';

interface ParentMessage {
  id: string;
  sender: 'ai' | 'parent';
  text: string;
  textTe: string;
  timestamp: string;
}

export const ParentCounselling: React.FC = () => {
  const { language } = useLanguage();
  const { success, info } = useToast();

  const [messages, setMessages] = useState<ParentMessage[]>([
    {
      id: 'p1',
      sender: 'ai',
      text: 'Namaste Sunita ji. I am your Family Decision-Support Assistant. Aarav is exploring the Solar PV Installation trade. How can I assist your family today?',
      textTe: 'నమస్కారం సునీత గారు. నేను మీ కుటుంబ నిర్ణయ సహాయకుడిని. ఆరవ్ సోలార్ పీవీ టెక్నీషియన్ కోర్సును ఎంచుకోవాలనుకుంటున్నారు. ఈ రోజు మీ కుటుంబానికి నేను ఎలా సహాయపడగలను?',
      timestamp: '11:00 AM',
    },
    {
      id: 'p2',
      sender: 'parent',
      text: 'Will this skill be useful 5 or 10 years from now, or will it become outdated?',
      textTe: 'ఈ నైపుణ్యం 5 లేదా 10 సంవత్సరాల తర్వాత కూడా ఉపయోగపడుతుందా, లేక విలువ తగ్గిపోతుందా?',
      timestamp: '11:02 AM',
    },
    {
      id: 'p3',
      sender: 'ai',
      text: 'Solar energy and renewable power generation are expanding rapidly across India. Under national green energy targets, demand for certified technicians will grow by over 30% through 2035. Experienced technicians transition to maintenance contractors and project supervisors.',
      textTe: 'భారతదేశంలో సౌర శక్తి మరియు పునరుత్పాదక ఇంధన ప్రాజెక్టులు వేగంగా విస్తరిస్తున్నాయి. 2035 వరకు ధృవీకరించబడిన టెక్నీషియన్ల అవసరం 30% పైగా పెరుగుతుంది. అనుభవంతో వీరు కాంట్రాక్టర్లుగా మరియు ప్రాజెక్ట్ సూపర్‌వైజర్లుగా ఎదగవచ్చు.',
      timestamp: '11:03 AM',
    },
  ]);

  const [inputText, setInputText] = useState('');

  const handleSpeakAudio = (_msg: ParentMessage) => {
    info(
      language === 'te' ? 'ఆడియో ప్లే అవుతోంది' : 'Playing Audio',
      language === 'te' ? 'వాయిస్ సహాయం తెలుగులో చదవబడుతుంది.' : 'Reading answer in audio mode.'
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ParentMessage = {
      id: Date.now().toString(),
      sender: 'parent',
      text: inputText,
      textTe: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      const reply: ParentMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Thank you for your question. I am verifying this with the state vocational database and our counsellors.',
        textTe: 'మీ ప్రశ్నకు ధన్యవాదాలు. రాష్ట్ర వృత్తి విద్యా డేటా ఆధారంగా దీనిని పరిశీలిస్తున్నాము.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={language === 'te' ? 'కుటుంబ కౌన్సెలింగ్ సహాయం' : 'Family Guidance & Voice Support'}
        subtitle={
          language === 'te'
            ? 'తల్లిదండ్రుల ప్రశ్నలకు సరళమైన భాషలో మరియు వాయిస్ సహాయంతో ప్రత్యుత్తరాలు.'
            : 'Clear, reassuring answers designed for parents and guardians.'
        }
        badge={<StatusBadge status="info" label="Voice Enabled" />}
        actions={
          <Button
            variant="outline"
            size="lg"
            onClick={() => success('Callback Scheduled', 'A family counsellor will call you today.')}
            leftIcon={<PhoneCall className="h-5 w-5 text-emerald-400" />}
          >
            {language === 'te' ? 'ఉచిత ఫోన్ కాల్ కోరండి' : 'Request Free Phone Call'}
          </Button>
        }
      />

      {/* Parent Conversation Container */}
      <div className="rounded-2xl border border-border bg-background-card overflow-hidden flex flex-col h-[560px]">
        {/* Messages */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          {messages.map((m) => {
            const isParent = m.sender === 'parent';
            return (
              <div
                key={m.id}
                className={`flex gap-3.5 ${isParent ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <Avatar
                  name={isParent ? 'Sunita Sharma' : 'AI'}
                  size="md"
                  className={!isParent ? 'bg-accent text-white' : ''}
                />
                <div
                  className={`max-w-[85%] rounded-2xl p-4 sm:p-5 text-base sm:text-lg space-y-3 ${
                    isParent
                      ? 'bg-accent text-white rounded-tr-none'
                      : 'bg-background-elevated border border-border text-text-primary rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed">
                    {language === 'te' ? m.textTe : m.text}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <span className={isParent ? 'text-slate-200' : 'text-text-muted'}>
                      {m.timestamp}
                    </span>
                    {!isParent && (
                      <button
                        type="button"
                        onClick={() => handleSpeakAudio(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background-surface hover:bg-slate-700 text-brand-300 font-medium transition-colors"
                      >
                        <Volume2 className="h-4 w-4" />
                        <span>{language === 'te' ? 'వినండి' : 'Listen'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar with Large Voice & Text Actions */}
        <form
          onSubmit={handleSend}
          className="p-4 bg-background-elevated border-t border-border flex items-center gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'te'
                ? 'ఇక్కడ మీ ప్రశ్నను టైప్ చేయండి లేదా మైక్ నొక్కండి...'
                : 'Type your question here or speak...'
            }
            className="flex-1 bg-background-card text-text-primary text-base placeholder:text-text-muted border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            rightIcon={<Send className="h-5 w-5" />}
          >
            {language === 'te' ? 'పంపండి' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
};
