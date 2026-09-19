"""
Agent 9 — Search Agent
Answers natural language queries about the candidate pool with evidence-backed results.
"""
from .gemini_client import call_gemini
from models.schemas import SearchResult, SearchResultItem, EvidenceItem, CandidateProfile
from typing import List
import json


PROMPT_TEMPLATE = """
You are the Search Agent for NAV (Navigate, Analyze, Validate), an AI recruitment intelligence system.

A recruiter has asked: "{query}"

Search through the candidate pool and return evidence-backed results.

CANDIDATE POOL:
{candidates_summary}

Return ONLY valid JSON:
{{
  "summary": "1-2 sentence direct answer to the recruiter's query",
  "results": [
    {{
      "candidate_id": "candidate id",
      "candidate_name": "candidate name",
      "relevance_reason": "Why this candidate is relevant to the query (1-2 sentences with specific evidence)",
      "key_skills": ["relevant skills for this query"],
      "evidence": [
        {{
          "text": "Specific evidence from their resume/profile",
          "source_document": "source filename",
          "source_section": "section name",
          "page": null
        }}
      ],
      "group": "their candidate group"
    }}
  ]
}}

Only include candidates genuinely relevant to the query.
If no candidates match, return an empty results array with an explanatory summary.
Order results by relevance (most relevant first).
"""


def search_candidates(query: str, candidates: List[CandidateProfile]) -> SearchResult:
    if not candidates:
        return SearchResult(
            query=query,
            results=[],
            summary="No candidates have been analyzed yet. Please upload and analyze resumes first.",
        )

    # Build concise summary of each candidate for the prompt
    summaries = []
    for c in candidates:
        verified_reqs = [m.requirement for m in c.requirement_mappings if m.status == "VERIFIED"]
        needs_val_reqs = [m.requirement for m in c.requirement_mappings if m.status == "NEEDS_VALIDATION"]
        missing_reqs = [m.requirement for m in c.requirement_mappings if m.status == "MISSING"]

        sample_evidence = []
        for m in c.requirement_mappings:
            if m.evidence:
                sample_evidence.append(f"{m.requirement}: '{m.evidence[0].text[:100]}'")
            if len(sample_evidence) >= 3:
                break

        summary = (
            f"ID: {c.id}\n"
            f"Name: {c.name}\n"
            f"Group: {c.group}\n"
            f"Skills: {', '.join(c.skills[:15])}\n"
            f"Technologies: {', '.join(c.technologies[:15])}\n"
            f"Verified: {', '.join(verified_reqs[:8])}\n"
            f"Needs Validation: {', '.join(needs_val_reqs[:5])}\n"
            f"Missing: {', '.join(missing_reqs[:5])}\n"
            f"Sample Evidence: {'; '.join(sample_evidence)}\n"
            f"Source: {c.source_file}"
        )
        summaries.append(summary)

    candidates_summary = "\n\n---\n\n".join(summaries)

    prompt = PROMPT_TEMPLATE.format(
        query=query,
        candidates_summary=candidates_summary[:6000],
    )

    data = call_gemini(prompt)

    results = []
    for item in data.get("results", []):
        try:
            evidence_items = [EvidenceItem(**e) for e in item.get("evidence", [])]
            results.append(SearchResultItem(
                candidate_id=item["candidate_id"],
                candidate_name=item["candidate_name"],
                relevance_reason=item["relevance_reason"],
                key_skills=item.get("key_skills", []),
                evidence=evidence_items,
                group=item.get("group", "Limited Evidence"),
            ))
        except Exception:
            pass

    return SearchResult(
        query=query,
        results=results,
        summary=data.get("summary", ""),
    )
