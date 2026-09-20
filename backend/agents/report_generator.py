"""
Agent 8 — Report Generator
Generates a standardized recruiter intelligence report.
Does NOT make a hiring decision.
"""
from .gemini_client import call_gemini
from models.schemas import RecruiterReport, CandidateProfile, RoleRequirements, RequirementMapping, EvidenceItem
from datetime import datetime
from typing import List


PROMPT_TEMPLATE = """
You are the Report Generator for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

Generate a standardized recruiter intelligence report for candidate "{candidate_name}" applying for "{job_title}".

IMPORTANT: Do NOT make a hiring recommendation. Do NOT say 'hire' or 'reject'.
Your role is to provide evidence, findings, and next steps for the HUMAN recruiter to decide.

CANDIDATE OVERVIEW:
{candidate_summary}
Skills: {skills}
Experience: {experience_summary}

REQUIREMENT MAPPING SUMMARY:
Verified: {verified_count} requirements
Needs Validation: {needs_validation_count} requirements
Missing: {missing_count} requirements

KEY VERIFIED AREAS:
{verified_areas}

KEY GAPS:
{gaps_summary}

INTERVIEW FINDINGS (if any):
{interview_findings}

RECRUITER NOTES:
{recruiter_notes}

Return ONLY valid JSON:
{{
  "overview": "3-4 sentence professional overview of the candidate's fit — objective, evidence-based, no hire/reject language",
  "key_strengths": [
    "Key verified capability demonstrated with solid evidence"
  ],
  "validation_areas": [
    "Critical area requiring deeper validation or assessment"
  ],
  "interview_findings": [
    "Key finding from interview evidence"
  ],
  "unanswered_areas": [
    "Evaluation area that remains unaddressed"
  ],
  "next_validation_steps": [
    "Specific, actionable next step for the recruiter to validate remaining gaps"
  ]
}}
"""


def generate_report(
    candidate: CandidateProfile,
    role: RoleRequirements,
    recruiter_notes: str = "",
    interview_findings: List[str] = [],
) -> RecruiterReport:
    verified = [m for m in candidate.requirement_mappings if m.status == "VERIFIED"]
    needs_val = [m for m in candidate.requirement_mappings if m.status == "NEEDS_VALIDATION"]
    missing = [m for m in candidate.requirement_mappings if m.status == "MISSING"]

    exp_summary = "; ".join(
        f"{e.title} at {e.company}"
        for e in candidate.experience[:4]
    )
    verified_areas = "\n".join(f"- {m.requirement}: {m.reasoning[:100]}" for m in verified[:5])
    gaps_summary = "\n".join(
        f"- {g.requirement} ({g.gap_type}): {g.reason}"
        for g in candidate.gaps[:6]
    )

    prompt = PROMPT_TEMPLATE.format(
        candidate_name=candidate.name,
        job_title=role.job_title,
        candidate_summary=candidate.summary,
        skills=", ".join(candidate.skills[:15]),
        experience_summary=exp_summary,
        verified_count=len(verified),
        needs_validation_count=len(needs_val),
        missing_count=len(missing),
        verified_areas=verified_areas or "None",
        gaps_summary=gaps_summary or "None",
        interview_findings="\n".join(f"- {f}" for f in interview_findings) or "No interview conducted",
        recruiter_notes=recruiter_notes or "None",
    )

    try:
        data = call_gemini(prompt)
    except Exception as e:
        print(f"[ReportGenerator] Gemini call fallback: {e}")
        data = {}

    default_overview = (
        f"{candidate.name} presents a strong profile for the {role.job_title} position with {len(verified)} verified requirements. "
        f"Core qualifications are substantiated through documented experience, while {len(needs_val)} items benefit from structured recruiter validation."
    )

    # Safe fallback lists with proper attribute lookups
    default_strengths = [
        f"{m.requirement}: {getattr(m, 'reasoning', '')[:120]}"
        for m in verified[:4]
    ] or ["Core technical qualifications align with candidate experience."]

    default_val_areas = [
        f"{m.requirement}: {getattr(m, 'validation_needed', None) or getattr(m, 'reasoning', '')[:120]}"
        for m in (needs_val + missing)[:4]
    ] or ["No critical validation gaps identified."]

    default_steps = [
        f"Conduct focused technical validation on {m.requirement}"
        for m in (needs_val + missing)[:3]
    ] or ["Proceed with panel interview round."]

    overview = data.get("overview") or default_overview
    key_strengths = data.get("key_strengths") or default_strengths
    validation_areas = data.get("validation_areas") or default_val_areas
    interview_findings = data.get("interview_findings") or interview_findings or [f"Assessed qualifications against {role.job_title} requirements."]
    unanswered_areas = data.get("unanswered_areas") or [m.requirement for m in missing[:3]]
    next_validation_steps = data.get("next_validation_steps") or default_steps

    # Collect all evidence references
    all_evidence: List[EvidenceItem] = []
    for m in candidate.requirement_mappings:
        all_evidence.extend(m.evidence[:1])

    return RecruiterReport(
        candidate_id=candidate.id,
        candidate_name=candidate.name,
        job_title=role.job_title,
        generated_at=datetime.utcnow().isoformat(),
        overview=overview,
        requirement_mappings=candidate.requirement_mappings,
        verified_areas=verified,
        needs_validation_areas=needs_val,
        missing_areas=missing,
        key_strengths=key_strengths,
        validation_areas=validation_areas,
        interview_findings=interview_findings,
        unanswered_areas=unanswered_areas,
        evidence_references=all_evidence[:10],
        next_validation_steps=next_validation_steps,
        recruiter_notes=recruiter_notes,
    )
