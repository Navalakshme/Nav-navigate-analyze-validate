import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, CheckCircle2, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/appStore';
import type { CandidateProfile, CandidateGroup } from '../types';

const groupConfig: Record<CandidateGroup, { color: string; bg: string; border: string }> = {
  'Strong Evidence Coverage': { color: 'text-status-verified', bg: 'bg-status-verified/10', border: 'border-status-verified/20' },
  'Relevant Experience': { color: 'text-accent-violet', bg: 'bg-accent-violet/10', border: 'border-accent-violet/20' },
  'Needs Validation': { color: 'text-status-validation', bg: 'bg-status-validation/10', border: 'border-status-validation/20' },
  'Limited Evidence': { color: 'text-status-missing', bg: 'bg-status-missing/10', border: 'border-status-missing/20' },
};

function CoverageBar({ verified, needs, missing, total }: { verified: number; needs: number; missing: number; total: number }) {
  if (total === 0) return null;
  const vp = (verified / total) * 100;
  const np = (needs / total) * 100;
  const mp = (missing / total) * 100;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
      <div className="bg-status-verified rounded-full" style={{ width: `${vp}%` }} />
      <div className="bg-status-validation rounded-full" style={{ width: `${np}%` }} />
      <div className="bg-status-missing rounded-full" style={{ width: `${mp}%` }} />
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: CandidateProfile }) {
  const navigate = useNavigate();
  const gc = groupConfig[candidate.group] || groupConfig['Limited Evidence'];
  const { evidence_coverage: ec } = candidate;

  return (
    <div
      onClick={() => navigate(`/candidates/${candidate.id}`)}
      className="card-hover p-4 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent-glow transition-colors">
              {candidate.name}
            </h3>
            <p className="text-xs text-text-muted">{candidate.experience[0]?.title || 'Candidate'}</p>
          </div>
        </div>
        <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full border', gc.color, gc.bg, gc.border)}>
          {candidate.group}
        </span>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-3">
        {candidate.skills.slice(0, 5).map(s => (
          <span key={s} className="text-[10px] px-2 py-0.5 bg-bg-elevated border border-border-subtle rounded text-text-muted">{s}</span>
        ))}
        {candidate.skills.length > 5 && (
          <span className="text-[10px] px-2 py-0.5 text-text-muted">+{candidate.skills.length - 5} more</span>
        )}
      </div>

      {/* Coverage */}
      <div className="space-y-1.5 mb-3">
        <CoverageBar verified={ec.verified} needs={ec.needs_validation} missing={ec.missing} total={ec.total} />
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 text-status-verified" />{ec.verified} verified</span>
          <span className="flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5 text-status-validation" />{ec.needs_validation} validation</span>
          <span className="flex items-center gap-1"><XCircle className="w-2.5 h-2.5 text-status-missing" />{ec.missing} missing</span>
        </div>
      </div>

      {/* Projects */}
      {candidate.projects.length > 0 && (
        <p className="text-[10px] text-text-muted truncate">
          Projects: {candidate.projects.slice(0, 2).map(p => p.name).join(', ')}
          {candidate.projects.length > 2 && ` +${candidate.projects.length - 2} more`}
        </p>
      )}

      <div className="flex items-center justify-end mt-2">
        <span className="text-[10px] text-accent-violet opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          View Intelligence <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

export default function Candidates() {
  const navigate = useNavigate();
  const { candidates, analysisComplete } = useAppStore();

  const groups: CandidateGroup[] = ['Strong Evidence Coverage', 'Relevant Experience', 'Needs Validation', 'Limited Evidence'];

  if (!analysisComplete) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-base font-semibold text-text-primary mb-1">No Candidates Analyzed</h2>
          <p className="text-sm text-text-secondary mb-4">Upload resumes and run analysis from the Dashboard.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary inline-flex items-center gap-2">
            <ArrowRight className="w-4 h-4" /> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="page-subtitle">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} analyzed · grouped by evidence coverage</p>
        </div>
      </div>

      {groups.map(group => {
        const grouped = candidates.filter(c => c.group === group);
        if (grouped.length === 0) return null;
        const gc = groupConfig[group];
        return (
          <div key={group}>
            <div className="flex items-center gap-2 mb-3">
              <span className={clsx('w-2 h-2 rounded-full', group === 'Strong Evidence Coverage' ? 'bg-status-verified' : group === 'Relevant Experience' ? 'bg-accent-violet' : group === 'Needs Validation' ? 'bg-status-validation' : 'bg-status-missing')} />
              <h2 className={clsx('text-sm font-semibold', gc.color)}>{group}</h2>
              <span className="text-xs text-text-muted">({grouped.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped.map(c => <CandidateCard key={c.id} candidate={c} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
