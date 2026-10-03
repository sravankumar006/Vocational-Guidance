import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (isAuthenticated && user) {
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'parent') navigate('/parent');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card padding="lg" className="border-border/60 text-center shadow-glass space-y-6 max-w-md w-full">
        <div className="mx-auto w-16 h-16 rounded-full bg-white/[0.04] border border-border/60 flex items-center justify-center text-text-muted">
          <Compass className="h-8 w-8 text-accent" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            404 Error
          </span>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {language === 'te' ? 'పేజీ కనుగొనబడలేదు' : 'Page Not Found'}
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            {language === 'te'
              ? 'మీరు వెతుకుతున్న పేజీ అందుబాటులో లేదు లేదా మార్చబడింది.'
              : 'The route you are looking for does not exist or has been relocated.'}
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            variant="primary"
            onClick={handleGoBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            {language === 'te' ? 'తిరిగి వెళ్లండి' : 'Back to Safe Area'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
