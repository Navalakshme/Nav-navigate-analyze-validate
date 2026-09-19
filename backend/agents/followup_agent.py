"""
Agent 6 — Follow-Up Agent
Analyzes a candidate's interview answer and generates a targeted follow-up
if deeper validation is required.
"""
from .gemini_client import call_gemini
from typing import Optional, List


PROMPT_TEMPLATE = """
You are the Follow-Up Agent for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

A candidate just answered an interview question. Analyze the answer and determine if deeper validation is needed.

INTERVIEW QUESTION:
{question}

CANDIDATE ANSWER:
{answer}

TARGET REQUIREMENT:
{target_requirement}

ORIGINAL GAP/RATIONALE:
{rationale}

Analyze the answer and return ONLY valid JSON:
{{
  "requires_followup": true or false,
  "follow_up": "Follow-up question text if requires_followup is true, else null",
  "evidence_extracted": [
    "Specific evidence or claim extracted from the answer that is relevant to the requirement"
  ],
  "analysis": "Brief assessment of what the answer revealed (1-2 sentences)"
}}

Follow-up question rules:
- Only generate a follow-up if the answer is vague, claims something without specifics, or raises new questions
- The follow-up must drill into the specific gap in the answer
- Example: If answer mentions 'I deployed to AWS', follow up with 'Which specific AWS services did you use, and how did you handle auto-scaling or monitoring?'
- Do NOT generate follow-ups for clear, complete, evidence-rich answers

Evidence extraction:
- Extract any specific, verifiable claims from the answer
- Include technologies, metrics, team sizes, project names, etc.
"""


def generate_followup(
    question: str,
    answer: str,
    target_requirement: str,
    rationale: str,
) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        question=question,
        answer=answer,
        target_requirement=target_requirement,
        rationale=rationale,
    )
    return call_gemini(prompt)
