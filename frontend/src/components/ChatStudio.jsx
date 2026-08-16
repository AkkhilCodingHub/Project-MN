import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, FileText, CheckCircle2, AlertCircle, Table, RefreshCw } from 'lucide-react';
import katex from 'katex';
import { queryRAG } from '../services/api';

export default function ChatStudio({ activeSubject, queriesUsed, maxQueries, isPro, onQueryExecuted, onLimitExceeded }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am your **StudyTrace AI Academic Tutor**. Ask me anything about your engineering notes or exam papers. I will provide step-by-step mathematical derivations, comparison tables, and exact page citations.",
      grounded: true,
      sources: [
        { doc: "Signals_Unit3_LaplaceTransform.pdf", page: 1 },
        { doc: "Data_Structures_Lecture_Notes.pdf", page: 12 }
      ]
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const promptChips = [
    "Explain Laplace Transform of Unit Step Function step-by-step",
    "Compare Quicksort vs Merge Sort in a markdown table",
    "What are the 4 necessary conditions for Deadlock in OS?",
    "Derive the Nyquist Sampling Theorem criteria"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    if (!isPro && queriesUsed >= maxQueries) {
      onLimitExceeded();
      return;
    }

    const userMsg = { id: Date.now().toString(), sender: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await queryRAG(q);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.text,
        grounded: res.grounded,
        sources: res.sources || []
      };
      setMessages(prev => [...prev, botMsg]);
      onQueryExecuted();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `⚠️ Query Error: ${err.message || 'Failed to connect to backend engine.'}`,
          grounded: false,
          sources: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic Math + Formatting Parser
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    // Render LaTeX Math if present
    let formatted = rawText;
    
    // Simple inline math parsing replacement for demo safety
    const parts = formatted.split('\n\n');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: 1.6 }}>
        {parts.map((p, idx) => {
          if (p.startsWith('|') && p.includes('|')) {
            // Simple markdown table parser
            const rows = p.split('\n').filter(r => r.trim() && !r.includes(':---'));
            if (rows.length >= 2) {
              const headers = rows[0].split('|').filter(c => c.trim());
              const bodyRows = rows.slice(1).map(r => r.split('|').filter(c => c.trim()));
              
              return (
                <div key={idx} style={{ overflowX: 'auto', margin: '8px 0' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.82rem',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ background: 'rgba(51, 70, 255, 0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        {headers.map((h, hIdx) => (
                          <th key={hIdx} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>
                            {h.trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bodyRows.map((r, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {r.map((cell, cIdx) => (
                            <td key={cIdx} style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                              {cell.trim()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
          }

          // Format LaTeX inline/block math
          try {
            if (p.includes('$$') || p.includes('$')) {
              let htmlStr = p;
              // replace block math
              htmlStr = htmlStr.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
                return katex.renderToString(math, { displayMode: true, throwOnError: false });
              });
              // replace inline math
              htmlStr = htmlStr.replace(/\$(.*?)\$/g, (_, math) => {
                return katex.renderToString(math, { displayMode: false, throwOnError: false });
              });

              return (
                <div 
                  key={idx} 
                  dangerouslySetInnerHTML={{ __html: htmlStr }} 
                  style={{ fontSize: '0.92rem' }}
                />
              );
            }
          } catch {
            // fallback if katex parse fails
          }

          return (
            <p key={idx} style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
              {p}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{
      margin: '24px var(--pad-page) 0 var(--pad-page)',
      display: 'flex',
      flexDirection: 'column',
      height: '620px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(51, 70, 255, 0.2)',
            border: '1px solid rgba(51, 70, 255, 0.4)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--neon-cyan)'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>RAG Grounded Academic Studio</h3>
            <span className="mono-text" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Powered by Pinecone Vectors + Gemini 1.5 Flash
            </span>
          </div>
        </div>

        <span className="badge blue">
          <Sparkles size={12} /> Grounded Answers
        </span>
      </div>

      {/* Messages Scroll Body */}
      <div style={{
        flex: 1,
        padding: '20px 24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                gap: '12px',
                flexDirection: isUser ? 'row-reverse' : 'row'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: isUser ? 'var(--brand-blue)' : 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                color: '#fff'
              }}>
                {isUser ? <User size={16} /> : <Bot size={16} color="var(--neon-lime)" />}
              </div>

              <div style={{
                background: isUser 
                  ? 'linear-gradient(135deg, var(--brand-blue) 0%, var(--dark-blue) 100%)' 
                  : 'rgba(255, 255, 255, 0.04)',
                border: '1px solid ' + (isUser ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'),
                borderRadius: '16px',
                padding: '14px 18px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}>
                {renderFormattedText(msg.text)}

                {/* Grounding & Source Citation Pills */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span className="mono-text" style={{ fontSize: '0.68rem', color: 'var(--neon-lime)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Grounded Sources ({msg.sources.length}):
                    </span>
                    {msg.sources.map((src, idx) => (
                      <span key={idx} className="badge" style={{ fontSize: '0.65rem', background: 'rgba(51, 70, 255, 0.15)', borderColor: 'rgba(51, 70, 255, 0.3)', color: '#fff' }}>
                        <FileText size={10} color="var(--neon-cyan)" /> {src.doc} (Pg {src.page})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'grid',
              placeItems: 'center'
            }}>
              <RefreshCw size={16} color="var(--neon-cyan)" className="pulse-dot" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} className="mono-text">
              Querying Pinecone vector space & generating grounded tutor response...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div style={{
        padding: '10px 24px',
        background: 'rgba(0,0,0,0.15)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto'
      }}>
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="btn-ghost"
            style={{ fontSize: '0.75rem', padding: '4px 12px', flexShrink: 0 }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        gap: '12px'
      }}>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question on your course notes, formulas, or past exam papers..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-pill)',
            padding: '12px 20px',
            color: '#fff',
            fontSize: '0.92rem',
            outline: 'none'
          }}
        />

        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputQuery.trim()}
          className="btn-primary"
          style={{ flexShrink: 0 }}
        >
          <span>Ask Tutor</span>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
