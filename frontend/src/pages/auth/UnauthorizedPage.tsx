import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'student') {
      navigate('/student');
    } else if (user.role === 'parent') {
      navigate('/parent');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return (
    <Card padding="lg" className="border-border-strong text-center shadow-glass space-y-5">
      <div className="mx-auto w-14 h-14 rounded-full bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400">
        <ShieldAlert className="h-7 w-7" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-text-primary">
          {t('unauthorizedTitle')}
        </h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto">
          {t('unauthorizedDesc')}
        </p>
      </div>

      {user && (
        <div className="p-3 rounded-lg bg-background-elevated border border-border text-xs text-text-muted">
          Current Active Session: <span className="font-semibold text-text-primary capitalize">{user.role}</span> ({user.name})
        </div>
      )}

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="primary"
          onClick={handleGoHome}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          {t('goToDashboard')}
        </Button>
      </div>
    </Card>
  );
};
