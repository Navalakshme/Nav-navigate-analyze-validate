"""
Agent 3 — Evidence Mapper
Maps candidate profile against role requirements.
Each requirement gets a status: VERIFIED, NEEDS_VALIDATION, or MISSING.
"""
from .gemini_client import call_gemini
from models.schemas import RequirementMapping, RoleRequirements, CandidateProfile
from typing import List
import json


PROMPT_TEMPLATE = """
You are the Evidence Mapper for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

Your task: For EVERY role requirement listed below, determine whether the candidate's resume provides:
- VERIFIED: Clear, specific evidence supporting this requirement
- NEEDS_VALIDATION: Mentioned but lacks depth, specifics, or production context
- MISSING: No evidence found at all

ROLE REQUIREMENTS:
Job Title: {job_title}
Required Skills: {required_skills}
Preferred Skills: {preferred_skills}
Experience Requirements: {experience_requirements}
Qualifications: {qualifications}

CANDIDATE RESUME PROFILE:
Name: {candidate_name}
Skills: {skills}
Technologies: {technologies}
Experience Summary: {experience_summary}
Projects Summary: {projects_summary}
Education: {education_summary}
Certifications: {certifications}

Return ONLY valid JSON — a list of requirement mappings:
[
  {{
    "requirement": "Python",
    "category": "Required Skill",
    "status": "VERIFIED",
    "evidence": [
      {{
        "text": "Exact quote or close paraphrase from resume",
        "source_document": "{source_file}",
        "source_section": "Experience / Projects / Skills / Education",
        "page": null
      }}
    ],
    "reasoning": "Why this status was assigned",
    "validation_needed": "What specifically needs validation (null if VERIFIED)"
  }}
]

Map EVERY required skill, preferred skill, and experience requirement.
For VERIFIED: provide specific evidence quotes from the resume.
For NEEDS_VALIDATION: explain exactly what is unclear or missing from the claim.
For MISSING: state that no evidence was found.
Be strict: "I know Python" without projects or experience is NEEDS_VALIDATION not VERIFIED.
"""


def map_evidence(
    role: RoleRequirements,
    candidate_data: dict,
    source_file: str,
) -> List[RequirementMapping]:
    # Prepare summaries
    exp_summary = "; ".join(
        f"{e['title']} at {e['company']}: {e['description'][:200]}"
        for e in candidate_data.get("experience", [])
    )
    proj_summary = "; ".join(
        f"{p['name']}: {p['description'][:150]}"
        for p in candidate_data.get("projects", [])
    )
    edu_summary = "; ".join(
        f"{e['degree']} from {e['institution']}"
        for e in candidate_data.get("education", [])
    )

    prompt = PROMPT_TEMPLATE.format(
        job_title=role.job_title,
        required_skills=", ".join(role.required_skills),
        preferred_skills=", ".join(role.preferred_skills),
        experience_requirements="; ".join(role.experience_requirements),
        qualifications="; ".join(role.qualifications),
        candidate_name=candidate_data.get("name", ""),
        skills=", ".join(candidate_data.get("skills", [])),
        technologies=", ".join(candidate_data.get("technologies", [])),
        experience_summary=exp_summary[:1500],
        projects_summary=proj_summary[:1000],
        education_summary=edu_summary,
        certifications=", ".join(candidate_data.get("certifications", [])),
        source_file=source_file,
    )

    data = call_gemini(prompt)
    mappings = []
    for item in data:
        try:
            mappings.append(RequirementMapping(**item))
        except Exception:
            pass
    return mappings
