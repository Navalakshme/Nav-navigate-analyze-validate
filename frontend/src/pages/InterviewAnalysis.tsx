import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, FileText, ArrowLeft, Zap } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function InterviewAnalysis() {
  const navigate = useNavigate();
  const { interviewAnalysis, candidates, selectedCandidateId } = useAppStore();
  const candidate = candidates.find(c => c.id === selectedCandidateId);

  if (!interviewAnalysis) {
    return (
      <div className="p-6 text-center">
        <div className="card p-12">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-base font-semibold mb-1">No Interview Analysis Yet</h2>
          <p className="text-sm text-text-secondary mb-4">Complete an interview session first.</p>
          <button onClick={() => navigate('/interview')} className="btn-primary">Go to Interview Agent</button>
        </div>
      </div>
    );
  }

  const ia = interviewAnalysis;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/interview')} className="p-1.5 text-text-muted hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="page-title">Interview Analysis</h1>
          {candidate && <p className="page-subtitle">Analysis for {candidate.name}</p>}
        </div>
        <button onClick={() => navigate('/report')} className="btn-primary ml-auto flex items-center gap-2 text-sm">
          Generate Report <ArrowLeft className="w-4 h-4 rotate-180" />
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Validated', value: ia.validated_requirements.length, icon: CheckCircle2, color: 'text-status-verified', bg: 'bg-status-verified/10', border: 'border-status-verified/20' },
          { label: 'Unresolved', value: ia.unresolved_requirements.length, icon: AlertTriangle, color: 'text-status-validation', bg: 'bg-status-validation/10', border: 'border-status-validation/20' },
          { label: 'Contradictions', value: ia.contradictions.length, icon: XCircle, color: 'text-status-missing', bg: 'bg-status-missing/10', border: 'border-status-missing/20' },
          { label: 'Unanswered Areas', value: ia.unanswered_areas.length, icon: Zap, color: 'text-accent-violet', bg: 'bg-accent-violet/10', border: 'border-accent-violet/20' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`card p-3 border ${border} ${bg} text-center`}>
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Validated */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-status-verified" />
            <h3 className="text-sm font-semibold text-text-primary">Validated Requirements</h3>
          </div>
          {ia.validated_requirements.length === 0 ? (
            <p className="text-xs text-text-muted">None validated yet</p>
          ) : (
            <div className="space-y-2">
              {ia.validated_requirements.map((r, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border-subtle last:border-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-verified mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-text-primary">{r.requirement}</p>
                    {r.evidence[0] && <p className="text-[10px] text-text-muted mt-0.5 truncate">"{r.evidence[0].text}"</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unresolved */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-status-validation" />
            <h3 className="text-sm font-semibold text-text-primary">Unresolved Requirements</h3>
          </div>
          {ia.unresolved_requirements.length === 0 ? (
            <p className="text-xs text-text-muted">No unresolved items</p>
          ) : (
            <div className="space-y-2">
              {ia.unresolved_requirements.map((r, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border-subtle last:border-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-status-validation mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-text-primary">{r.requirement}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{r.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Evidence */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">New Evidence from Interview</h3>
          {ia.new_evidence.length === 0 ? (
            <p className="text-xs text-text-muted">No new evidence captured</p>
          ) : (
            <div className="space-y-2">
              {ia.new_evidence.map((ev, i) => (
                <div key={i} className="bg-bg-elevated border border-border-subtle rounded-lg p-2.5">
                  <p className="text-xs text-text-primary italic border-l-2 border-accent-violet pl-2">"{ev.text}"</p>
                  <p className="text-[10px] text-text-muted mt-1">{ev.source_section}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unanswered Areas */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-accent-violet" />
            <h3 className="text-sm font-semibold text-text-primary">Unanswered Evaluation Areas</h3>
          </div>
          {ia.unanswered_areas.length === 0 ? (
            <p className="text-xs text-text-muted">All areas addressed</p>
          ) : (
            <ul className="space-y-1.5">
              {ia.unanswered_areas.map((a, i) => (
                <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-violet mt-1.5 flex-shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Contradictions */}
      {ia.contradictions.length > 0 && (
        <div className="card p-4 border-status-missing/20 bg-status-missing/5">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-status-missing" />
            <h3 className="text-sm font-semibold text-status-missing">Contradictions / Unclear Areas</h3>
          </div>
          <ul className="space-y-2">
            {ia.contradictions.map((c, i) => (
              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                <XCircle className="w-3.5 h-3.5 text-status-missing mt-0.5 flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended follow-ups */}
      {ia.recommended_followups.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Recommended Next Steps</h3>
          <ul className="space-y-2">
            {ia.recommended_followups.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-accent-violet font-semibold flex-shrink-0">{i + 1}.</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
