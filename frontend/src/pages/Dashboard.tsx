import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, Users, CheckCircle2,
  AlertTriangle, XCircle, Zap, ArrowRight,
  Clock, BarChart2, TrendingUp
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import UploadZone from '../components/UploadZone';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { analyzeJob, getAuditTrail, getStats, getCandidates, getRoleRequirements } from '../api/client';

const quickPrompts = [
  'Show candidates with Python and ML experience',
  'Which candidates need AWS validation?',
  'Who has production deployment experience?',
  'Show candidates with strong SQL evidence',
];

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    jdFile, resumeFiles, isAnalyzing, analysisComplete, stats,
    candidates, auditTrail, error,
    setJdFile, setResumeFiles, setAnalyzing, setAnalysisComplete,
    setRoleRequirements, setCandidates, setAuditTrail, setStats, setError,
  } = useAppStore();

  const [analyzeStep, setAnalyzeStep] = useState('');

  // Auto-hydrate from Supabase/backend on mount if candidates empty
  useEffect(() => {
    if (candidates.length === 0) {
      Promise.all([
        getCandidates().catch(() => null),
        getRoleRequirements().catch(() => null),
        getStats().catch(() => null),
        getAuditTrail().catch(() => null),
      ]).then(([cRes, rRes, sRes, aRes]) => {
        if (cRes?.data && cRes.data.length > 0) {
          setCandidates(cRes.data);
          setAnalysisComplete(true);
        }
        if (rRes?.data) setRoleRequirements(rRes.data);
        if (sRes?.data) setStats(sRes.data);
        if (aRes?.data) setAuditTrail(aRes.data);
      });
    }
  }, []);

  const handleAnalyze = async () => {
    if (!jdFile) { setError('Please upload a job description first.'); return; }
    if (resumeFiles.length === 0) { setError('Please upload at least one resume.'); return; }
    setError(null);
    setAnalyzing(true);

    const steps = [
      'Parsing documents...',
      'Extracting role requirements...',
      'Building candidate profiles...',
      'Mapping evidence...',
      'Identifying gaps...',
      'Grouping candidates...',
    ];
    let si = 0;
    const interval = setInterval(() => {
      setAnalyzeStep(steps[si % steps.length]);
      si++;
    }, 1800);

    try {
      const formData = new FormData();
      formData.append('jd_file', jdFile);
      resumeFiles.forEach(f => formData.append('resume_files', f));

      const res = await analyzeJob(formData);
      const { role_requirements, candidates: cands } = res.data;

      setRoleRequirements(role_requirements);
      setCandidates(cands);
      setAnalysisComplete(true);

      const [auditRes, statsRes] = await Promise.all([getAuditTrail(), getStats()]);
      setAuditTrail(auditRes.data);
      setStats(statsRes.data);

      clearInterval(interval);
      setAnalyzing(false);
      navigate('/candidates');
    } catch (err: any) {
      clearInterval(interval);
      setAnalyzing(false);
      setError(err.message || 'Analysis failed. Please check the backend is running.');
    }
  };

  const recentActivity = auditTrail.slice(0, 5);

  const pipelineGroups = [
    { label: 'Strong Evidence', count: candidates.filter(c => c.group === 'Strong Evidence Coverage').length, color: '#10B981' },
    { label: 'Relevant Experience', count: candidates.filter(c => c.group === 'Relevant Experience').length, color: '#8B5CF6' },
    { label: 'Needs Validation', count: candidates.filter(c => c.group === 'Needs Validation').length, color: '#F59E0B' },
    { label: 'Limited Evidence', count: candidates.filter(c => c.group === 'Limited Evidence').length, color: '#EF4444' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Good morning, Navalakshme 👋
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Turn candidate information into confident hiring intelligence.
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Candidates', value: stats.candidates_analyzed, icon: Users, color: 'text-accent-violet' },
            { label: 'Requirements', value: stats.requirements_extracted, icon: BarChart2, color: 'text-status-info' },
            { label: 'Verified', value: stats.verified_evidence, icon: CheckCircle2, color: 'text-status-verified' },
            { label: 'Needs Validation', value: stats.needs_validation, icon: AlertTriangle, color: 'text-status-validation' },
            { label: 'Missing', value: stats.missing_evidence, icon: XCircle, color: 'text-status-missing' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <Icon className={`w-8 h-8 ${color} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
        {/* Upload & Analyze */}
        <div className="col-span-7 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-accent-purple/15 flex items-center justify-center">
              <Upload className="w-4 h-4 text-accent-violet" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Upload & Analyze</h2>
              <p className="text-xs text-text-muted">Add a job description and candidate resumes</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <UploadZone
              label="Upload Job Description"
              description="Drag & drop or click to upload"
              accept={{ 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
              files={jdFile ? [jdFile] : []}
              onFiles={(f) => setJdFile(f[0] ?? null)}
              icon={<FileText className="w-5 h-5 text-accent-violet" />}
            />
            <UploadZone
              label="Upload Candidate Resumes"
              description="Drag & drop or click to upload"
              accept={{ 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
              multiple
              files={resumeFiles}
              onFiles={setResumeFiles}
              icon={<Users className="w-5 h-5 text-accent-violet" />}
            />
          </div>

          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

          {isAnalyzing ? (
            <LoadingSpinner message="NAV is investigating candidates..." submessage={analyzeStep} />
          ) : (
            <button
              onClick={handleAnalyze}
              disabled={!jdFile || resumeFiles.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              <Zap className="w-4 h-4" />
              {analysisComplete ? 'Re-analyze Candidates' : 'Analyze Candidates'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right column */}
        <div className="col-span-5 space-y-4">
          {/* Candidate Pipeline */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">Candidate Pipeline</h3>
              {analysisComplete && (
                <button onClick={() => navigate('/candidates')} className="text-xs text-accent-violet hover:text-accent-glow transition-colors flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            {analysisComplete ? (
              <div className="space-y-2.5">
                {pipelineGroups.map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-text-secondary flex-1">{label}</span>
                    <span className="text-xs font-semibold text-text-primary">{count}</span>
                  </div>
                ))}
                <div className="divider" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Total candidates</span>
                  <span className="text-sm font-bold text-text-primary">{candidates.length}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-muted">Upload resumes to see pipeline</p>
              </div>
            )}
          </div>

          {/* Ask NAV prompts */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded bg-accent-purple/15 flex items-center justify-center">
                <Zap className="w-3 h-3 text-accent-violet" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Ask NAV</h3>
            </div>
            <div className="space-y-1.5">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => navigate('/search', { state: { query: p } })}
                  className="w-full text-left text-xs text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg hover:bg-bg-elevated border border-transparent hover:border-border-subtle transition-all flex items-center justify-between group"
                >
                  <span>{p}</span>
                  <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-accent-violet transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
            </div>
            <button onClick={() => navigate('/audit')} className="text-xs text-accent-violet hover:text-accent-glow transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border-subtle last:border-0">
                <div className="w-7 h-7 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-accent-violet" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary font-medium truncate">{a.insight}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{a.candidate_name} · {a.requirement}</p>
                </div>
                <span className="text-[10px] text-text-muted flex-shrink-0">
                  {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active jobs stub */}
      {analysisComplete && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Active Analysis</h3>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => navigate('/role-analysis')} className="btn-secondary text-xs flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> View Role Requirements
            </button>
            <button onClick={() => navigate('/candidates')} className="btn-secondary text-xs flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> View Candidates ({candidates.length})
            </button>
            <button onClick={() => navigate('/interview')} className="btn-secondary text-xs flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Start Interview Agent
            </button>
            <button onClick={() => navigate('/report')} className="btn-secondary text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Generate Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
