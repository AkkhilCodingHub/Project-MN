import React from 'react';
import { BookOpen, Cpu, Radio, Sparkles } from 'lucide-react';

export default function SubjectSeeder({ activeSubject, onSelectSubject }) {
  const subjects = [
    {
      id: 'dsa',
      name: 'Data Structures & Algo',
      code: 'CS-301',
      icon: Cpu,
      docsCount: 3,
      desc: 'Quicksort, Binary Heaps, Graph Traversal, Time Complexities'
    },
    {
      id: 'signals',
      name: 'Signals & Systems',
      code: 'EC-402',
      icon: Radio,
      docsCount: 4,
      desc: 'Laplace Transform, Fourier Series, Nyquist Sampling Theorem'
    },
    {
      id: 'os',
      name: 'Operating Systems',
      code: 'CS-504',
      icon: BookOpen,
      docsCount: 2,
      desc: 'SJF Scheduling, Deadlock 4 Conditions, Page Replacement'
    }
  ];

  return (
    <div style={{ margin: '20px var(--pad-page) 0 var(--pad-page)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="cross" />
          <span className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Pre-Loaded Academic Libraries
          </span>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select a subject to instantly seed vector space</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px'
      }}>
        {subjects.map((sub) => {
          const Icon = sub.icon;
          const isSelected = activeSubject === sub.id;

          return (
            <div
              key={sub.id}
              onClick={() => onSelectSubject(sub.id)}
              className={`glass-panel ${isSelected ? 'glass-panel-glow' : ''}`}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                background: isSelected 
                  ? 'linear-gradient(135deg, rgba(51, 70, 255, 0.18) 0%, rgba(18, 20, 29, 0.9) 100%)' 
                  : 'var(--card-bg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isSelected ? 'var(--brand-blue)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                color: isSelected ? '#fff' : 'var(--neon-cyan)'
              }}>
                <Icon size={18} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{sub.name}</h4>
                  <span className="mono-text" style={{ fontSize: '0.68rem', color: 'var(--neon-lime)' }}>
                    {sub.code}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.35 }}>
                  {sub.desc}
                </p>
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge green" style={{ fontSize: '0.65rem' }}>
                    <Sparkles size={10} /> {sub.docsCount} Notes Indexed
                  </span>
                  {isSelected && (
                    <span className="badge blue" style={{ fontSize: '0.65rem' }}>
                      ACTIVE CONTEXT
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
