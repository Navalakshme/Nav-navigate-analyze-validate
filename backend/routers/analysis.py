"""
NAV — Main API Router
All endpoints for the agentic pipeline.
"""
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException

from models.schemas import (
    CandidateProfile, RoleRequirements, AuditEntry, AppStats,
    InterviewQuestion, InterviewAnswer, InterviewAnalysis,
    RecruiterReport, SearchResult,
    QuestionRequest, FollowUpRequest, InterviewAnalyzeRequest,
    ReportRequest, SearchRequest, EvidenceCoverage,
    EvidenceItem, RequirementMapping, GapItem,
    ExperienceItem, ProjectItem, EducationItem,
)
from agents.requirement_analyst import analyze_requirements
from agents.candidate_investigator import investigate_candidate
from agents.evidence_mapper import map_evidence
from agents.gap_investigator import investigate_gaps
from agents.interview_strategist import generate_questions
from agents.followup_agent import generate_followup
from agents.interview_analyst import analyze_interview as ai_analyze_interview
from agents.report_generator import generate_report as ai_generate_report
from agents.search_agent import search_candidates as ai_search
from agents.unified_investigator import process_candidate_unified
from utils.pdf_parser import extract_text
from utils.supabase_db import (
    save_session, save_candidate, save_audit_entry,
    save_report, get_audit_entries, get_app_config, set_app_config,
    load_latest_session_data
)

router = APIRouter()

@router.get("/config/status")
def get_config_status():
    import os
    env_key = os.environ.get("GEMINI_API_KEY", "").strip()
    placeholder_keys = ["PASTE_YOUR_GEMINI_KEY_HERE", "your_gemini_api_key_here", ""]
    has_env = bool(env_key and env_key not in placeholder_keys)
    has_supabase = bool(get_app_config("GEMINI_API_KEY"))
    return {
        "configured": has_env or has_supabase,
        "source": "environment" if has_env else ("supabase" if has_supabase else "none")
    }

# ── In-memory session state ────────────────────────────────────────────────────
_session: dict = {
    "id": None,
    "role_requirements": None,
    "candidates": {},           # id -> CandidateProfile
    "audit_trail": [],          # List[AuditEntry]
    "interview_questions": {},  # candidate_id -> List[InterviewQuestion]
    "interview_analysis": {},   # candidate_id -> InterviewAnalysis
}


def _hydrate_session_if_needed():
    """Auto-hydrates candidates and role from Supabase if server restarted."""
    if _session["candidates"] and _session["role_requirements"]:
        return

    data = load_latest_session_data()
    if data["session_id"]:
        _session["id"] = data["session_id"]
        if data.get("role"):
            try:
                _session["role_requirements"] = RoleRequirements(**data["role"])
            except Exception as e:
                print(f"Role hydrate error: {e}")

        if data.get("candidates"):
            for c in data["candidates"]:
                try:
                    p = CandidateProfile(**c)
                    _session["candidates"][p.id] = p
                except Exception as ce:
                    print(f"Candidate hydrate error: {ce}")

        if not _session.get("role_requirements") and _session.get("candidates"):
            first_c = next(iter(_session["candidates"].values()))
            sample_reqs = [m.requirement for m in first_c.requirement_mappings]
            _session["role_requirements"] = RoleRequirements(
                job_title="Candidate Assessment",
                summary="Extracted evaluation requirements",
                required_skills=sample_reqs[:10],
                preferred_skills=sample_reqs[10:15],
                responsibilities=sample_reqs[:5],
                source_file="job_description.txt"
            )


def _new_session():
    _session["id"] = str(uuid.uuid4())
    _session["role_requirements"] = None
    _session["candidates"] = {}
    _session["audit_trail"] = []
    _session["interview_questions"] = {}
    _session["interview_analysis"] = {}


def _log_audit(entry: AuditEntry):
    entry.session_id = _session["id"]
    _session["audit_trail"].insert(0, entry)
    save_audit_entry(entry.dict())


def _determine_group(mappings) -> str:
    """Accurately classifies candidates based on verified evidence vs gaps."""
    if not mappings:
        return "Limited Evidence"
    verified = sum(1 for m in mappings if m.status == "VERIFIED")
    needs_val = sum(1 for m in mappings if m.status == "NEEDS_VALIDATION")
    missing = sum(1 for m in mappings if m.status == "MISSING")
    total = len(mappings)
    ratio = verified / total if total > 0 else 0

    # Strong evidence if verified count is high and exceeds missing items
    if verified >= 8 or (ratio >= 0.45 and verified > missing):
        return "Strong Evidence Coverage"
    elif verified >= 5 and missing <= 5:
        return "Relevant Experience"
    elif needs_val >= 3 or (needs_val > 0 and verified <= missing):
        return "Needs Validation"
    else:
        return "Limited Evidence"


# ── Main Analysis Pipeline ─────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze(
    jd_file: UploadFile = File(...),
    resume_files: List[UploadFile] = File(...),
):
    _new_session()
    session_id = _session["id"]

    # Validate inputs
    if not jd_file.filename:
        raise HTTPException(400, "No job description file provided")
    if not resume_files:
        raise HTTPException(400, "No resume files provided")

    # ── Step 1: Parse JD ──────────────────────────────────────────────────────
    try:
        jd_bytes = await jd_file.read()
        jd_text = extract_text(jd_bytes, jd_file.filename)
        if not jd_text.strip():
            raise HTTPException(400, "Job description appears empty or unreadable")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to read job description: {str(e)}")

    # ── Step 2: Extract Role Requirements ─────────────────────────────────────
    try:
        role = analyze_requirements(jd_text, jd_file.filename)
        _session["role_requirements"] = role
        save_session(session_id, role.job_title, jd_file.filename, role.dict())

        _log_audit(AuditEntry(
            candidate_name="System",
            requirement="Role Requirements",
            insight=f"Extracted {len(role.required_skills)} required skills and {len(role.preferred_skills)} preferred skills for {role.job_title}",
            evidence=f"Required: {', '.join(role.required_skills[:5])}",
            source_document=jd_file.filename,
            source_section="Job Description",
            reason="Requirement Analyst processed the job description",
            validation_status="INFO",
            agent="Requirement Analyst",
        ))
    except Exception as e:
        raise HTTPException(500, f"Requirement analysis failed: {str(e)}")

    # ── Steps 3-6: Process each resume ────────────────────────────────────────
    processed_candidates = []

    for resume_file in resume_files:
        try:
            resume_bytes = await resume_file.read()
            resume_text = extract_text(resume_bytes, resume_file.filename)

            if not resume_text.strip():
                continue  # Skip empty/unreadable files

            # Unified extraction + mapping + gaps in 1 optimized Gemini call
            candidate_data = process_candidate_unified(role, resume_text, resume_file.filename)

            # Parse RequirementMappings
            mappings = []
            for m in candidate_data.get("requirement_mappings", []):
                try:
                    ev_items = [EvidenceItem(**e) for e in m.get("evidence", [])]
                    mappings.append(RequirementMapping(
                        requirement=m["requirement"],
                        category=m.get("category", "General"),
                        status=m["status"],
                        evidence=ev_items,
                        reasoning=m.get("reasoning", ""),
                        validation_needed=m.get("validation_needed"),
                    ))
                except Exception as me:
                    print(f"Mapping parse error: {me}")

            # Parse Gaps
            gaps = []
            for g in candidate_data.get("gaps", []):
                try:
                    gaps.append(GapItem(
                        requirement=g["requirement"],
                        gap_type=g.get("gap_type", "unclear"),
                        reason=g.get("reason", ""),
                        priority=g.get("priority", "medium"),
                    ))
                except Exception as ge:
                    print(f"Gap parse error: {ge}")

            # Compute coverage & group
            verified_count = sum(1 for m in mappings if m.status == "VERIFIED")
            needs_val_count = sum(1 for m in mappings if m.status == "NEEDS_VALIDATION")
            missing_count = sum(1 for m in mappings if m.status == "MISSING")
            total_count = len(mappings)

            group = _determine_group(mappings)

            # Safe parsing for experience, projects, education
            experience = []
            for exp in candidate_data.get("experience", []):
                try:
                    experience.append(ExperienceItem(**exp))
                except Exception:
                    pass

            projects = []
            for proj in candidate_data.get("projects", []):
                try:
                    projects.append(ProjectItem(**proj))
                except Exception:
                    pass

            education = []
            for edu in candidate_data.get("education", []):
                try:
                    education.append(EducationItem(**edu))
                except Exception:
                    pass

            # Build CandidateProfile
            profile = CandidateProfile(
                name=candidate_data.get("name", resume_file.filename),
                email=candidate_data.get("email"),
                phone=candidate_data.get("phone"),
                location=candidate_data.get("location"),
                summary=candidate_data.get("summary", ""),
                skills=candidate_data.get("skills", []),
                experience=experience,
                projects=projects,
                education=education,
                certifications=candidate_data.get("certifications", []),
                technologies=candidate_data.get("technologies", []),
                claims_requiring_evidence=candidate_data.get("claims_requiring_evidence", []),
                requirement_mappings=mappings,
                gaps=gaps,
                group=group,
                evidence_coverage=EvidenceCoverage(
                    verified=verified_count,
                    needs_validation=needs_val_count,
                    missing=missing_count,
                    total=total_count,
                ),
                source_file=resume_file.filename,
            )

            _session["candidates"][profile.id] = profile
            processed_candidates.append(profile)

            # Save to Supabase
            save_candidate(session_id, profile.dict())

            # ── High-Impact Candidate-Centric Audit Logging ────────────────────
            # 1. Candidate Executive Assessment
            _log_audit(AuditEntry(
                candidate_name=profile.name,
                candidate_id=profile.id,
                requirement="Candidate Assessment",
                insight=f"Evaluated against {total_count} criteria: {verified_count} Verified, {needs_val_count} Need Validation, {missing_count} Missing. Assigned to '{group}'.",
                evidence=profile.summary[:250],
                source_document=resume_file.filename,
                source_section="Profile Overview",
                reason=f"Candidate classified as {group}",
                validation_status="INFO",
                agent="Candidate Investigator",
            ))

            # 2. Key Verified Highlights (Top 2)
            verified_reqs = [m for m in mappings if m.status == "VERIFIED"][:2]
            for m in verified_reqs:
                ev_text = m.evidence[0].text if m.evidence else "Verified from experience"
                _log_audit(AuditEntry(
                    candidate_name=profile.name,
                    candidate_id=profile.id,
                    requirement=m.requirement,
                    insight=f"Verified: {m.reasoning[:180]}",
                    evidence=ev_text[:250],
                    source_document=resume_file.filename,
                    source_section=m.evidence[0].source_section if m.evidence else "Experience",
                    reason=m.reasoning[:120],
                    validation_status="VERIFIED",
                    agent="Evidence Mapper",
                ))

            # 3. Critical Gaps Needing Validation (Top 2)
            critical_gaps = [g for g in gaps if g.priority == "high"][:2] or gaps[:2]
            for g in critical_gaps:
                _log_audit(AuditEntry(
                    candidate_name=profile.name,
                    candidate_id=profile.id,
                    requirement=g.requirement,
                    insight=f"Validation Gap ({g.gap_type}): {g.reason[:180]}",
                    evidence=f"Priority: {g.priority.upper()}",
                    source_document=resume_file.filename,
                    source_section="Gap Analysis",
                    reason=g.reason[:120],
                    validation_status="NEEDS_VALIDATION" if g.gap_type != "missing" else "MISSING",
                    agent="Gap Investigator",
                ))

        except Exception as e:
            print(f"[NAV] Failed to process {resume_file.filename}: {e}")
            continue

    if not processed_candidates:
        raise HTTPException(422, "No resumes could be processed. Check file formats.")

    return {
        "session_id": session_id,
        "role_requirements": role.dict(),
        "candidates": [c.dict() for c in processed_candidates],
    }


# ── Candidates ─────────────────────────────────────────────────────────────────

@router.get("/candidates")
def get_candidates():
    _hydrate_session_if_needed()
    return [c.dict() for c in _session["candidates"].values()]


@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: str):
    _hydrate_session_if_needed()
    c = _session["candidates"].get(candidate_id)
    if not c:
        raise HTTPException(404, "Candidate not found")
    return c.dict()


@router.get("/role-requirements")
def get_role_requirements():
    _hydrate_session_if_needed()
    if not _session["role_requirements"]:
        raise HTTPException(404, "No role requirements loaded")
    return _session["role_requirements"].dict()


@router.get("/stats")
def get_stats():
    _hydrate_session_if_needed()
    candidates = list(_session["candidates"].values())
    role = _session["role_requirements"]
    req_count = len(role.required_skills) + len(role.preferred_skills) if role else 0

    verified = sum(c.evidence_coverage.verified for c in candidates)
    needs_val = sum(c.evidence_coverage.needs_validation for c in candidates)
    missing = sum(c.evidence_coverage.missing for c in candidates)

    return AppStats(
        candidates_analyzed=len(candidates),
        requirements_extracted=req_count,
        verified_evidence=verified,
        needs_validation=needs_val,
        missing_evidence=missing,
    ).dict()


# ── Interview ──────────────────────────────────────────────────────────────────

@router.post("/interview/questions")
def get_interview_questions(req: QuestionRequest):
    _hydrate_session_if_needed()
    candidate = _session["candidates"].get(req.candidate_id)
    if not candidate:
        raise HTTPException(404, "Candidate not found")
    role = _session["role_requirements"]
    if not role:
        raise HTTPException(400, "No role requirements loaded")

    # If already generated in this session, return cached
    if req.candidate_id in _session["interview_questions"]:
        return [q.dict() for q in _session["interview_questions"][req.candidate_id]]

    questions = generate_questions(candidate, role)
    _session["interview_questions"][req.candidate_id] = questions

    _log_audit(AuditEntry(
        candidate_name=candidate.name,
        candidate_id=candidate.id,
        requirement="Interview Preparation",
        insight=f"Generated {len(questions)} candidate-specific interview questions targeting identified gaps",
        evidence=f"{len(candidate.gaps)} gaps prioritized",
        source_document="Interview Strategist",
        source_section="Question Generation",
        reason="Targeting candidate resume gaps",
        validation_status="INFO",
        agent="Interview Strategist",
    ))

    return [q.dict() for q in questions]


@router.post("/interview/followup")
def get_followup(req: FollowUpRequest):
    candidate = _session["candidates"].get(req.candidate_id)
    questions = _session["interview_questions"].get(req.candidate_id, [])

    # Find the question
    question = next((q for q in questions if q.id == req.question_id), None)
    q_text = question.question if question else "Interview question"
    target = question.target_requirement if question else "requirement"
    rationale = question.rationale if question else ""

    result = generate_followup(q_text, req.answer, target, rationale)

    if candidate and result.get("requires_followup") and result.get("follow_up"):
        _log_audit(AuditEntry(
            candidate_name=candidate.name,
            candidate_id=candidate.id,
            requirement=target,
            insight=f"Follow-up required: {result['follow_up'][:200]}",
            evidence=req.answer[:300],
            source_document="Interview",
            source_section="Candidate Answer",
            reason="Answer requires deeper validation",
            validation_status="NEEDS_VALIDATION",
            agent="Follow-Up Agent",
        ))

    return result


@router.post("/interview/analyze")
def analyze_interview(req: InterviewAnalyzeRequest):
    candidate = _session["candidates"].get(req.candidate_id)
    if not candidate:
        raise HTTPException(404, "Candidate not found")
    role = _session["role_requirements"]

    questions = _session["interview_questions"].get(req.candidate_id, [])
    # Build Q&A map: question text -> answer
    qa_map = {}
    for q in questions:
        if q.id in req.answers:
            qa_map[q.question] = req.answers[q.id]

    analysis = ai_analyze_interview(
        candidate_name=candidate.name,
        job_title=role.job_title if role else "Role",
        key_requirements=role.required_skills[:10] if role else [],
        gaps=candidate.gaps,
        questions_and_answers=qa_map,
    )
    _session["interview_analysis"][req.candidate_id] = analysis

    _log_audit(AuditEntry(
        candidate_name=candidate.name,
        candidate_id=candidate.id,
        requirement="Interview Analysis",
        insight=f"Validated {len(analysis.validated_requirements)} requirements, {len(analysis.unresolved_requirements)} remain unresolved",
        evidence=f"{len(analysis.new_evidence)} new evidence items extracted",
        source_document="Interview",
        source_section="Full Interview Analysis",
        reason="Post-interview evidence mapping",
        validation_status="INFO",
        agent="Interview Analyst",
    ))

    return analysis.dict()


# ── Search ─────────────────────────────────────────────────────────────────────

@router.post("/search")
def search(req: SearchRequest):
    _hydrate_session_if_needed()
    candidates = list(_session["candidates"].values())
    result = ai_search(req.query, candidates)
    return result.dict()


# ── Report ─────────────────────────────────────────────────────────────────────

@router.post("/report/generate")
def generate_report_endpoint(req: ReportRequest):
    _hydrate_session_if_needed()
    candidate = _session["candidates"].get(req.candidate_id)
    if not candidate:
        raise HTTPException(404, "Candidate not found")
    role = _session.get("role_requirements")
    if not role:
        req_list = [m.requirement for m in candidate.requirement_mappings]
        role = RoleRequirements(
            job_title="Candidate Assessment",
            summary="Candidate evaluation against role criteria",
            required_skills=req_list[:10],
            preferred_skills=req_list[10:15],
            responsibilities=req_list[:5],
            source_file="job_description.txt"
        )
        _session["role_requirements"] = role

    interview_analysis = _session["interview_analysis"].get(req.candidate_id)
    interview_findings = (
        [f"Validated: {r.requirement}" for r in interview_analysis.validated_requirements[:3]] +
        [f"Unresolved: {r.requirement}" for r in interview_analysis.unresolved_requirements[:3]]
        if interview_analysis else []
    )

    report = ai_generate_report(candidate, role, req.recruiter_notes, interview_findings)
    save_report(report.dict())

    _log_audit(AuditEntry(
        candidate_name=candidate.name,
        candidate_id=candidate.id,
        requirement="Evaluation Report",
        insight=f"Intelligence report generated for {candidate.name}",
        evidence=f"{len(report.verified_areas)} verified, {len(report.needs_validation_areas)} need validation, {len(report.missing_areas)} missing",
        source_document="NAV Report Generator",
        source_section="Final Report",
        reason="Recruiter requested evaluation report",
        validation_status="INFO",
        agent="Report Generator",
    ))

    return report.dict()


# ── Audit ──────────────────────────────────────────────────────────────────────

@router.get("/audit")
def get_audit():
    _hydrate_session_if_needed()
    if not _session["audit_trail"]:
        historical = get_audit_entries(session_id=_session.get("id"))
        return historical
    return [e.dict() for e in _session["audit_trail"]]
