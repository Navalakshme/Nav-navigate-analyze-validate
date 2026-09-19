import { X, FileText, MapPin, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { RequirementMapping } from '../types';

interface Props {
  mapping: RequirementMapping;
  onClose: () => void;
}

export default function EvidencePanel({ mapping, onClose }: Props) {
  return (
    <div className="h-full flex flex-col bg-bg-card border-l border-border-subtle animate-slide-in">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border-subtle">
        <div className="min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1.5">
            <StatusBadge status={mapping.status} size="sm" />
            <span className="text-[10px] text-text-muted uppercase tracking-wide">{mapping.category}</span>
          </div>
          <h3 className="font-semibold text-text-primary text-sm">{mapping.requirement}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Reasoning */}
        <div>
          <p className="section-header">AI Reasoning</p>
          <p className="text-sm text-text-secondary leading-relaxed bg-bg-elevated border border-border-subtle rounded-lg p-3">
            {mapping.reasoning}
          </p>
        </div>

        {/* Validation needed */}
        {mapping.validation_needed && (
          <div className="bg-status-validation/10 border border-status-validation/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-status-validation" />
              <p className="text-xs font-semibold text-status-validation">Validation Required</p>
            </div>
            <p className="text-xs text-text-secondary">{mapping.validation_needed}</p>
          </div>
        )}

        {/* Evidence items */}
        <div>
          <p className="section-header">Evidence ({mapping.evidence.length})</p>
          {mapping.evidence.length === 0 ? (
            <div className="bg-status-missing/10 border border-status-missing/20 rounded-lg p-3 text-center">
              <p className="text-xs text-status-missing">No evidence found in resume</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mapping.evidence.map((ev, i) => (
                <div key={i} className="bg-bg-elevated border border-border-subtle rounded-lg p-3">
                  {/* Quote */}
                  <p className="text-xs text-text-primary leading-relaxed border-l-2 border-accent-violet pl-3 mb-3 italic">
                    "{ev.text}"
                  </p>
                  {/* Source info */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-text-muted">
                      <FileText className="w-3 h-3" />
                      <span className="font-medium text-text-secondary">{ev.source_document}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-text-muted">
                      <MapPin className="w-3 h-3" />
                      <span>{ev.source_section}</span>
                      {ev.page && <span>· p.{ev.page}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
