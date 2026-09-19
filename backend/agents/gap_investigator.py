"""
Agent 4 — Gap Investigator
Finds missing information, unclear claims, and weak evidence.
"""
from .gemini_client import call_gemini
from models.schemas import GapItem, RequirementMapping
from typing import List


PROMPT_TEMPLATE = """
You are the Gap Investigator for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

Review the requirement mappings for candidate "{candidate_name}" and identify:
- Requirements with MISSING status
- Requirements with NEEDS_VALIDATION status
- Any weak evidence that needs clarification
- Vague or unverifiable claims in the resume

REQUIREMENT MAPPINGS (status summary):
{mappings_summary}

CANDIDATE CLAIMS REQUIRING EVIDENCE:
{claims}

Return ONLY valid JSON — a list of gap items:
[
  {{
    "requirement": "Name of requirement",
    "gap_type": "missing | unclear | weak_evidence | unverified_claim",
    "reason": "Specific reason why this is a gap (1-2 sentences)",
    "priority": "high | medium | low"
  }}
]

Priority guide:
- high: Required skill that is completely missing or has unverifiable claims
- medium: Required skill with weak evidence or preferred skill that is missing
- low: Preferred skill with weak evidence or minor clarification needed

Only include genuine gaps. Do not include VERIFIED requirements.
"""


def investigate_gaps(
    candidate_name: str,
    mappings: List[RequirementMapping],
    claims: List[str],
) -> List[GapItem]:
    mappings_summary = "\n".join(
        f"- {m.requirement} [{m.status}]: {m.reasoning[:150]}"
        for m in mappings
        if m.status in ("NEEDS_VALIDATION", "MISSING")
    )
    if not mappings_summary:
        return []

    prompt = PROMPT_TEMPLATE.format(
        candidate_name=candidate_name,
        mappings_summary=mappings_summary,
        claims="\n".join(f"- {c}" for c in claims) if claims else "None",
    )

    data = call_gemini(prompt)
    gaps = []
    for item in data:
        try:
            gaps.append(GapItem(**item))
        except Exception:
            pass
    return gaps
