import { AlertTriangle, X } from 'lucide-react';

interface Props {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorAlert({ message, onDismiss }: Props) {
  return (
    <div className="flex items-start gap-3 bg-status-missing/10 border border-status-missing/30 rounded-xl p-4">
      <AlertTriangle className="w-4 h-4 text-status-missing mt-0.5 flex-shrink-0" />
      <p className="text-sm text-text-secondary flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
