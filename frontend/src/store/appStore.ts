import { create } from 'zustand';
import type {
  RoleRequirements,
  CandidateProfile,
  AuditEntry,
  AppStats,
  InterviewQuestion,
  InterviewAnswer,
  InterviewAnalysis,
  RecruiterReport,
} from '../types';

interface AppState {
  // Upload state
  jdFile: File | null;
  resumeFiles: File[];
  isAnalyzing: boolean;
  analysisComplete: boolean;

  // Data
  roleRequirements: RoleRequirements | null;
  candidates: CandidateProfile[];
  selectedCandidateId: string | null;
  auditTrail: AuditEntry[];
  stats: AppStats | null;

  // Interview
  interviewQuestions: InterviewQuestion[];
  interviewAnswers: Record<string, InterviewAnswer>;
  interviewAnalysis: InterviewAnalysis | null;
  isGeneratingQuestions: boolean;

  // Report
  report: RecruiterReport | null;
  isGeneratingReport: boolean;

  // Search
  searchHistory: { query: string; results: any }[];

  // Error
  error: string | null;

  // Actions
  setJdFile: (file: File | null) => void;
  setResumeFiles: (files: File[]) => void;
  setAnalyzing: (v: boolean) => void;
  setAnalysisComplete: (v: boolean) => void;
  setRoleRequirements: (r: RoleRequirements) => void;
  setCandidates: (c: CandidateProfile[]) => void;
  setSelectedCandidate: (id: string | null) => void;
  setAuditTrail: (a: AuditEntry[]) => void;
  setStats: (s: AppStats) => void;
  setInterviewQuestions: (q: InterviewQuestion[]) => void;
  setInterviewAnswer: (qId: string, answer: InterviewAnswer) => void;
  setInterviewAnalysis: (a: InterviewAnalysis | null) => void;
  setGeneratingQuestions: (v: boolean) => void;
  setReport: (r: RecruiterReport | null) => void;
  setGeneratingReport: (v: boolean) => void;
  addSearchResult: (query: string, results: any) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

const initialState = {
  jdFile: null,
  resumeFiles: [],
  isAnalyzing: false,
  analysisComplete: false,
  roleRequirements: null,
  candidates: [],
  selectedCandidateId: null,
  auditTrail: [],
  stats: null,
  interviewQuestions: [],
  interviewAnswers: {},
  interviewAnalysis: null,
  isGeneratingQuestions: false,
  report: null,
  isGeneratingReport: false,
  searchHistory: [],
  error: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setJdFile: (file) => set({ jdFile: file }),
  setResumeFiles: (files) => set({ resumeFiles: files }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalysisComplete: (v) => set({ analysisComplete: v }),
  setRoleRequirements: (r) => set({ roleRequirements: r }),
  setCandidates: (c) => set({ candidates: c }),
  setSelectedCandidate: (id) => set({ selectedCandidateId: id }),
  setAuditTrail: (a) => set({ auditTrail: a }),
  setStats: (s) => set({ stats: s }),
  setInterviewQuestions: (q) => set({ interviewQuestions: q }),
  setInterviewAnswer: (qId, answer) =>
    set((state) => ({
      interviewAnswers: { ...state.interviewAnswers, [qId]: answer },
    })),
  setInterviewAnalysis: (a) => set({ interviewAnalysis: a }),
  setGeneratingQuestions: (v) => set({ isGeneratingQuestions: v }),
  setReport: (r) => set({ report: r }),
  setGeneratingReport: (v) => set({ isGeneratingReport: v }),
  addSearchResult: (query, results) =>
    set((state) => ({
      searchHistory: [{ query, results }, ...state.searchHistory.slice(0, 19)],
    })),
  setError: (e) => set({ error: e }),
  reset: () => set(initialState),
}));
