import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/components/ui/Toast';
import { Send, Sparkles, UserCheck, Shield, CheckCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'student' | 'system';
  text: string;
  timestamp: string;
  citation?: string;
}

export const StudentCounselling: React.FC = () => {
  const { success } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Namaste Aarav! Based on your Class 10 scores and your interest in mechanical & electrical systems, I have mapped verified vocational options in Telangana.',
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      sender: 'student',
      text: 'My parents are worried about whether a vocational trade like Solar PV Technician offers long-term salary growth and stability.',
      timestamp: '10:32 AM',
    },
    {
      id: '3',
      sender: 'ai',
      text: 'That is a very common and valid family concern. In our verified DGT dataset of 10,000 trainees, Solar PV Technicians have an 84.2% placement rate. Starting salary is ₹18,000–₹24,000/mo, and certified technicians can progress to Senior Site Supervisors earning ₹40,000+ within 3 years. They can also pursue lateral entry into a B.Voc degree.',
      timestamp: '10:33 AM',
      citation: 'Source: DGT Empirical Placement Registry (SIH26241 Database)',
    },
  ]);

  const [input, setInput] = useState('');
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'student',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulated responsive AI feedback adhering to architecture guidelines
    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'I have noted your question. I am cross-referencing certified government apprenticeships and nearby NSTI centres to provide verified facts for you and your family.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citation: 'Verified against Telangana State Skill Mission data',
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 800);
  };

  const handleEscalateConfirm = () => {
    setEscalateDialogOpen(false);
    success('Consultation Requested', 'Your query has been escalated to a certified Government Vocational Counsellor.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career & Family Counselling"
        subtitle="AI-enabled guidance backed by empirical data and certified human counsellors."
        badge={<StatusBadge status="success" label="Active Session" />}
        breadcrumbs={[
          { label: 'Student', href: '/student' },
          { label: 'Counselling' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEscalateDialogOpen(true)}
            leftIcon={<UserCheck className="h-4 w-4 text-emerald-400" />}
          >
            Request Human Counsellor
          </Button>
        }
      />

      {/* Main Counselling Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Conversation Box */}
        <div className="lg:col-span-2 flex flex-col h-[600px] rounded-xl border border-border bg-background-card overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 bg-background-elevated border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">
                  Margadarshak AI Counsellor
                </div>
                <div className="text-[11px] text-text-muted">
                  Empirical Fact-Verified Mode
                </div>
              </div>
            </div>
            <StatusBadge status="info" label="Bilingual Supported" />
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  m.sender === 'student' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar
                  name={m.sender === 'student' ? 'Aarav Sharma' : 'AI'}
                  size="sm"
                  className={m.sender === 'ai' ? 'bg-accent text-white' : ''}
                />
                <div
                  className={`max-w-[80%] rounded-xl p-3.5 text-sm space-y-1.5 ${
                    m.sender === 'student'
                      ? 'bg-accent text-white rounded-tr-none'
                      : 'bg-background-elevated border border-border text-text-primary rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  {m.citation && (
                    <div className="text-[11px] text-emerald-400 font-medium pt-1 border-t border-border/40 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 shrink-0" />
                      <span>{m.citation}</span>
                    </div>
                  )}
                  <div
                    className={`text-[10px] text-right ${
                      m.sender === 'student' ? 'text-slate-200' : 'text-text-muted'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-background-elevated border-t border-border flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about trade qualifications, salary, or parent queries..."
              className="flex-1 bg-background-card text-text-primary placeholder:text-text-muted border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Send className="h-3.5 w-3.5" />}
            >
              Send
            </Button>
          </form>
        </div>

        {/* Right Panel: Family Harmony & Escalation Info */}
        <div className="space-y-5">
          <Card padding="md" className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">
              Family Discussion Points
            </h4>
            <div className="space-y-2 text-xs text-text-secondary">
              <div className="p-2.5 rounded-lg bg-background-elevated border border-border space-y-1">
                <span className="font-semibold text-text-primary">Job Stability:</span>
                <p>84% placement rate in certified renewable energy trades.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-background-elevated border border-border space-y-1">
                <span className="font-semibold text-text-primary">Higher Education:</span>
                <p>Option for lateral entry into B.Voc / Polytechnic diploma.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-background-elevated border border-border space-y-1">
                <span className="font-semibold text-text-primary">Stipend & Subsidy:</span>
                <p>100% government tuition waiver + monthly apprenticeship stipend.</p>
              </div>
            </div>
          </Card>

          <Card padding="md" className="space-y-3 border-border">
            <h4 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-brand-300" />
              <span>Human Counsellor Support</span>
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              If you or your parents need a one-on-one call with a certified vocational psychologist or ITI principal, request a human escalation anytime.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setEscalateDialogOpen(true)}
            >
              Request Call Consultation
            </Button>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog for Human Escalation */}
      <ConfirmationDialog
        isOpen={escalateDialogOpen}
        onClose={() => setEscalateDialogOpen(false)}
        onConfirm={handleEscalateConfirm}
        title="Request Human Counsellor Consultation"
        message="A certified vocational education counsellor will review your session history and schedule a family guidance phone consultation within 24 hours."
        confirmText="Schedule Consultation"
      />
    </div>
  );
};
