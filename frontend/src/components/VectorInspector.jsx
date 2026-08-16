import React from 'react';
import { Cpu, HardDrive, ShieldCheck, Activity, Terminal, Layers, Database } from 'lucide-react';

export default function VectorInspector({ uploadedDocs, queriesUsed, maxQueries, isPro, isOnline }) {
  const telemetry = [
    { label: 'Embedding Model', value: 'gemini-embedding-2', icon: Cpu, accent: 'var(--neon-cyan)' },
    { label: 'Vector Dimensions', value: '768-D (Dense)', icon: Layers, accent: 'var(--neon-lime)' },
    { label: 'Vector Index Host', value: 'Pinecone Serverless', icon: HardDrive, accent: 'var(--brand-blue)' },
    { label: 'Database Pool', value: 'Supabase Postgres (5 Max)', icon: Database, accent: 'var(--neon-purple)' }
  ];

  return (
    <div className="glass-panel" style={{
      margin: '24px var(--pad-page) 0 var(--pad-page)',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(157, 78, 223, 0.15)',
            border: '1px solid rgba(157, 78, 223, 0.3)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--neon-purple)'
          }}>
            <Activity size={20} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Vector Telemetry & System Status</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Real-time vector index parameters and database pooling metrics.
            </p>
          </div>
        </div>

        <span className="badge green" style={{ padding: '6px 12px' }}>
          <span className="dot" /> SYSTEM HEALTHY
        </span>
      </div>

      {/* Grid Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {telemetry.map((t, idx) => {
          const Icon = t.icon;

          return (
            <div
              key={idx}
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                display: 'grid',
                placeItems: 'center',
                color: t.accent,
                flexShrink: 0
              }}>
                <Icon size={18} />
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.label}</div>
                <div className="mono-text" style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px', color: '#fff' }}>
                  {t.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Telemetry Snippet */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: '#07080b',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        color: 'var(--neon-lime)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '4px' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} color="var(--neon-cyan)" /> Active System Telemetry Log
          </span>
          <span style={{ color: 'var(--neon-cyan)' }}>[OK] 200 OK</span>
        </div>
        <div>[SQLx Pool] Max connections: 5 | Idle timeout: 30s | Status: Ready</div>
        <div>[Pinecone] Namespace: user_8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d</div>
        <div>[Gemini 1.5 Flash] Output MIME: application/json | Rate Limit: Free Tier</div>
        <div>[Razorpay Webhook] Signature Check: HMAC-SHA256 active</div>
      </div>
    </div>
  );
}
