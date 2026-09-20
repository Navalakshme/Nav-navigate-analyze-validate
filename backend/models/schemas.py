from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
import uuid


EvidenceStatus = Literal["VERIFIED", "NEEDS_VALIDATION", "MISSING"]
CandidateGroup = Literal[
    "Strong Evidence Coverage",
    "Relevant Experience",
    "Needs Validation",
    "Limited Evidence",
]


class EvidenceItem(BaseModel):
    text: str
    source_document: str
    source_section: str
    page: Optional[int] = None


class RequirementMapping(BaseModel):
    requirement: str
    category: str
    status: EvidenceStatus
    evidence: List[EvidenceItem] = []
    reasoning: str
    validation_needed: Optional[str] = None


class GapItem(BaseModel):
    requirement: str
    gap_type: Literal["missing", "unclear", "weak_evidence", "unverified_claim"]
    reason: str
    priority: Literal["high", "medium", "low"]


class ExperienceItem(BaseModel):
    title: str
    company: str
    duration: str
    description: str
    technologies: List[str] = []


class ProjectItem(BaseModel):
    name: str
    description: str
    technologies: List[str] = []
    impact: Optional[str] = None


class EducationItem(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None
    gpa: Optional[str] = None


class EvidenceCoverage(BaseModel):
    verified: int
    needs_validation: int
    missing: int
    total: int


class CandidateProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: str
    skills: List[str] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    education: List[EducationItem] = []
    certifications: List[str] = []
    technologies: List[str] = []
    claims_requiring_evidence: List[str] = []
    requirement_mappings: List[RequirementMapping] = []
    gaps: List[GapItem] = []
    group: CandidateGroup = "Limited Evidence"
    evidence_coverage: EvidenceCoverage = EvidenceCoverage(verified=0, needs_validation=0, missing=0, total=0)
    source_file: str = ""


class RoleRequirements(BaseModel):
    job_title: str
    company: Optional[str] = None
    summary: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    experience_requirements: List[str] = []
    qualifications: List[str] = []
    responsibilities: List[str] = []
    evidence_expectations: dict = {}
    source_file: str = ""


class InterviewQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    category: str
    rationale: str
    target_requirement: str
    gap_addressed: Optional[str] = None
    difficulty: Literal["behavioral", "technical", "situational"]


class InterviewAnswer(BaseModel):
    question_id: str
    answer: str
    follow_up: Optional[str] = None
    evidence_extracted: List[str] = []
    requires_followup: bool = False


class InterviewAnalysis(BaseModel):
    validated_requirements: List[RequirementMapping] = []
    unresolved_requirements: List[RequirementMapping] = []
    new_evidence: List[EvidenceItem] = []
    contradictions: List[str] = []
    unanswered_areas: List[str] = []
    recommended_followups: List[str] = []


class AuditEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    candidate_name: str
    candidate_id: Optional[str] = None
    requirement: str
    insight: str
    evidence: str
    source_document: str
    source_section: str
    reason: str
    validation_status: Literal["VERIFIED", "NEEDS_VALIDATION", "MISSING", "INFO"]
    agent: str
    session_id: Optional[str] = None


class RecruiterReport(BaseModel):
    candidate_id: str
    candidate_name: str
    job_title: str
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    overview: str
    requirement_mappings: List[RequirementMapping] = []
    verified_areas: List[RequirementMapping] = []
    needs_validation_areas: List[RequirementMapping] = []
    missing_areas: List[RequirementMapping] = []
    key_strengths: List[str] = []
    validation_areas: List[str] = []
    interview_findings: List[str] = []
    unanswered_areas: List[str] = []
    evidence_references: List[EvidenceItem] = []
    next_validation_steps: List[str] = []
    recruiter_notes: str = ""
    recruiter_decision: str = ""


class AppStats(BaseModel):
    candidates_analyzed: int
    requirements_extracted: int
    verified_evidence: int
    needs_validation: int
    missing_evidence: int


class SearchResultItem(BaseModel):
    candidate_id: str
    candidate_name: str
    relevance_reason: str
    evidence: List[EvidenceItem] = []
    group: CandidateGroup
    key_skills: List[str] = []


class SearchResult(BaseModel):
    query: str
    results: List[SearchResultItem] = []
    summary: str


# ── Request bodies ─────────────────────────────────────────────────────────────

class QuestionRequest(BaseModel):
    candidate_id: str


class FollowUpRequest(BaseModel):
    question_id: str
    answer: str
    candidate_id: str


class InterviewAnalyzeRequest(BaseModel):
    candidate_id: str
    answers: dict


class ReportRequest(BaseModel):
    candidate_id: str
    recruiter_notes: str = ""


class SearchRequest(BaseModel):
    query: str
