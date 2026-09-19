import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Briefcase, Code2, GraduationCap,
  Award, MessageSquare, ChevronRight, FileText
} from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/appStore';
import StatusBadge from '../components/StatusBadge';
import EvidencePanel from '../components/EvidencePanel';
import type { RequirementMapping } from '../types';

const tabs = ['Overview', 'Skills & Tech', 'Experience', 'Projects', 'Requirement Mapping'];

export default function CandidateIntelligence() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { candidates, setSelectedCandidate } = useAppStore();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedMapping, setSelectedMapping] = useState<RequirementMapping | null>(null);

  const candidate = candidates.find(c => c.id === id);

  if (!candidate) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-muted">Candidate not found.</p>
        <button onClick={() => navigate('/candidates')} className="btn-secondary mt-3">Back to Candidates</button>
      </div>
    );
  }

  const ec = candidate.evidence_coverage;

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className={clsx('flex-1 overflow-y-auto transition-all duration-300', selectedMapping ? 'pr-0' : '')}>
        <div className="p-6 max-w-4xl space-y-5 animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/candidates')} className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-11 h-11 rounded-full bg-accent-purple flex items-center justify-center text-white font-bold">
              {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary">{candidate.name}</h1>
                <span className="text-xs px-2 py-0.5 bg-accent-purple/15 border border-accent-purple/20 text-accent-glow rounded-full">
                  {candidate.group}
                </span>
              </div>
              <p className="text-sm text-text-muted">
                {candidate.experience[0]?.title} {candidate.experience[0]?.company ? `· ${candidate.experience[0].company}` : ''}
              </p>
            </div>
            <button
              onClick={() => { setSelectedCandidate(candidate.id); navigate('/interview'); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <MessageSquare className="w-4 h-4" /> Start Interview
            </button>
          </div>

          {/* Coverage summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Verified', value: ec.verified, color: 'text-status-verified', bg: 'bg-status-verified/10', border: 'border-status-verified/20' },
              { label: 'Needs Validation', value: ec.needs_validation, color: 'text-status-validation', bg: 'bg-status-validation/10', border: 'border-status-validation/20' },
              { label: 'Missing', value: ec.missing, color: 'text-status-missing', bg: 'bg-status-missing/10', border: 'border-status-missing/20' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className={clsx('card p-3 border', border, bg, 'text-center')}>
                <p className={clsx('text-2xl font-bold', color)}>{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border-subtle gap-1">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={activeTab === t ? 'tab-button-active' : 'tab-button'}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-accent-violet" />
                  <h3 className="text-sm font-semibold text-text-primary">Summary</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{candidate.summary}</p>
              </div>
              {candidate.claims_requiring_evidence.length > 0 && (
                <div className="card p-4 border-status-validation/20">
                  <h3 className="text-sm font-semibold text-status-validation mb-2">Claims Requiring Validation</h3>
                  <ul className="space-y-1.5">
                    {candidate.claims_requiring_evidence.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <ChevronRight className="w-3.5 h-3.5 text-status-validation mt-0.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {candidate.source_file && (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <FileText className="w-3.5 h-3.5" />
                  Source: {candidate.source_file}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Skills & Tech' && (
            <div className="space-y-4">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 className="w-4 h-4 text-accent-violet" />
                  <h3 className="text-sm font-semibold text-text-primary">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map(s => (
                    <span key={s} className="px-3 py-1 bg-bg-elevated border border-border-default rounded-full text-xs text-text-secondary">{s}</span>
                  ))}
                </div>
              </div>
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.technologies.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-accent-purple/10 border border-accent-purple/20 rounded-full text-xs text-accent-glow">{t}</span>
                  ))}
                </div>
              </div>
              {candidate.certifications.length > 0 && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-status-validation" />
                    <h3 className="text-sm font-semibold text-text-primary">Certifications</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {candidate.certifications.map((c, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                        <Award className="w-3.5 h-3.5 text-status-validation mt-0.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Experience' && (
            <div className="space-y-3">
              {candidate.experience.map((exp, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{exp.title}</h3>
                      <p className="text-xs text-text-muted">{exp.company} · {exp.duration}</p>
                    </div>
                    <Briefcase className="w-4 h-4 text-text-muted flex-shrink-0" />
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed mb-2">{exp.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.technologies.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-bg-elevated border border-border-subtle rounded text-text-muted">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Projects' && (
            <div className="space-y-3">
              {candidate.projects.map((p, i) => (
                <div key={i} className="card p-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">{p.name}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-2">{p.description}</p>
                  {p.impact && (
                    <p className="text-xs text-status-verified mb-2">Impact: {p.impact}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {p.technologies.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-accent-purple/10 border border-accent-purple/20 rounded text-accent-glow">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
              {candidate.education.map((e, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-status-info" />
                    <h3 className="text-sm font-semibold text-text-primary">{e.degree}</h3>
                  </div>
                  <p className="text-xs text-text-muted">{e.institution} {e.year ? `· ${e.year}` : ''} {e.gpa ? `· GPA: ${e.gpa}` : ''}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Requirement Mapping' && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted mb-3">Click any requirement to inspect evidence and reasoning</p>
              {candidate.requirement_mappings.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMapping(selectedMapping?.requirement === m.requirement ? null : m)}
                  className={clsx(
                    'w-full text-left card p-3 transition-all duration-150 hover:border-border-bright',
                    selectedMapping?.requirement === m.requirement && 'border-accent-violet/40 bg-accent-violet/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={m.status} size="sm" />
                      <span className="text-sm font-medium text-text-primary">{m.requirement}</span>
                      <span className="text-[10px] text-text-muted">{m.category}</span>
                    </div>
                    <ChevronRight className={clsx('w-4 h-4 text-text-muted transition-transform', selectedMapping?.requirement === m.requirement && 'rotate-90 text-accent-violet')} />
                  </div>
                  {m.evidence.length > 0 && (
                    <p className="text-xs text-text-muted mt-1.5 pl-1 truncate">
                      "{m.evidence[0]?.text}"
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evidence panel */}
      {selectedMapping && (
        <div className="w-80 flex-shrink-0 overflow-y-auto">
          <EvidencePanel mapping={selectedMapping} onClose={() => setSelectedMapping(null)} />
        </div>
      )}
    </div>
  );
}
