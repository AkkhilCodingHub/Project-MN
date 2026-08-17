import React from 'react';
import { Zap, ShieldCheck, Database, HardDrive, Sparkles, Layers } from 'lucide-react';

export default function Header({ 
  userTier, 
  queriesUsed, 
  maxQueries, 
  uploadedCount, 
  maxFiles, 
  isOnline, 
  onOpenProModal 
}) {
  const isPro = userTier === 'pro';

  return (
    <header className="glass-panel" style={{
      margin: '20px var(--pad-page) 0 var(--pad-page)',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    }}>
      {/* Brand Logo & Crosshair Motif */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(51, 70, 255, 0.3) 0%, rgba(193, 255, 0, 0.1) 100%)',
          border: '1px solid rgba(51, 70, 255, 0.5)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 0 16px rgba(51, 70, 255, 0.3)'
        }}>
          <img src="/logo-badge.svg" alt="StudyTrace Logo" style={{ width: '26px', height: '26px' }} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '1.35rem', 
              fontWeight: 800, 
              letterSpacing: '-0.03em',
              background: 'linear-gradient(180deg, #ffffff 0%, #c4cfed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              STUDYTRACE
            </span>
            <span className="mono-text" style={{ 
              fontSize: '0.65rem', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              background: 'rgba(51, 70, 255, 0.2)',
              border: '1px solid rgba(51, 70, 255, 0.4)',
              color: 'var(--neon-cyan)'
            }}>
              RAG v2.0
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`dot ${isOnline ? '' : 'red'}`} />
            <span>{isOnline ? 'Rust Engine Online (Port 8080)' : 'Demo Sandbox Mode'}</span>
          </p>
        </div>
      </div>

      {/* Metrics & Status Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Daily Queries Meter */}
        <div className="glass-panel" style={{
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <Zap size={14} color={isPro ? "var(--neon-lime)" : "var(--neon-cyan)"} />
          <span className="mono-text" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Queries: <strong style={{ color: 'var(--text-main)' }}>{isPro ? '∞ Unlimited' : `${queriesUsed} / ${maxQueries}`}</strong>
          </span>
        </div>

        {/* Upload File Count */}
        <div className="glass-panel" style={{
          padding: '6px 14px',
          borderRadius: 'var(--radius-pill)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}>
          <HardDrive size={14} color="var(--brand-blue)" />
          <span className="mono-text" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Docs: <strong style={{ color: 'var(--text-main)' }}>{isPro ? `${uploadedCount} files` : `${uploadedCount} / ${maxFiles}`}</strong>
          </span>
        </div>

        {/* User Tier Pill & Pro Upgrade Button */}
        {isPro ? (
          <div className="badge green" style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
            <ShieldCheck size={14} /> PRO ACTIVE
          </div>
        ) : (
          <button className="btn-pro" onClick={onOpenProModal}>
            <Sparkles size={14} /> UPGRADE TO PRO
          </button>
        )}
      </div>
    </header>
  );
}
