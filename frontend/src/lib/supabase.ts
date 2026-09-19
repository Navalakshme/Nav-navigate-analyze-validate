import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jgufoicvimrnxzytydtm.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndWZvaWN2aW1ybnh6eXR5ZHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODE1MzIsImV4cCI6MjEwNTM1NzUzMn0.i3lspr_XKGDPtIKhIbM9xUJl8kP7lC0bx4mCupQxAGE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function getLatestSession() {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function getSessionCandidates(sessionId: string) {
  const { data } = await supabase
    .from('candidates')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function getAuditEntries(sessionId?: string) {
  let query = supabase
    .from('audit_trail')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (sessionId) query = query.eq('session_id', sessionId);
  const { data } = await query;
  return data || [];
}

export async function getReport(candidateId: string) {
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}
