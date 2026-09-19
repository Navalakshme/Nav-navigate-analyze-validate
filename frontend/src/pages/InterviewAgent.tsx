import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Zap, ChevronDown, ChevronUp,
  Send, ArrowRight, User, CheckCircle2, AlertTriangle, HelpCircle, Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/appStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { generateInterviewQuestions, generateFollowUp, analyzeInterview } from '../api/client';
import type { InterviewQuestion } from '../types';

export default function InterviewAgent() {
  const navigate = useNavigate();
  const {
    candidates, selectedCandidateId, interviewQuestions, interviewAnswers,
    isGeneratingQuestions, setSelectedCandidate, setInterviewQuestions,
    setInterviewAnswer, setGeneratingQuestions, setInterviewAnalysis, error, setError,
  } = useAppStore();

  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [loadingFollowup, setLoadingFollowup] = useState<string | null>(null);
  const [analyzingInterview, setAnalyzingInterview] = useState(false);

  // Default select first candidate if none selected
  useEffect(() => {
    if (candidates.length > 0 && !selectedCandidateId) {
      handleSelectCandidate(candidates[0].id);
    }
  }, [candidates, selectedCandidateId]);

  const candidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  const handleSelectCandidate = async (id: string) => {
    setSelectedCandidate(id);
    setError(null);
    setGeneratingQuestions(true);
    try {
      const res = await generateInterviewQuestions(id);
      setInterviewQuestions(res.data);
      if (res.data.length > 0) {
        setExpandedQ(res.data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleQuickAnswer = (qId: string, requirement: string) => {
    const sample = `In my previous role, I directly managed production ${requirement} pipelines. We had automated testing in CI/CD and maintained 99.9% uptime with CloudWatch and Prometheus monitoring.`;
    setAnswerDraft(prev => ({ ...prev, [qId]: sample }));
  };

  const handleSubmitAnswer = async (q: InterviewQuestion) => {
    const answer = answerDraft[q.id] || '';
    if (!answer.trim()) return;
    setLoadingFollowup(q.id);
    try {
      const res = await generateFollowUp(q.id, answer, candidate?.id || '');
      setInterviewAnswer(q.id, {
        question_id: q.id,
        answer,
        follow_up: res.data.follow_up,
        evidence_extracted: res.data.evidence_extracted,
        requires_followup: res.data.requires_followup,
      });
    } catch (err: any) {
      setInterviewAnswer(q.id, {
        question_id: q.id,
        answer,
        requires_followup: false,
      });
    } finally {
      setLoadingFollowup(null);
    }
  };

  const handleAnalyze = async () => {
    if (!candidate?.id) return;
    setAnalyzingInterview(true);
    try {
      const answers: Record<string, string> = {};
      Object.entries(interviewAnswers).forEach(([id, a]) => { answers[id] = a.answer; });
      const res = await analyzeInterview(candidate.id, answers);
      setInterviewAnalysis(res.data);
      navigate('/interview/analysis');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzingInterview(false);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="p-6 text-center max-w-2xl mx-auto">
        <div className="card p-12">
          <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <h2 className="text-base font-semibold mb-1">No Candidates Available</h2>
          <p className="text-sm text-text-secondary mb-4">Please upload a job description and resumes on the Dashboard first.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(interviewAnswers).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Candidate Interview Agent</h1>
          <p className="page-subtitle">Targeted validation questions and live follow-up generation for recruiters</p>
        </div>
        {answeredCount > 0 && (
          <button
            onClick={handleAnalyze}
            disabled={analyzingInterview}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            {analyzingInterview ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Synthesizing...</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Synthesize Interview ({answeredCount} answered) <ArrowRight className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Candidate Selector Tabs */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Select Candidate to Interview</p>
          <span className="text-[11px] text-text-muted">{candidates.length} candidates loaded</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {candidates.map(c => {
            const isSelected = (candidate?.id === c.id);
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCandidate(c.id)}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all flex items-center gap-3',
                  isSelected
                    ? 'border-accent-violet bg-accent-violet/15 ring-1 ring-accent-violet'
                    : 'border-border-subtle bg-bg-elevated hover:border-border-bright'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-accent-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-text-primary truncate">{c.name}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{c.group}</p>
                </div>
                <div className="text-right text-[10px] text-text-muted flex-shrink-0">
                  <span className="text-status-verified font-medium">{c.evidence_coverage.verified}✓</span>
                  <span className="mx-1">·</span>
                  <span className="text-status-validation font-medium">{c.evidence_coverage.needs_validation}⚠</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {candidate && (
        <>
          {/* Target Evaluation Focus Areas (De-congested Gap Cards) */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-accent-violet" />
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Target Evaluation Focus for {candidate.name}
                </h3>
              </div>
              <span className="text-[11px] text-text-muted">
                {candidate.gaps.length} areas requiring recruiter probe
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {candidate.gaps.slice(0, 6).map((gap, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-border-subtle bg-bg-secondary flex flex-col justify-between space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-text-primary truncate">{gap.requirement}</span>
                    <span className={clsx(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase',
                      gap.priority === 'high' ? 'bg-status-validation/15 text-status-validation border border-status-validation/30' : 'bg-bg-elevated text-text-muted'
                    )}>
                      {gap.gap_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                    {gap.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Candidate-Specific Questions ({interviewQuestions.length})
              </h3>
              <span className="text-xs text-text-muted">
                {answeredCount} of {interviewQuestions.length} answered
              </span>
            </div>

            {isGeneratingQuestions ? (
              <div className="card p-8 text-center">
                <LoadingSpinner message="Generating candidate-specific questions..." submessage="Cross-referencing resume claims against role requirements" />
              </div>
            ) : interviewQuestions.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-text-secondary mb-3">No questions generated yet for this candidate.</p>
                <button
                  onClick={() => handleSelectCandidate(candidate.id)}
                  className="btn-primary text-xs mx-auto"
                >
                  Generate Interview Questions
                </button>
              </div>
            ) : (
              interviewQuestions.map((q, idx) => {
                const isExp = expandedQ === q.id;
                const ansObj = interviewAnswers[q.id];
                const isAnswered = Boolean(ansObj?.answer);

                return (
                  <div
                    key={q.id}
                    className={clsx(
                      'card transition-all border',
                      isAnswered ? 'border-status-verified/30 bg-bg-card' : 'border-border-subtle'
                    )}
                  >
                    {/* Question Header */}
                    <div
                      onClick={() => setExpandedQ(isExp ? null : q.id)}
                      className="p-4 flex items-start gap-3 cursor-pointer hover:bg-bg-elevated/40 transition-colors"
                    >
                      <span className="text-xs font-bold text-accent-violet w-6 flex-shrink-0 mt-0.5">
                        Q{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-bg-elevated text-text-muted border border-border-subtle">
                            {q.category}
                          </span>
                          <span className="text-[10px] text-accent-glow font-medium">
                            Target: {q.target_requirement}
                          </span>
                          {isAnswered && (
                            <span className="text-[10px] text-status-verified font-semibold flex items-center gap-1 ml-auto">
                              <CheckCircle2 className="w-3 h-3" /> Answered
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-text-primary leading-snug">{q.question}</p>
                        <p className="text-[11px] text-text-muted mt-1 italic">Rationale: {q.rationale}</p>
                      </div>
                      <div className="text-text-muted flex-shrink-0 ml-2">
                        {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Question Content & Answer Panel */}
                    {isExp && (
                      <div className="px-4 pb-4 pt-2 border-t border-border-subtle space-y-3">
                        {ansObj ? (
                          <div className="space-y-2">
                            <div className="p-3 rounded-lg bg-bg-elevated border border-border-subtle">
                              <p className="text-[10px] font-semibold text-text-muted uppercase mb-1">Candidate's Response</p>
                              <p className="text-xs text-text-primary leading-relaxed">{ansObj.answer}</p>
                            </div>

                            {/* Drill-down Follow-Up Box */}
                            {ansObj.requires_followup && ansObj.follow_up && (
                              <div className="p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/30">
                                <div className="flex items-center gap-1.5 text-accent-glow font-semibold text-xs mb-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  NAV Follow-Up Recommendation:
                                </div>
                                <p className="text-xs text-text-primary italic">"{ansObj.follow_up}"</p>
                              </div>
                            )}

                            {ansObj.evidence_extracted && ansObj.evidence_extracted.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-status-verified">
                                <span className="font-semibold">Extracted Evidence:</span>
                                {ansObj.evidence_extracted.map((ev, ei) => (
                                  <span key={ei} className="px-2 py-0.5 rounded bg-status-verified/10 border border-status-verified/20">
                                    {ev}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-text-secondary font-medium">Record Candidate's Answer:</label>
                              <button
                                type="button"
                                onClick={() => handleQuickAnswer(q.id, q.target_requirement)}
                                className="text-[10px] text-accent-violet hover:text-accent-glow flex items-center gap-1"
                              >
                                <Sparkles className="w-3 h-3" /> Quick Sample Answer
                              </button>
                            </div>
                            <textarea
                              value={answerDraft[q.id] || ''}
                              onChange={e => setAnswerDraft(prev => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Type or paste the candidate's response..."
                              className="input-field w-full min-h-20 text-xs resize-none"
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSubmitAnswer(q)}
                                disabled={!(answerDraft[q.id]?.trim()) || loadingFollowup === q.id}
                                className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5"
                              >
                                {loadingFollowup === q.id ? (
                                  <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Evaluating...</>
                                ) : (
                                  <><Send className="w-3 h-3" /> Submit & Check Follow-up</>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
