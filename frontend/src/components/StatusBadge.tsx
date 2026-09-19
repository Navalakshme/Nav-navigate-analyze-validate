import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import clsx from 'clsx';
import type { EvidenceStatus } from '../types';

interface Props {
  status: EvidenceStatus | 'INFO';
  size?: 'sm' | 'md';
}

const config = {
  VERIFIED: {
    label: 'Verified',
    icon: CheckCircle2,
    className: 'badge-verified',
  },
  NEEDS_VALIDATION: {
    label: 'Needs Validation',
    icon: AlertTriangle,
    className: 'badge-validation',
  },
  MISSING: {
    label: 'Missing',
    icon: XCircle,
    className: 'badge-missing',
  },
  INFO: {
    label: 'Info',
    icon: Info,
    className: 'badge-info',
  },
};

export default function StatusBadge({ status, size = 'md' }: Props) {
  const { label, icon: Icon, className } = config[status];
  return (
    <span className={clsx(className, size === 'sm' && 'text-[10px] px-2 py-0.5')}>
      <Icon className={clsx('flex-shrink-0', size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      {label}
    </span>
  );
}
