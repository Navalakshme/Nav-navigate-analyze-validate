"""
Agent 1 — Requirement Analyst
Extracts structured role requirements from a job description.
"""
from .gemini_client import call_gemini
from models.schemas import RoleRequirements


PROMPT_TEMPLATE = """
You are the Requirement Analyst for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

Analyze the following job description and extract structured role requirements.

JOB DESCRIPTION:
{jd_text}

Return ONLY valid JSON matching this exact schema:
{{
  "job_title": "string",
  "company": "string or null",
  "summary": "2-3 sentence summary of the role",
  "required_skills": ["list of required technical and soft skills"],
  "preferred_skills": ["list of nice-to-have skills"],
  "experience_requirements": ["list of experience requirements as full sentences"],
  "qualifications": ["list of educational and certification requirements"],
  "responsibilities": ["list of key job responsibilities"],
  "evidence_expectations": {{
    "SkillName": "What evidence would demonstrate this skill (e.g. production deployment, GitHub projects, certifications)"
  }},
  "source_file": "{source_file}"
}}

Be thorough. Extract ALL skills, requirements and qualifications mentioned.
For evidence_expectations, include entries for all required_skills and key preferred_skills.
"""


def analyze_requirements(jd_text: str, source_file: str) -> RoleRequirements:
    prompt = PROMPT_TEMPLATE.format(jd_text=jd_text, source_file=source_file)
    data = call_gemini(prompt)
    data["source_file"] = source_file
    return RoleRequirements(**data)
