// ── Shared Types ─────────────────────────────────────────────────────────────

export type EvidenceStatus = 'VERIFIED' | 'NEEDS_VALIDATION' | 'MISSING';

export type CandidateGroup =
  | 'Strong Evidence Coverage'
  | 'Relevant Experience'
  | 'Needs Validation'
  | 'Limited Evidence';

export interface EvidenceItem {
  text: string;
  source_document: string;
  source_section: string;
  page?: number;
}

export interface RequirementMapping {
  requirement: string;
  category: string;
  status: EvidenceStatus;
  evidence: EvidenceItem[];
  reasoning: string;
  validation_needed?: string;
}

export interface GapItem {
  requirement: string;
  gap_type: 'missing' | 'unclear' | 'weak_evidence' | 'unverified_claim';
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CandidateProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: string[];
  technologies: string[];
  claims_requiring_evidence: string[];
  requirement_mappings: RequirementMapping[];
  gaps: GapItem[];
  group: CandidateGroup;
  evidence_coverage: {
    verified: number;
    needs_validation: number;
    missing: number;
    total: number;
  };
  source_file: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
  technologies: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
  impact?: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  year?: string;
  gpa?: string;
}

export interface RoleRequirements {
  job_title: string;
  company?: string;
  summary: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_requirements: string[];
  qualifications: string[];
  responsibilities: string[];
  evidence_expectations: Record<string, string>;
  source_file: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  rationale: string;
  target_requirement: string;
  gap_addressed?: string;
  difficulty: 'behavioral' | 'technical' | 'situational';
}

export interface InterviewAnswer {
  question_id: string;
  answer: string;
  follow_up?: string;
  evidence_extracted?: string[];
  requires_followup: boolean;
}

export interface InterviewAnalysis {
  validated_requirements: RequirementMapping[];
  unresolved_requirements: RequirementMapping[];
  new_evidence: EvidenceItem[];
  contradictions: string[];
  unanswered_areas: string[];
  recommended_followups: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  candidate_name: string;
  candidate_id?: string;
  requirement: string;
  insight: string;
  evidence: string;
  source_document: string;
  source_section: string;
  reason: string;
  validation_status: EvidenceStatus | 'INFO';
  agent: string;
}

export interface RecruiterReport {
  candidate_id: string;
  candidate_name: string;
  job_title: string;
  generated_at: string;
  overview: string;
  requirement_mappings: RequirementMapping[];
  verified_areas: RequirementMapping[];
  needs_validation_areas: RequirementMapping[];
  missing_areas: RequirementMapping[];
  interview_findings: string[];
  unanswered_areas: string[];
  evidence_references: EvidenceItem[];
  next_validation_steps: string[];
  recruiter_notes: string;
  recruiter_decision: string;
}

export interface AppStats {
  candidates_analyzed: number;
  requirements_extracted: number;
  verified_evidence: number;
  needs_validation: number;
  missing_evidence: number;
}

export interface SearchResult {
  query: string;
  results: SearchResultItem[];
  summary: string;
}

export interface SearchResultItem {
  candidate_id: string;
  candidate_name: string;
  relevance_reason: string;
  evidence: EvidenceItem[];
  group: CandidateGroup;
  key_skills: string[];
}
