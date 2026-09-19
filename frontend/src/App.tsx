import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RoleAnalysis from './pages/RoleAnalysis';
import Candidates from './pages/Candidates';
import CandidateIntelligence from './pages/CandidateIntelligence';
import InterviewAgent from './pages/InterviewAgent';
import InterviewAnalysis from './pages/InterviewAnalysis';
import CandidateSearch from './pages/CandidateSearch';
import EvaluationReport from './pages/EvaluationReport';
import AuditTrail from './pages/AuditTrail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="role-analysis" element={<RoleAnalysis />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateIntelligence />} />
          <Route path="interview" element={<InterviewAgent />} />
          <Route path="interview/analysis" element={<InterviewAnalysis />} />
          <Route path="search" element={<CandidateSearch />} />
          <Route path="report" element={<EvaluationReport />} />
          <Route path="audit" element={<AuditTrail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
