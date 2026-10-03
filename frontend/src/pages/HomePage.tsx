import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Compass,
  Users,
  Shield,
  ArrowRight,
  Database,
  BookOpen,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  // If already authenticated, redirect appropriately to the user's role workspace
  if (isAuthenticated && user) {
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (user.role === 'parent') return <Navigate to="/parent" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      {/* Hero Section */}
      <section className="text-center space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-border/50 text-xs text-text-secondary select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{t('govInitiative')}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-text-primary tracking-tight leading-tight">
          {language === 'te'
            ? 'ధృవీకరించబడిన వృత్తి విద్యా మార్గాలు & కుటుంబ నిర్ణయ వేదిక'
            : 'Data-Driven Vocational Pathways & Family Decision Support'}
        </h1>

        <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
          {language === 'te'
            ? '10,000+ నిజమైన రికార్డుల ఆధారంగా విద్యార్థుల కెరీర్ అన్వేషణ మరియు తల్లిదండ్రుల సందేహాలకు వాస్తవ సమాధానాలు.'
            : 'Bridging the gap between student aspirations and parental confidence with genuine placement benchmarks, wage progression, and credit transfer paths.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isAuthenticated && user ? (
            <Link to={user.role === 'student' ? '/student' : user.role === 'parent' ? '/parent' : '/admin'}>
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                {t('goToDashboard')} ({user.role.toUpperCase()})
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  {t('login')} to Platform
                </Button>
              </Link>
              <Link to="/student">
                <Button size="lg" variant="outline">
                  Explore as Student
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* 3 Portal Entry Gates */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Portal Card */}
        <Link to="/student" className="group">
          <Card
            padding="lg"
            variant="interactive"
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] text-brand-300 flex items-center justify-center">
                <Compass className="h-5 w-5" />
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t('studentRole')}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mt-1">
                  Career Exploration
                </h3>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                Discover 15 vocational trades across 18 states. Review entry salaries, NSQF accreditation, and progression to B.Voc degrees.
              </p>
            </div>

            <div className="pt-6 flex items-center gap-1 text-xs font-medium text-brand-300 group-hover:translate-x-1 transition-transform">
              <span>Open Student Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Card>
        </Link>

        {/* Parent Portal Card */}
        <Link to="/parent" className="group">
          <Card
            padding="lg"
            variant="interactive"
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] text-emerald-400 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t('parentRole')}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mt-1">
                  Family Harmony & Voice
                </h3>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                Simple, high-clarity answers in Telugu and English. Speak your questions on job security, tuition stipends, and factory workplace safety.
              </p>
            </div>

            <div className="pt-6 flex items-center gap-1 text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Open Parent Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Card>
        </Link>

        {/* Admin Portal Card */}
        <Link to="/admin" className="group">
          <Card
            padding="lg"
            variant="interactive"
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] text-slate-300 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t('adminRole')}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mt-1">
                  Oversight & Escalations
                </h3>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                Information-dense dashboard tracking 10,000 empirical trainee records, regional coverage, and active human counsellor escalations.
              </p>
            </div>

            <div className="pt-6 flex items-center gap-1 text-xs font-medium text-text-primary group-hover:translate-x-1 transition-transform">
              <span>Open Admin Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Card>
        </Link>
      </section>

      {/* Trust & Empirical Foundation Banner */}
      <section className="p-6 sm:p-7 rounded-xl bg-background-card border border-border/60 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/30">
          <div>
            <span className="text-xs font-medium text-emerald-400">
              Empirical Fact Architecture
            </span>
            <h3 className="text-lg font-semibold text-text-primary mt-0.5">
              Zero Speculation. Zero Hallucination.
            </h3>
          </div>
          <StatusBadge status="success" label="10,000 Records Verified" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-white/[0.02] border border-border/30 space-y-1.5">
            <div className="font-semibold text-text-primary flex items-center gap-1.5">
              <Database className="h-4 w-4 text-brand-300" />
              <span>DGT / NSDC Dataset</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Real career outcomes derived from genuine trainees across 18 states and 120 districts.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-white/[0.02] border border-border/30 space-y-1.5">
            <div className="font-semibold text-text-primary flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              <span>NCrF Mobility</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Every vocational qualification maps to academic credits for diploma and degree continuation.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-white/[0.02] border border-border/30 space-y-1.5">
            <div className="font-semibold text-text-primary flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-slate-300" />
              <span>Zero Aadhaar Protocol</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Full statutory compliance with zero storage or processing of Aadhaar identity proofs.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-white/[0.02] border border-border/30 space-y-1.5">
            <div className="font-semibold text-text-primary flex items-center gap-1.5">
              <PhoneCall className="h-4 w-4 text-amber-400" />
              <span>Human Safety Net</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Complex parental hesitations are escalated to certified human psychologists and counsellors.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
