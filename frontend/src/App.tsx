import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/components/ui/Toast';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
