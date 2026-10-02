import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export const AdminHome: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Area Placeholder</CardTitle>
          <CardDescription>
            Modular route `/admin` mounted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-600">
            This placeholder verifies that the admin layout and routing architecture function properly. Business features will be integrated in subsequent phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
