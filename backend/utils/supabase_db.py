"""
Supabase persistence layer for NAV.
Saves sessions, candidates, audit trail, and reports.
"""
import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://jgufoicvimrnxzytydtm.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndWZvaWN2aW1ybnh6eXR5ZHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODE1MzIsImV4cCI6MjEwNTM1NzUzMn0.i3lspr_XKGDPtIKhIbM9xUJl8kP7lC0bx4mCupQxAGE")

_client: Client = None


def get_db() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def get_app_config(key: str) -> str:
    try:
        db = get_db()
        res = db.table("app_config").select("value").eq("key", key).single().execute()
        if res.data and "value" in res.data:
            return res.data["value"]
    except Exception as e:
        print(f"[Supabase] get_app_config({key}) failed: {e}")
    return ""


def set_app_config(key: str, value: str) -> None:
    try:
        db = get_db()
        db.table("app_config").upsert({"key": key, "value": value}).execute()
    except Exception as e:
        print(f"[Supabase] set_app_config({key}) failed: {e}")



def save_session(session_id: str, job_title: str, source_file: str, role_dict: dict = None) -> None:
    try:
        db = get_db()
        db.table("sessions").upsert({
            "id": session_id,
            "job_title": job_title,
            "source_file": source_file,
        }).execute()
        set_app_config("LATEST_SESSION_ID", session_id)
        if role_dict:
            set_app_config("LATEST_ROLE_JSON", json.dumps(role_dict))
    except Exception as e:
        print(f"[Supabase] save_session failed: {e}")


def load_latest_session_data() -> dict:
    """Loads the most recently analyzed session, role requirements, and candidates from Supabase."""
    try:
        db = get_db()
        session_id = get_app_config("LATEST_SESSION_ID")
        role_json_str = get_app_config("LATEST_ROLE_JSON")
        role_dict = json.loads(role_json_str) if role_json_str else None

        if not session_id:
            res = db.table("sessions").select("*").order("created_at", desc=True).limit(1).execute()
            if res.data:
                session_id = res.data[0]["id"]

        if not session_id:
            return {"session_id": None, "role": None, "candidates": []}

        # Fetch candidates
        c_res = db.table("candidates").select("*").eq("session_id", session_id).execute()
        candidates = []
        for row in (c_res.data or []):
            if row.get("profile_json"):
                if isinstance(row["profile_json"], str):
                    candidates.append(json.loads(row["profile_json"]))
                else:
                    candidates.append(row["profile_json"])

        return {
            "session_id": session_id,
            "role": role_dict,
            "candidates": candidates,
        }
    except Exception as e:
        print(f"[Supabase] load_latest_session_data failed: {e}")
        return {"session_id": None, "role": None, "candidates": []}


def save_candidate(session_id: str, candidate: dict) -> None:
    try:
        db = get_db()
        db.table("candidates").upsert({
            "id": candidate["id"],
            "session_id": session_id,
            "name": candidate["name"],
            "group_name": candidate.get("group", "Limited Evidence"),
            "profile_json": json.dumps(candidate),
        }).execute()
    except Exception as e:
        print(f"[Supabase] save_candidate failed: {e}")


def save_audit_entry(entry: dict) -> None:
    try:
        db = get_db()
        db.table("audit_trail").upsert({
            "id": entry["id"],
            "session_id": entry.get("session_id"),
            "candidate_name": entry["candidate_name"],
            "candidate_id": entry.get("candidate_id"),
            "requirement": entry["requirement"],
            "insight": entry["insight"],
            "evidence": entry["evidence"],
            "source_document": entry["source_document"],
            "source_section": entry["source_section"],
            "reason": entry["reason"],
            "validation_status": entry["validation_status"],
            "agent": entry["agent"],
            "created_at": entry["timestamp"],
        }).execute()
    except Exception as e:
        print(f"[Supabase] save_audit_entry failed: {e}")


def save_report(report: dict) -> None:
    try:
        db = get_db()
        db.table("reports").upsert({
            "id": report["candidate_id"] + "_report",
            "candidate_id": report["candidate_id"],
            "candidate_name": report["candidate_name"],
            "job_title": report["job_title"],
            "report_json": json.dumps(report),
        }).execute()
    except Exception as e:
        print(f"[Supabase] save_report failed: {e}")


def get_audit_entries(session_id: str = None, limit: int = 200) -> list:
    try:
        db = get_db()
        query = db.table("audit_trail").select("*").order("created_at", desc=True).limit(limit)
        if session_id:
            query = query.eq("session_id", session_id)
        res = query.execute()
        entries = res.data or []
        # Map DB columns back to AuditEntry schema
        for e in entries:
            e["timestamp"] = e.get("created_at", "")
        return entries
    except Exception as e:
        print(f"[Supabase] get_audit_entries failed: {e}")
        return []
