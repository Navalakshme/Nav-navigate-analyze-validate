"""
Agent 2 — Candidate Investigator
Extracts structured candidate profile from a resume.
"""
from .gemini_client import call_gemini
from models.schemas import CandidateProfile


PROMPT_TEMPLATE = """
You are the Candidate Investigator for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

Analyze the following resume and extract a comprehensive structured candidate profile.

RESUME TEXT:
{resume_text}

Return ONLY valid JSON matching this exact schema:
{{
  "name": "Full name of candidate",
  "email": "email or null",
  "phone": "phone or null",
  "location": "city/country or null",
  "summary": "3-4 sentence professional summary based on the resume",
  "skills": ["all technical and soft skills mentioned"],
  "experience": [
    {{
      "title": "Job title",
      "company": "Company name",
      "duration": "e.g. Jan 2021 - Present or 2 years",
      "description": "What they did in this role",
      "technologies": ["technologies used in this role"]
    }}
  ],
  "projects": [
    {{
      "name": "Project name",
      "description": "What the project does and candidate's role",
      "technologies": ["tech used"],
      "impact": "measurable impact or result if mentioned, else null"
    }}
  ],
  "education": [
    {{
      "degree": "Degree name",
      "institution": "University/College name",
      "year": "graduation year or null",
      "gpa": "GPA if mentioned or null"
    }}
  ],
  "certifications": ["list of certifications"],
  "technologies": ["deduplicated list of all technologies across all experience and projects"],
  "claims_requiring_evidence": [
    "Any claim in the resume that lacks specific evidence, e.g. 'Led a team' without team size, 'Improved performance' without metrics"
  ],
  "source_file": "{source_file}"
}}

Be thorough. Extract ALL information present. Do NOT invent information not in the resume.
For claims_requiring_evidence, identify vague or unsubstantiated claims that a recruiter would need to validate.
"""


def investigate_candidate(resume_text: str, source_file: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(resume_text=resume_text, source_file=source_file)
    data = call_gemini(prompt)
    data["source_file"] = source_file
    return data
