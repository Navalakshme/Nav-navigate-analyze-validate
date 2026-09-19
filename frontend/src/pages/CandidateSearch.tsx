import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Send, User, Zap, ChevronRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { searchCandidates } from '../api/client';
import type { SearchResult } from '../types';

interface Message {
  type: 'user' | 'nav';
  content: string;
  result?: SearchResult;
  loading?: boolean;
}

export default function CandidateSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { candidates } = useAppStore();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Handle pre-filled query from navigation state
  useEffect(() => {
    if (location.state?.query) {
      setQuery(location.state.query);
      inputRef.current?.focus();
    }
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = async (q?: string) => {
    const finalQuery = q || query;
    if (!finalQuery.trim() || loading) return;

    setMessages(prev => [...prev, { type: 'user', content: finalQuery }]);
    setQuery('');
    setLoading(true);

    setMessages(prev => [...prev, { type: 'nav', content: '', loading: true }]);

    try {
      const res = await searchCandidates(finalQuery);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: 'nav', content: res.data.summary, result: res.data };
        return updated;
      });
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { type: 'nav', content: `Search failed: ${err.message}` };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-accent-purple/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent-violet" />
              </div>
              <h1 className="text-lg font-bold text-text-primary">Ask NAV</h1>
            </div>
            <p className="text-sm text-text-secondary">Query your active candidate pool using natural language</p>
          </div>

          {/* Active Candidate Chips */}
          {candidates.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-text-muted">Candidate Pool:</span>
              {candidates.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSearch(`Summarize ${c.name}'s key strengths and verified evidence`)}
                  className="px-2.5 py-1 rounded-full bg-bg-elevated border border-border-subtle hover:border-accent-violet text-xs text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5"
                >
                  <User className="w-3 h-3 text-accent-violet" />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto pt-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-accent-purple/15 border border-accent-purple/20 flex items-center justify-center mx-auto mb-3">
                <Search className="w-7 h-7 text-accent-violet" />
              </div>
              <h2 className="text-base font-semibold text-text-primary mb-1">Ask NAV anything about your candidates</h2>
              <p className="text-sm text-text-secondary">
                {candidates.length === 0 ? 'Upload and analyze candidates on the Dashboard first' : `Searching across ${candidates.length} active candidate profiles`}
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Which candidates have strong verified evidence for core requirements?',
                'Who needs the most validation in the upcoming interview?',
                'Compare the experience and background of all candidates',
                'Show evidence quotes for cloud and containerization skills',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => handleSearch(q)}
                  className="text-left p-3 rounded-lg border border-border-subtle bg-bg-elevated hover:border-accent-violet/40 hover:bg-bg-elevated/70 transition-all text-xs text-text-secondary hover:text-text-primary flex items-center justify-between group"
                >
                  <span>{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-violet transition-colors flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'user' ? (
                <div className="max-w-xl p-3.5 rounded-2xl bg-accent-purple text-white text-xs leading-relaxed font-medium">
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-2xl space-y-3">
                  <div className="card p-4 space-y-3 border-accent-purple/20">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-accent-purple/20 flex items-center justify-center">
                        <Zap className="w-3 h-3 text-accent-violet" />
                      </div>
                      <span className="text-xs font-bold text-accent-glow">NAV Intelligence Response</span>
                    </div>

                    {msg.loading ? (
                      <div className="flex items-center gap-2 text-xs text-text-muted py-2">
                        <div className="w-3.5 h-3.5 border-2 border-accent-violet/40 border-t-accent-violet rounded-full animate-spin" />
                        Analyzing candidate evidence...
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                        {/* Candidate-Centric Matches */}
                        {msg.result?.matches && msg.result.matches.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border-subtle">
                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Candidate Evidence References</p>
                            <div className="grid grid-cols-1 gap-2">
                              {msg.result.matches.map((m, mi) => (
                                <div key={mi} className="p-2.5 rounded-lg bg-bg-secondary border border-border-subtle flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-text-primary">{m.candidate_name}</span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-bg-elevated border border-border-subtle text-accent-glow">
                                        Relevance: {m.relevance}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-text-secondary leading-snug">{m.matching_evidence}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const matchedCand = candidates.find(c => c.name === m.candidate_name);
                                      if (matchedCand) navigate(`/candidates/${matchedCand.id}`);
                                      else navigate('/candidates');
                                    }}
                                    className="btn-secondary text-[10px] px-2 py-1 flex items-center gap-1 flex-shrink-0"
                                  >
                                    View <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border-subtle flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Ask anything about candidates (e.g. 'Compare AWS experience across all candidates')..."
            className="input-field flex-1 text-xs"
            disabled={loading}
          />
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
            className="btn-primary p-2.5 flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
