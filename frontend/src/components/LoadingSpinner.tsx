import { Loader2 } from 'lucide-react';

interface Props {
  message?: string;
  submessage?: string;
}

export default function LoadingSpinner({ message = 'Analyzing...', submessage }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-accent-purple/20 border-t-accent-violet animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-accent-violet animate-pulse-slow" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">{message}</p>
        {submessage && <p className="text-xs text-text-muted mt-0.5">{submessage}</p>}
      </div>
    </div>
  );
}
