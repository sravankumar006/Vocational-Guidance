import React, { useState, useEffect } from 'react';
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
  const { user, isAuthenticated, login, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect to appropriate role portal
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'student') navigate('/student', { replace: true });
      else if (user.role === 'parent') navigate('/parent', { replace: true });
      else if (user.role === 'admin') navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    try {
      const authenticatedUser = await login(identifier, password);
      redirectByRole(authenticatedUser.role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to authenticate. Please check your credentials.');
    }
  };

  const fillTestCredentials = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setErrorMsg(null);
  };

  return (
    <Card padding="lg" className="border-border/60 shadow-glass">
      {/* Title & Platform Identity */}
      <div className="text-center mb-6 space-y-1">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          {language === 'te' ? 'మార్గదర్శక్ పోర్టల్ లాగిన్' : 'Sign In to Margadarshak'}
        </h1>
        <p className="text-xs text-text-secondary">
          {language === 'te'
            ? 'విద్యార్థులు మరియు కుటుంబాలకు వృత్తి విద్యా మార్గదర్శనం'
            : 'Career guidance for students, parents, and administrators'}
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

      {/* Development Account Quick-Fill */}
      <div className="mt-6 pt-5 border-t border-border/30">
        <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted text-center mb-2.5">
          {language === 'te' ? 'పరీక్ష ఖాతా ఆధారాలు' : 'Fill Development Credentials'}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillTestCredentials('student@sih.gov.in', 'Margadarshak@2026')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-border/30 hover:border-border/60 text-text-secondary hover:text-text-primary transition-all text-center"
          >
            <Compass className="h-4 w-4 mb-1 text-slate-400" />
            <span className="text-xs font-medium">Student</span>
          </button>

          <button
            type="button"
            onClick={() => fillTestCredentials('parent@sih.gov.in', 'Margadarshak@2026')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-border/30 hover:border-border/60 text-text-secondary hover:text-text-primary transition-all text-center"
          >
            <Users className="h-4 w-4 mb-1 text-slate-400" />
            <span className="text-xs font-medium">Parent</span>
          </button>

          <button
            type="button"
            onClick={() => fillTestCredentials('admin@sih.gov.in', 'Margadarshak@2026')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-border/30 hover:border-border/60 text-text-secondary hover:text-text-primary transition-all text-center"
          >
            <Shield className="h-4 w-4 mb-1 text-slate-400" />
            <span className="text-xs font-medium">Admin</span>
          </button>
        </div>
      </div>
    </Card>
  );
};
