"""
Agent 5 — Interview Strategist
Generates candidate-specific interview questions based on gaps and requirements.
"""
from .gemini_client import call_gemini
from models.schemas import InterviewQuestion, CandidateProfile, RoleRequirements, GapItem
from typing import List
import uuid


PROMPT_TEMPLATE = """
You are the Interview Strategist for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

Generate candidate-specific interview questions for {candidate_name} applying for {job_title}.

These questions MUST be tailored to this specific candidate based on their background, gaps, and the role requirements.
Do NOT generate generic questions that could apply to any candidate.

CANDIDATE BACKGROUND:
Skills: {skills}
Experience: {experience_summary}
Projects: {projects_summary}
Claims requiring evidence: {claims}

IDENTIFIED GAPS (prioritized):
{gaps_summary}

ROLE: {job_title}
KEY REQUIREMENTS: {key_requirements}

Generate 8-12 targeted interview questions. Mix:
- Technical questions addressing specific gaps
- Behavioral questions about unclear claims
- Situational questions about role requirements
- Deep-dive questions about mentioned projects/experience

Return ONLY valid JSON — a list of interview questions:
[
  {{
    "question": "Full interview question text — specific to this candidate",
    "category": "Technical | Behavioral | Situational | Project Deep-dive",
    "rationale": "Why this question is relevant for this specific candidate (1 sentence)",
    "target_requirement": "Which job requirement this addresses",
    "gap_addressed": "Which gap this helps validate, or null",
    "difficulty": "technical | behavioral | situational"
  }}
]

Remember: Questions must reference specific things from THIS candidate's background.
Example: 'You mentioned building a recommendation engine at TechCorp — what was the scale in terms of users and requests per second?'
NOT: 'Tell me about a time you built a machine learning model.'
"""


def generate_questions(
    candidate: CandidateProfile,
    role: RoleRequirements,
) -> List[InterviewQuestion]:
    exp_summary = "; ".join(
        f"{e.title} at {e.company}: {e.description[:200]}"
        for e in candidate.experience[:4]
    )
    proj_summary = "; ".join(
        f"{p.name}: {p.description[:150]}"
        for p in candidate.projects[:4]
    )
    gaps_summary = "\n".join(
        f"- [{g.priority.upper()}] {g.requirement}: {g.reason}"
        for g in candidate.gaps[:10]
    )

    prompt = PROMPT_TEMPLATE.format(
        candidate_name=candidate.name,
        job_title=role.job_title,
        skills=", ".join(candidate.skills[:20]),
        experience_summary=exp_summary[:1000],
        projects_summary=proj_summary[:800],
        claims="; ".join(candidate.claims_requiring_evidence[:8]),
        gaps_summary=gaps_summary or "No major gaps identified",
        key_requirements=", ".join(role.required_skills[:10]),
    )

    data = call_gemini(prompt)
    questions = []
    for item in data:
        try:
            item["id"] = str(uuid.uuid4())
            questions.append(InterviewQuestion(**item))
        except Exception:
            pass
    return questions
