import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Phone, CheckCircle } from 'lucide-react';

interface EscalationCase {
  id: string;
  studentName: string;
  parentName: string;
  contactPhone: string;
  trade: string;
  district: string;
  reason: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
}

const INITIAL_CASES: EscalationCase[] = [
  {
    id: 'ESC-101',
    studentName: 'Aarav Sharma',
    parentName: 'Sunita Sharma (Mother)',
    contactPhone: '+91 98765 43211',
    trade: 'Solar PV Installation & Maintenance',
    district: 'Medak, Telangana',
    reason: 'Parent questions whether solar technician income can support family compared to private college degree. Requested phone consultation in Telugu.',
    priority: 'medium',
    status: 'pending',
    createdAt: 'Today, 10:45 AM',
  },
  {
    id: 'ESC-102',
    studentName: 'Rohit Kulkarni',
    parentName: 'Anil Kulkarni (Father)',
    contactPhone: '+91 98765 43214',
    trade: 'CNC Machine Operator & Programmer',
    district: 'Pune, Maharashtra',
    reason: 'Family concern regarding night shifts and heavy machinery noise. Needs reassurance regarding factory OSHA norms.',
    priority: 'high',
    status: 'in_progress',
    createdAt: 'Yesterday, 3:20 PM',
  },
  {
    id: 'ESC-103',
    studentName: 'Priya Meena',
    parentName: 'Ramesh Meena (Father)',
    contactPhone: '+91 98765 43218',
    trade: 'Fashion Design & Garment Technology',
    district: 'Jaipur, Rajasthan',
    reason: 'Parent hesitant about daughter relocating to industrial textile export cluster in Tirupur. Requires female hostel safety verification.',
    priority: 'urgent',
    status: 'pending',
    createdAt: '2 days ago',
  },
];

export const AdminEscalations: React.FC = () => {
  const { success } = useToast();
  const [cases, setCases] = useState<EscalationCase[]>(INITIAL_CASES);
  const [selectedCase, setSelectedCase] = useState<EscalationCase | null>(null);

  const handleResolve = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: 'resolved' as const } : c))
    );
    setSelectedCase(null);
    success('Case Resolved', `Escalation ${caseId} marked as successfully resolved.`);
  };

  const columns: Column<EscalationCase>[] = [
    {
      key: 'id',
      header: 'Case ID',
      render: (item) => <span className="font-mono text-xs font-semibold">{item.id}</span>,
    },
    {
      key: 'studentName',
      header: 'Student & Guardian',
      render: (item) => (
        <div>
          <div className="font-semibold text-text-primary">{item.studentName}</div>
          <div className="text-xs text-text-muted">{item.parentName}</div>
          <div className="text-[11px] text-text-secondary">{item.district}</div>
        </div>
      ),
    },
    {
      key: 'trade',
      header: 'Target Trade',
      render: (item) => <span className="text-xs text-text-primary">{item.trade}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => (
        <StatusBadge
          status={
            item.priority === 'urgent' || item.priority === 'high'
              ? 'error'
              : item.priority === 'medium'
              ? 'warning'
              : 'info'
          }
          label={item.priority.toUpperCase()}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <StatusBadge
          status={
            item.status === 'resolved'
              ? 'success'
              : item.status === 'in_progress'
              ? 'warning'
              : 'neutral'
          }
          label={item.status.replace('_', ' ').toUpperCase()}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedCase(item)}
        >
          Review Case
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Counsellor Escalation Queue"
        subtitle="Manage parental resistance cases, counselling escalations, and phone consultation requests."
        badge={<StatusBadge status="warning" label="3 Active Cases" />}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Escalations' },
        ]}
      />

      <DataTable
        columns={columns}
        data={cases}
        keyExtractor={(item) => item.id}
      />

      {/* Case Review Modal */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={`Review Case: ${selectedCase.id}`}
          description={`${selectedCase.studentName} • ${selectedCase.trade}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-text-muted">Created: {selectedCase.createdAt}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setSelectedCase(null)}>
                  Close
                </Button>
                {selectedCase.status !== 'resolved' && (
                  <Button
                    variant="success"
                    onClick={() => handleResolve(selectedCase.id)}
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                  >
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-background-elevated border border-border space-y-1">
              <div className="text-xs text-text-muted">Primary Parental Concern:</div>
              <p className="text-sm text-text-primary leading-relaxed">
                {selectedCase.reason}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-background-elevated border border-border">
                <span className="text-text-muted">Guardian Phone:</span>
                <div className="font-semibold text-text-primary mt-0.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{selectedCase.contactPhone}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-background-elevated border border-border">
                <span className="text-text-muted">Location:</span>
                <div className="font-semibold text-text-primary mt-0.5">
                  {selectedCase.district}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-border space-y-2">
              <div className="text-xs font-semibold text-text-primary">
                Counsellor Action Plan:
              </div>
              <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside">
                <li>Share verified 3-year salary progression chart from DGT dataset.</li>
                <li>Clarify government credit transfer into B.Voc program.</li>
                <li>Confirm hostel and safety compliance certification with institute director.</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
