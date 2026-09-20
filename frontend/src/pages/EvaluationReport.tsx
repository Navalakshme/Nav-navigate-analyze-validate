import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle2, AlertTriangle, XCircle,
  ArrowLeft, Download, Users, MapPin, Zap, RotateCcw
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

  const strengthsList = (report?.key_strengths && report.key_strengths.length > 0)
    ? report.key_strengths
    : (report?.verified_areas || []).map(m => typeof m === 'string' ? m : `${m.requirement}: ${m.reasoning}`);

  const validationList = (report?.validation_areas && report.validation_areas.length > 0)
    ? report.validation_areas
    : [
        ...(report?.needs_validation_areas || []).map(m => typeof m === 'string' ? m : `${m.requirement}: ${m.missing_info || m.reasoning}`),
        ...(report?.missing_areas || []).map(m => typeof m === 'string' ? m : `Missing: ${m.requirement}`)
      ];

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
      <div className="p-6 text-center max-w-2xl mx-auto">
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
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/candidates')}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-2.5"
            title="Return to Candidates List"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Candidates
          </button>
          <div>
            <h1 className="page-title">Candidate Evaluation Report</h1>
            <p className="page-subtitle">Standardized recruiter intelligence report with human-in-the-loop decision</p>
          </div>
        </div>
        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReport(null)}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Another Candidate
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" /> Export Report
            </button>
          </div>
        )}
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Candidate Selector + Notes */}
      {!report && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Select Candidate to Evaluate</h3>
            <span className="text-xs text-text-muted">{candidates.length} candidates loaded</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {candidates.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setSelectedCandidate(c.id); }}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all',
                  selectedId === c.id
                    ? 'border-accent-violet bg-accent-violet/10 ring-1 ring-accent-violet'
                    : 'border-border-subtle bg-bg-elevated hover:border-accent-violet/40'
                )}
              >
                <p className="text-sm font-semibold text-text-primary truncate">{c.name}</p>
                <div className="flex items-center justify-between mt-1 text-[11px] text-text-muted">
                  <span>{c.group}</span>
                  <span className="text-status-verified font-medium">{c.evidence_coverage.verified}✓</span>
                </div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Recruiter Observations & Notes (optional)
            </label>
            <textarea
              value={recruiterNotes}
              onChange={e => setRecruiterNotes(e.target.value)}
              placeholder="Add phone screen impressions, salary expectations, notice period, or cultural fit notes..."
              className="input-field w-full min-h-20 resize-none text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => navigate('/candidates')}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cancel & Back to Candidates
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedId || isGeneratingReport}
              className="btn-primary text-xs flex items-center gap-2"
            >
              {isGeneratingReport ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Compiling Report...</>
              ) : (
                <><Zap className="w-3.5 h-3.5" /> Generate Intelligence Report</>
              )}
            </button>
          </div>
        </div>
      )}

      {isGeneratingReport && (
        <LoadingSpinner
          message="NAV is compiling the candidate intelligence report..."
          submessage="Synthesizing verified claims, evaluating gaps, structuring final assessment"
        />
      )}

      {/* Full Generated Report */}
      {report && !isGeneratingReport && (
        <div className="space-y-5" id="nav-report">
            {/* Report Header Card */}
            <div className="card p-6 border-accent-violet/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-accent-purple/10 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-accent-violet" />
                    </div>
                    <span className="text-xs font-bold text-accent-violet uppercase tracking-wider">NAV Intelligence Report</span>
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">{report.candidate_name}</h2>
                  <p className="text-xs text-text-muted">{report.job_title}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-muted">Generated</p>
                  <p className="text-xs text-text-secondary">
                    {report.generated_at ? new Date(report.generated_at).toLocaleString() : 'Just now'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => navigate('/candidates')}
                      className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Candidates List
                    </button>
                    <button
                      onClick={() => setReport(null)}
                      className="btn-ghost text-xs py-1 px-2 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Select Another
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed bg-bg-elevated border border-border-subtle rounded-lg p-3">
                {report.overview}
              </p>
            </div>

            {/* Evidence Summary Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Verified Evidence', items: report.verified_areas || [], icon: CheckCircle2, color: 'text-status-verified', bg: 'bg-status-verified/10', border: 'border-status-verified/20' },
                { label: 'Needs Validation', items: report.needs_validation_areas || [], icon: AlertTriangle, color: 'text-status-validation', bg: 'bg-status-validation/10', border: 'border-status-validation/20' },
                { label: 'Missing Evidence', items: report.missing_areas || [], icon: XCircle, color: 'text-status-missing', bg: 'bg-status-missing/10', border: 'border-status-missing/20' },
              ].map(({ label, items, icon: Icon, color, bg, border }) => (
                <div key={label} className={clsx('card p-3 border', border, bg)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={clsx('w-4 h-4', color)} />
                    <p className="text-xs font-semibold text-text-primary">{label}</p>
                  </div>
                  <p className={clsx('text-xl font-bold', color)}>{items.length}</p>
                  <div className="mt-2 space-y-1">
                    {items.slice(0, 3).map((item, ii) => {
                      const text = typeof item === 'string' ? item : item?.requirement || 'Requirement';
                      return (
                        <p key={ii} className="text-[10px] text-text-secondary truncate" title={text}>
                          • {text}
                        </p>
                      );
                    })}
                    {items.length > 3 && (
                      <p className="text-[10px] text-text-muted">+{items.length - 3} more</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Key Strengths & Validation Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-4">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-verified" /> Key Strengths
                </h3>
                <ul className="space-y-1.5 text-xs text-text-secondary">
                  {strengthsList.length > 0 ? (
                    strengthsList.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-status-verified font-bold mt-0.5">•</span>
                        <span>{typeof s === 'string' ? s : JSON.stringify(s)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-text-muted italic">Core qualifications align with candidate experience.</li>
                  )}
                </ul>
              </div>

              <div className="card p-4">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-status-validation" /> Critical Validation Areas
                </h3>
                <ul className="space-y-1.5 text-xs text-text-secondary">
                  {validationList.length > 0 ? (
                    validationList.map((v, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-status-validation font-bold mt-0.5">•</span>
                        <span>{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-text-muted italic">No critical validation gaps identified.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Interview Findings & Next Steps (if available) */}
            {((report.interview_findings && report.interview_findings.length > 0) || (report.next_validation_steps && report.next_validation_steps.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.interview_findings && report.interview_findings.length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-accent-violet" /> Interview Findings & Insights
                    </h3>
                    <ul className="space-y-1.5 text-xs text-text-secondary">
                      {report.interview_findings.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent-violet font-bold mt-0.5">•</span>
                          <span>{typeof f === 'string' ? f : JSON.stringify(f)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.next_validation_steps && report.next_validation_steps.length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-accent-cyan" /> Recommended Validation Next Steps
                    </h3>
                    <ul className="space-y-1.5 text-xs text-text-secondary">
                      {report.next_validation_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent-cyan font-bold mt-0.5">•</span>
                          <span>{typeof step === 'string' ? step : JSON.stringify(step)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Human-in-the-loop Recruiter Decision */}
            <div className="card p-5 border-accent-purple/30 bg-bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-accent-violet" />
                <h3 className="text-sm font-bold text-text-primary">Recruiter Decision & Next Steps</h3>
                <span className="ml-auto text-[10px] bg-accent-purple/10 text-accent-violet font-semibold border border-accent-purple/20 px-2 py-0.5 rounded">
                  Human Only
                </span>
              </div>
              <p className="text-xs text-text-muted mb-4">
                NAV does not make hiring decisions. This section is reserved for your professional evaluation.
              </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Recruiter Notes</label>
                <textarea
                  value={recruiterNotes}
                  onChange={e => setRecruiterNotes(e.target.value)}
                  placeholder="Your final candidate impressions and validation notes..."
                  className="input-field w-full min-h-16 resize-none text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Action / Recommendation</label>
                <div className="flex gap-2 flex-wrap">
                  {['Proceed to next round', 'Request references', 'Schedule technical test', 'Hold for comparison', 'No further action'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setRecruiterDecision(opt)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                        recruiterDecision === opt
                          ? 'border-accent-violet bg-accent-violet/10 text-accent-violet font-bold'
                          : 'border-border-subtle bg-bg-elevated text-text-muted hover:border-border-bright'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {recruiterDecision && (
                  <p className="text-xs font-semibold text-accent-violet mt-2">Selected Action: {recruiterDecision}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Footer Bar */}
          <div className="flex items-center justify-between p-4 card bg-bg-elevated/50">
            <button
              onClick={() => navigate('/candidates')}
              className="btn-secondary flex items-center gap-2 text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Candidates List
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReport(null)}
                className="btn-secondary flex items-center gap-2 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Evaluate Another Candidate
              </button>
              <button
                onClick={handlePrint}
                className="btn-primary flex items-center gap-2 text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Export / Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
