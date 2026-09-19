"""
Agent 7 — Interview Analyst
Analyzes all interview answers and maps evidence back to job requirements.
"""
from .gemini_client import call_gemini
from models.schemas import InterviewAnalysis, RequirementMapping, EvidenceItem
from typing import Dict


PROMPT_TEMPLATE = """
You are the Interview Analyst for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

Analyze the following interview Q&A session for candidate "{candidate_name}" and produce a structured analysis.

ROLE: {job_title}
KEY REQUIREMENTS: {key_requirements}

PRE-INTERVIEW GAPS:
{gaps_summary}

INTERVIEW Q&A:
{qa_text}

Return ONLY valid JSON:
{{
  "validated_requirements": [
    {{
      "requirement": "requirement name",
      "category": "Technical/Experience/etc",
      "status": "VERIFIED",
      "evidence": [
        {{
          "text": "What the candidate said that validates this",
          "source_document": "Interview",
          "source_section": "Interview Answer",
          "page": null
        }}
      ],
      "reasoning": "Why this is now verified based on the interview"
    }}
  ],
  "unresolved_requirements": [
    {{
      "requirement": "requirement name",
      "category": "Technical/Experience/etc",
      "status": "NEEDS_VALIDATION",
      "evidence": [],
      "reasoning": "Why this remains unresolved after the interview"
    }}
  ],
  "new_evidence": [
    {{
      "text": "New information revealed in the interview not in the resume",
      "source_document": "Interview",
      "source_section": "Interview Answer",
      "page": null
    }}
  ],
  "contradictions": [
    "Description of any contradiction between interview answers and resume claims"
  ],
  "unanswered_areas": [
    "Requirements or gaps that were not addressed during the interview"
  ],
  "recommended_followups": [
    "Specific recommended next steps for validation"
  ]
}}
"""


def analyze_interview(
    candidate_name: str,
    job_title: str,
    key_requirements: list,
    gaps: list,
    questions_and_answers: Dict[str, str],
) -> InterviewAnalysis:
    gaps_summary = "\n".join(f"- {g.requirement}: {g.reason}" for g in gaps[:8])
    qa_text = "\n\n".join(
        f"Q: {q}\nA: {a}"
        for q, a in questions_and_answers.items()
    )

    prompt = PROMPT_TEMPLATE.format(
        candidate_name=candidate_name,
        job_title=job_title,
        key_requirements=", ".join(key_requirements[:10]),
        gaps_summary=gaps_summary or "No major gaps",
        qa_text=qa_text[:3000],
    )

    data = call_gemini(prompt)

    def parse_mappings(items):
        result = []
        for item in items:
            try:
                result.append(RequirementMapping(**item))
            except Exception:
                pass
        return result

    def parse_evidence(items):
        result = []
        for item in items:
            try:
                result.append(EvidenceItem(**item))
            except Exception:
                pass
        return result

    return InterviewAnalysis(
        validated_requirements=parse_mappings(data.get("validated_requirements", [])),
        unresolved_requirements=parse_mappings(data.get("unresolved_requirements", [])),
        new_evidence=parse_evidence(data.get("new_evidence", [])),
        contradictions=data.get("contradictions", []),
        unanswered_areas=data.get("unanswered_areas", []),
        recommended_followups=data.get("recommended_followups", []),
    )
