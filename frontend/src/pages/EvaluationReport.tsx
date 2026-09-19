import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle2, AlertTriangle, XCircle,
  ArrowLeft, Download, Users, MapPin, Zap
} from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/appStore';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { generateReport } from '../api/client';

export default function EvaluationReport() {
  const navigate = useNavigate();
  const {
    candidates, selectedCandidateId, report, roleRequirements,
    isGeneratingReport, setReport, setGeneratingReport, setSelectedCandidate, error, setError,
  } = useAppStore();

  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [recruiterDecision, setRecruiterDecision] = useState('');
  const [selectedId, setSelectedId] = useState(selectedCandidateId || '');

  const candidate = candidates.find(c => c.id === selectedId);

  const handleGenerate = async () => {
    if (!selectedId) { setError('Select a candidate first.'); return; }
    setError(null);
    setGeneratingReport(true);
    try {
      const res = await generateReport(selectedId, recruiterNotes);
      setReport(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handlePrint = () => window.print();

  if (candidates.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="card p-12">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-base font-semibold mb-1">No Candidates Available</h2>
          <p className="text-sm text-text-secondary mb-4">Analyze candidates first from the Dashboard.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Evaluation Report</h1>
          <p className="page-subtitle">Standardized recruiter intelligence report</p>
        </div>
        {report && (
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Candidate + generate */}
      {!report && (
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Select Candidate & Generate Report</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {candidates.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setSelectedCandidate(c.id); }}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all',
                  selectedId === c.id
                    ? 'border-accent-violet bg-accent-violet/10'
                    : 'border-border-subtle bg-bg-elevated hover:border-border-bright'
                )}
              >
                <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{c.group}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Recruiter Notes (optional)</label>
            <textarea
              value={recruiterNotes}
              onChange={e => setRecruiterNotes(e.target.value)}
              placeholder="Add any additional context or notes for this report..."
              className="input-field w-full min-h-20 resize-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!selectedId || isGeneratingReport}
            className="btn-primary flex items-center gap-2"
          >
            {isGeneratingReport ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate Intelligence Report</>
            )}
          </button>
        </div>
      )}

      {isGeneratingReport && (
        <LoadingSpinner message="NAV is generating the intelligence report..." submessage="Compiling evidence, mapping requirements, structuring findings" />
      )}

      {/* Report */}
      {report && !isGeneratingReport && (
        <div className="space-y-5" id="nav-report">
          {/* Report Header */}
          <div className="card p-6 border-accent-violet/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-accent-purple/15 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-accent-violet" />
                  </div>
                  <span className="text-xs font-semibold text-accent-violet uppercase tracking-wider">NAV Intelligence Report</span>
                </div>
                <h2 className="text-xl font-bold text-text-primary">{report.candidate_name}</h2>
                <p className="text-sm text-text-muted">{report.job_title}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-text-muted">Generated</p>
                <p className="text-xs text-text-secondary">{new Date(report.generated_at).toLocaleString()}</p>
                <button onClick={() => setReport(null)} className="btn-ghost text-xs mt-2">New Report</button>
              </div>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed bg-bg-elevated border border-border-subtle rounded-lg p-3">
              {report.overview}
            </p>
          </div>

          {/* Evidence Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Verified Evidence', items: report.verified_areas, icon: CheckCircle2, color: 'text-status-verified', bg: 'bg-status-verified/10', border: 'border-status-verified/20' },
              { label: 'Needs Validation', items: report.needs_validation_areas, icon: AlertTriangle, color: 'text-status-validation', bg: 'bg-status-validation/10', border: 'border-status-validation/20' },
              { label: 'Missing Evidence', items: report.missing_areas, icon: XCircle, color: 'text-status-missing', bg: 'bg-status-missing/10', border: 'border-status-missing/20' },
            ].map(({ label, items, icon: Icon, color, bg, border }) => (
              <div key={label} className={clsx('card p-3 border', border, bg)}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={clsx('w-4 h-4', color)} />
                  <p className="text-xs font-semibold text-text-primary">{label}</p>
                </div>
                <p className={clsx('text-2xl font-bold', color)}>{items.length}</p>
                <div className="mt-2 space-y-1">
                  {items.slice(0, 3).map((r, i) => (
                    <p key={i} className="text-[10px] text-text-muted truncate">· {r.requirement}</p>
                  ))}
                  {items.length > 3 && <p className="text-[10px] text-text-muted">+{items.length - 3} more</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Full Requirement Mapping */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Requirement-by-Requirement Evidence</h3>
            <div className="space-y-2">
              {report.requirement_mappings.map((m, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border-subtle last:border-0">
                  <StatusBadge status={m.status} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{m.requirement}</p>
                    {m.evidence[0] && (
                      <p className="text-xs text-text-muted mt-0.5 italic truncate">"{m.evidence[0].text}"</p>
                    )}
                    {m.validation_needed && (
                      <p className="text-xs text-status-validation mt-0.5">⚠ {m.validation_needed}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted flex-shrink-0">{m.category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Findings */}
          {report.interview_findings.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Interview Findings</h3>
              <ul className="space-y-2">
                {report.interview_findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-violet mt-1.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unanswered Areas */}
          {report.unanswered_areas.length > 0 && (
            <div className="card p-4 border-status-validation/20">
              <h3 className="text-sm font-semibold text-status-validation mb-3">Unanswered Evaluation Areas</h3>
              <ul className="space-y-1.5">
                {report.unanswered_areas.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <AlertTriangle className="w-3.5 h-3.5 text-status-validation mt-0.5 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {report.next_validation_steps.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Recommended Next Validation Steps</h3>
              <ol className="space-y-2">
                {report.next_validation_steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-accent-violet font-bold flex-shrink-0">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── HUMAN DECISION SECTION ── */}
          <div className="card p-5 border-2 border-border-bright">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-text-primary" />
              <h3 className="text-sm font-bold text-text-primary">Recruiter Decision</h3>
              <span className="ml-auto text-[10px] bg-bg-elevated border border-border-subtle px-2 py-0.5 rounded text-text-muted">Human Only</span>
            </div>
            <p className="text-xs text-text-muted mb-4">
              NAV does not make hiring decisions. This section is for the recruiter's own notes and final decision.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Recruiter Notes</label>
                <textarea
                  value={recruiterNotes}
                  onChange={e => setRecruiterNotes(e.target.value)}
                  placeholder="Your observations, impressions, and additional context..."
                  className="input-field w-full min-h-20 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Decision / Next Step</label>
                <div className="flex gap-2 flex-wrap">
                  {['Proceed to next round', 'Request references', 'Schedule technical test', 'Hold for now', 'No further action'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setRecruiterDecision(opt)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                        recruiterDecision === opt
                          ? 'border-accent-violet bg-accent-violet/15 text-accent-glow'
                          : 'border-border-subtle bg-bg-elevated text-text-muted hover:border-border-bright'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {recruiterDecision && (
                  <p className="text-xs text-accent-violet mt-2">Selected: {recruiterDecision}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
