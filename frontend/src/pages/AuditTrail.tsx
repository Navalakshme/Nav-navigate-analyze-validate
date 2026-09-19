import { useEffect, useState } from 'react';
import { Shield, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, User, FileText } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/appStore';
import { getAuditTrail } from '../api/client';
import type { AuditEntry } from '../types';

const statusIcon: Record<string, any> = {
  VERIFIED: CheckCircle2,
  NEEDS_VALIDATION: AlertTriangle,
  MISSING: XCircle,
  INFO: Info,
};

const statusColor: Record<string, string> = {
  VERIFIED: 'text-status-verified',
  NEEDS_VALIDATION: 'text-status-validation',
  MISSING: 'text-status-missing',
  INFO: 'text-accent-violet',
};

const statusBg: Record<string, string> = {
  VERIFIED: 'bg-status-verified/10 border-status-verified/20',
  NEEDS_VALIDATION: 'bg-status-validation/10 border-status-validation/20',
  MISSING: 'bg-status-missing/10 border-status-missing/20',
  INFO: 'bg-accent-violet/10 border-accent-violet/20',
};

function formatTimestamp(ts?: string): string {
  if (!ts) return 'Just now';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return 'Recently';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AuditTrail() {
  const { auditTrail, setAuditTrail, candidates } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedCandidates, setExpandedCandidates] = useState<Record<string, boolean>>({});

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await getAuditTrail();
      setAuditTrail(res.data);
    } catch {
      // fallback to store
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  // Group all entries strictly by candidate
  const candidateNames = Array.from(
    new Set(auditTrail.map(e => e.candidate_name || 'General System'))
  );

  // Initialize expanded state for first candidate
  useEffect(() => {
    if (candidateNames.length > 0 && Object.keys(expandedCandidates).length === 0) {
      const init: Record<string, boolean> = {};
      candidateNames.forEach((name, idx) => {
        init[name] = idx === 0; // expand first candidate by default
      });
      setExpandedCandidates(init);
    }
  }, [auditTrail]);

  const toggleExpand = (name: string) => {
    setExpandedCandidates(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Filtered entries
  const filteredEntries = auditTrail.filter(e => {
    const candMatch = selectedCandidate === 'ALL' || (e.candidate_name || 'General System') === selectedCandidate;
    const statusMatch = statusFilter === 'ALL' || e.validation_status === statusFilter;
    return candMatch && statusMatch;
  });

  const verifiedCount = auditTrail.filter(e => e.validation_status === 'VERIFIED').length;
  const validationCount = auditTrail.filter(e => e.validation_status === 'NEEDS_VALIDATION').length;
  const missingCount = auditTrail.filter(e => e.validation_status === 'MISSING').length;
  const infoCount = auditTrail.filter(e => e.validation_status === 'INFO').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Candidate Audit Trail</h1>
          <p className="page-subtitle">Candidate-by-candidate evidence traceability and AI decision records</p>
        </div>
        <button onClick={loadAudit} disabled={loading} className="btn-secondary flex items-center gap-2 text-xs">
          <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Verified Evidence', count: verifiedCount, icon: CheckCircle2, color: 'text-status-verified' },
          { label: 'Needs Validation', count: validationCount, icon: AlertTriangle, color: 'text-status-validation' },
          { label: 'Missing Info', count: missingCount, icon: XCircle, color: 'text-status-missing' },
          { label: 'System Insights', count: infoCount, icon: Info, color: 'text-accent-violet' },
        ].map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <Icon className={clsx('w-5 h-5', color)} />
            <div>
              <p className={clsx('text-xl font-bold', color)}>{count}</p>
              <p className="text-[10px] text-text-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border-subtle">
        <button
          onClick={() => setSelectedCandidate('ALL')}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
            selectedCandidate === 'ALL'
              ? 'bg-accent-violet text-white'
              : 'bg-bg-elevated text-text-muted hover:text-text-primary'
          )}
        >
          All Candidates ({candidateNames.length})
        </button>
        {candidateNames.map(name => (
          <button
            key={name}
            onClick={() => setSelectedCandidate(name)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
              selectedCandidate === name
                ? 'bg-accent-violet text-white'
                : 'bg-bg-elevated text-text-muted hover:text-text-primary'
            )}
          >
            <User className="w-3 h-3" />
            {name}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['ALL', 'VERIFIED', 'NEEDS_VALIDATION', 'MISSING', 'INFO'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={clsx(
              'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
              statusFilter === s
                ? 'bg-accent-purple/20 text-accent-glow border border-accent-purple/40'
                : 'bg-bg-elevated text-text-muted border border-border-subtle hover:border-border-bright'
            )}
          >
            {s === 'ALL' ? 'All Records' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Candidate-Centric Audit Cards */}
      {candidateNames.length === 0 ? (
        <div className="card p-12 text-center">
          <Shield className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No audit entries yet. Upload resumes on the Dashboard to start.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidateNames
            .filter(name => selectedCandidate === 'ALL' || name === selectedCandidate)
            .map(name => {
              const candidateEntries = filteredEntries.filter(
                e => (e.candidate_name || 'General System') === name
              );
              if (candidateEntries.length === 0) return null;

              const isExpanded = expandedCandidates[name] ?? true;
              const vCount = candidateEntries.filter(e => e.validation_status === 'VERIFIED').length;
              const nvCount = candidateEntries.filter(e => e.validation_status === 'NEEDS_VALIDATION').length;
              const mCount = candidateEntries.filter(e => e.validation_status === 'MISSING').length;

              return (
                <div key={name} className="card overflow-hidden border-border-subtle">
                  {/* Candidate Header Bar */}
                  <div
                    onClick={() => toggleExpand(name)}
                    className="p-4 bg-bg-elevated/50 flex items-center justify-between cursor-pointer hover:bg-bg-elevated transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center text-white text-xs font-bold">
                        {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">{name}</h3>
                        <p className="text-[11px] text-text-muted">
                          {candidateEntries.length} audit records
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-status-verified/10 text-status-verified border border-status-verified/20">
                          {vCount} Verified
                        </span>
                        <span className="px-2 py-0.5 rounded bg-status-validation/10 text-status-validation border border-status-validation/20">
                          {nvCount} Validation Needed
                        </span>
                        {mCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-status-missing/10 text-status-missing border border-status-missing/20">
                            {mCount} Missing
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      )}
                    </div>
                  </div>

                  {/* Candidate Records List */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 divide-y divide-border-subtle">
                      {candidateEntries.map((entry, idx) => {
                        const Icon = statusIcon[entry.validation_status] || Info;
                        const col = statusColor[entry.validation_status] || 'text-text-muted';
                        const bg = statusBg[entry.validation_status] || 'bg-bg-elevated border-border-subtle';

                        return (
                          <div key={entry.id || idx} className={clsx('pt-3 first:pt-0')}>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded border', bg, col)}>
                                  {entry.validation_status.replace('_', ' ')}
                                </span>
                                <span className="text-xs font-semibold text-text-primary">
                                  {entry.requirement}
                                </span>
                                <span className="text-[10px] text-text-muted">
                                  via {entry.agent}
                                </span>
                              </div>
                              <span className="text-[10px] text-text-muted flex-shrink-0">
                                {formatTimestamp(entry.timestamp)}
                              </span>
                            </div>

                            {/* Insight Text */}
                            <p className="text-xs text-text-secondary mb-1.5 leading-relaxed">
                              {entry.insight}
                            </p>

                            {/* Evidence Quote */}
                            {entry.evidence && (
                              <div className="p-2 rounded bg-bg-secondary border border-border-subtle text-[11px] text-text-secondary italic border-l-2 border-l-accent-violet">
                                "{entry.evidence}"
                              </div>
                            )}

                            {/* Citation */}
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-muted">
                              <FileText className="w-3 h-3" />
                              <span>{entry.source_document}</span>
                              {entry.source_section && <span>· Section: {entry.source_section}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
