"""
Unified Candidate Investigator & Evidence Mapper
Combines candidate profile extraction, evidence mapping, and gap analysis into a single
high-efficiency Gemini API call, minimizing rate limit usage.
"""
from .gemini_client import call_gemini
from models.schemas import RoleRequirements, RequirementMapping, GapItem, EvidenceItem
from typing import Tuple, List, Dict


PROMPT_TEMPLATE = """
You are the Lead Intelligence Agent for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

Analyze the candidate resume against the provided role requirements.

ROLE REQUIREMENTS:
Job Title: {job_title}
Required Skills: {required_skills}
Preferred Skills: {preferred_skills}
Experience Requirements: {experience_requirements}
Qualifications: {qualifications}

CANDIDATE RESUME:
{resume_text}

Perform a 3-part comprehensive investigation:
1. Extract the candidate's structured profile (skills, experience, projects, education, unverified claims).
2. Map candidate evidence against EVERY single role requirement (Status must be VERIFIED, NEEDS_VALIDATION, or MISSING).
   - VERIFIED: Clear, verifiable evidence with exact quotes/details from the resume.
   - NEEDS_VALIDATION: Claimed or mentioned, but lacks architectural specifics, metrics, or production depth.
   - MISSING: Not found anywhere in the resume.
3. Identify specific gaps and claims requiring validation.

Return ONLY valid JSON matching this schema:
{{
  "name": "Candidate Full Name",
  "email": "email or null",
  "phone": "phone or null",
  "location": "location or null",
  "summary": "3-4 sentence objective summary of candidate background",
  "skills": ["all technical & professional skills found"],
  "technologies": ["all technologies, frameworks, and tools mentioned"],
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "duration": "e.g. 2021 - Present",
      "description": "Responsibilities and achievements",
      "technologies": ["tools used"]
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "description": "Project overview",
      "technologies": ["tech stack"],
      "impact": "measurable result if any or null"
    }}
  ],
  "education": [
    {{
      "degree": "Degree title",
      "institution": "University/College",
      "year": "Graduation year or null",
      "gpa": "GPA or null"
    }}
  ],
  "certifications": ["list of certifications"],
  "claims_requiring_evidence": [
    "Vague, unquantified, or unsubstantiated claims from the resume"
  ],
  "requirement_mappings": [
    {{
      "requirement": "Python / AWS / Kubernetes / etc.",
      "category": "Required Skill | Preferred Skill | Experience | Qualification",
      "status": "VERIFIED | NEEDS_VALIDATION | MISSING",
      "evidence": [
        {{
          "text": "Verbatim quote or direct evidence from resume",
          "source_document": "{source_file}",
          "source_section": "Experience / Projects / Skills / Education",
          "page": null
        }}
      ],
      "reasoning": "Clear explanation of why this status was assigned",
      "validation_needed": "What specifically needs validation during the interview (null if VERIFIED)"
    }}
  ],
  "gaps": [
    {{
      "requirement": "Requirement name",
      "gap_type": "missing | unclear | weak_evidence | unverified_claim",
      "reason": "Why this is a gap",
      "priority": "high | medium | low"
    }}
  ]
}}
"""


def process_candidate_unified(
    role: RoleRequirements,
    resume_text: str,
    source_file: str,
) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        job_title=role.job_title,
        required_skills=", ".join(role.required_skills),
        preferred_skills=", ".join(role.preferred_skills),
        experience_requirements="; ".join(role.experience_requirements),
        qualifications="; ".join(role.qualifications),
        resume_text=resume_text[:6000],
        source_file=source_file,
    )

    data = call_gemini(prompt)
    data["source_file"] = source_file
    return data
