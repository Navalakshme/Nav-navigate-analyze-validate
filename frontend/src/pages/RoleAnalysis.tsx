import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle2, Star, GraduationCap, Target, FileText, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function RoleAnalysis() {
  const navigate = useNavigate();
  const { roleRequirements } = useAppStore();

  if (!roleRequirements) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-base font-semibold text-text-primary mb-1">No Role Analysis Yet</h2>
          <p className="text-sm text-text-secondary mb-4">Upload a job description and run analysis from the Dashboard.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const r = roleRequirements;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/15 border border-accent-purple/20 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5 text-accent-violet" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{r.job_title}</h1>
          {r.company && <p className="text-sm text-text-muted">{r.company}</p>}
          <div className="flex items-center gap-2 mt-1">
            <span className="badge-info text-[10px]">
              <FileText className="w-2.5 h-2.5" /> {r.source_file}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-4">
        <p className="text-sm text-text-secondary leading-relaxed">{r.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Required Skills */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-status-verified" />
            <h3 className="text-sm font-semibold text-text-primary">Required Skills</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {r.required_skills.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-bg-elevated border border-border-default rounded-full text-xs text-text-secondary hover:border-accent-violet/50 transition-colors">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Preferred Skills */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-status-validation" />
            <h3 className="text-sm font-semibold text-text-primary">Preferred Skills</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {r.preferred_skills.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-bg-elevated border border-border-default rounded-full text-xs text-text-secondary hover:border-status-validation/50 transition-colors">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Experience Requirements */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-accent-violet" />
            <h3 className="text-sm font-semibold text-text-primary">Experience Requirements</h3>
          </div>
          <ul className="space-y-2">
            {r.experience_requirements.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-violet mt-1.5 flex-shrink-0" />
                {e}
              </li>
            ))}
          </ul>
        </div>

        {/* Qualifications */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-status-info" />
            <h3 className="text-sm font-semibold text-text-primary">Qualifications</h3>
          </div>
          <ul className="space-y-2">
            {r.qualifications.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-status-info mt-1.5 flex-shrink-0" />
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Responsibilities */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Responsibilities</h3>
        <ul className="space-y-2 columns-2 gap-4">
          {r.responsibilities.map((resp, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary break-inside-avoid">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-violet mt-1.5 flex-shrink-0" />
              {resp}
            </li>
          ))}
        </ul>
      </div>

      {/* Evidence Expectations */}
      {Object.keys(r.evidence_expectations).length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Evidence Expectations per Requirement</h3>
          <div className="space-y-2">
            {Object.entries(r.evidence_expectations).map(([req, expectation]) => (
              <div key={req} className="flex items-start gap-3 py-2 border-b border-border-subtle last:border-0">
                <span className="text-xs font-semibold text-text-primary w-32 flex-shrink-0">{req}</span>
                <span className="text-xs text-text-secondary">{String(expectation)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
