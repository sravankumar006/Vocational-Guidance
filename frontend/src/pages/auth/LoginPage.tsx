import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { UserRole } from '@/types';
import { Compass, Users, Shield, Lock, User as UserIcon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const redirectByRole = (role: UserRole) => {
    const fromPath = (location.state as any)?.from?.pathname;
    if (fromPath && fromPath.startsWith(`/${role}`)) {
      navigate(fromPath, { replace: true });
      return;
    }

    if (role === 'student') navigate('/student', { replace: true });
    else if (role === 'parent') navigate('/parent', { replace: true });
    else if (role === 'admin') navigate('/admin', { replace: true });
    else navigate('/', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg('Please enter your phone number or email address');
      return;
    }

    try {
      const user = await login(identifier, password);
      redirectByRole(user.role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to authenticate. Please check your credentials.');
    }
  };

  const handleQuickRole = async (role: UserRole) => {
    setErrorMsg(null);
    try {
      const user = await login(undefined, undefined, role);
      redirectByRole(user.role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed');
    }
  };

  return (
    <Card padding="lg" className="border-border/60 shadow-glass">
      {/* Title & Platform Identity */}
      <div className="text-center mb-6 space-y-1">
        <h2 className="text-xl font-bold text-text-primary tracking-tight">
          {language === 'te' ? 'మార్గదర్శక్ పోర్టల్ లాగిన్' : 'Sign In to Margadarshak'}
        </h2>
        <p className="text-xs text-text-secondary">
          {language === 'te'
            ? 'విద్యార్థులు మరియు కుటుంబాలకు వృత్తి విద్యా మార్గదర్శనం'
            : 'Career guidance for students and families'}
        </p>
      </div>

      {errorMsg && (
        <Alert type="error" className="mb-4" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={language === 'te' ? 'ఫోన్ నంబర్ లేదా ఇమెయిల్' : 'Phone Number or Email'}
          placeholder={language === 'te' ? '+91 98765 43210 లేదా student@sih.gov.in' : '+91 98765 43210 or email'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          leftIcon={<UserIcon className="h-4 w-4" />}
          autoComplete="username"
        />

        <Input
          label={language === 'te' ? 'పాస్‌వర్డ్' : 'Password'}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-1"
          isLoading={loading}
        >
          {t('login')}
        </Button>
      </form>

      {/* Quick Role Access for Seamless Pairwise Collaboration */}
      <div className="mt-6 pt-5 border-t border-border/30">
        <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted text-center mb-2.5">
          {language === 'te' ? 'త్వరిత ప్రాప్యత (పరీక్ష కోసం)' : 'Quick Role Access'}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickRole('student')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-border/30 hover:border-border/60 text-text-secondary hover:text-text-primary transition-all text-center"
          >
            <Compass className="h-4 w-4 mb-1 text-slate-400" />
            <span className="text-xs font-medium">{t('studentRole')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickRole('parent')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-border/30 hover:border-border/60 text-text-secondary hover:text-text-primary transition-all text-center"
          >
            <Users className="h-4 w-4 mb-1 text-slate-400" />
            <span className="text-xs font-medium">{t('parentRole')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickRole('admin')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-border/30 hover:border-border/60 text-text-secondary hover:text-text-primary transition-all text-center"
          >
            <Shield className="h-4 w-4 mb-1 text-slate-400" />
            <span className="text-xs font-medium">{t('adminRole')}</span>
          </button>
        </div>
      </div>
    </Card>
  );
};
