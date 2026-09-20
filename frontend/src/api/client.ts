import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 360000, // 6 min for AI calls with rate limit waits
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'An error occurred';
    return Promise.reject(new Error(msg));
  }
);

// ── Analysis ─────────────────────────────────────────────────────────────────

export const analyzeJob = async (formData: FormData) =>
  api.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getCandidates = () => api.get('/candidates');

export const getCandidate = (id: string) => api.get(`/candidates/${id}`);

export const getRoleRequirements = () => api.get('/role-requirements');

// ── Interview ─────────────────────────────────────────────────────────────────

export const generateInterviewQuestions = (candidateId: string) =>
  api.post('/interview/questions', { candidate_id: candidateId });

export const generateFollowUp = (questionId: string, answer: string, candidateId: string) =>
  api.post('/interview/followup', { question_id: questionId, answer, candidate_id: candidateId });

export const analyzeInterview = (candidateId: string, answers: Record<string, string>) =>
  api.post('/interview/analyze', { candidate_id: candidateId, answers });

// ── Search ────────────────────────────────────────────────────────────────────

export const searchCandidates = (query: string) =>
  api.post('/search', { query });

// ── Report ────────────────────────────────────────────────────────────────────

export const generateReport = (candidateId: string, recruiterNotes: string) =>
  api.post('/report/generate', { candidate_id: candidateId, recruiter_notes: recruiterNotes });

// ── Audit ─────────────────────────────────────────────────────────────────────

export const getAuditTrail = () => api.get('/audit');

export const getStats = () => api.get('/stats');

export default api;
