import React, { useState } from 'react';
import { X, Sparkles, Check, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { triggerRazorpayWebhook } from '../services/api';

export default function ProModal({ isOpen, onClose, onUpgradeSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      await triggerRazorpayWebhook();
      onUpgradeSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'grid',
      placeItems: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel glass-panel-glow" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '32px',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(18, 20, 29, 0.98) 0%, rgba(9, 10, 15, 0.98) 100%)',
        borderColor: 'rgba(193, 255, 0, 0.4)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span className="badge green" style={{ padding: '6px 12px' }}>
            <Sparkles size={14} /> UNLIMITED UNLOCK
          </span>
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2 }}>
          Upgrade to StudyTrace Pro
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          Remove all daily query limits and unlock unlimited course PDF document uploads.
        </p>

        {/* Features Comparison */}
        <div style={{ margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            'Unlimited Daily AI RAG Queries (No 10-query limit)',
            'Unlimited PDF Document Uploads (No 3-file cap)',
            'Priority Pinecone Vector Retrieval Speed',
            'One-Click Step-by-Step PDF Answer Export',
            'Full Quiz & Flashcard Deck Autogeneration'
          ].map((feat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(193, 255, 0, 0.15)',
                border: '1px solid rgba(193, 255, 0, 0.4)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--neon-lime)',
                flexShrink: 0
              }}>
                <Check size={14} />
              </div>
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Pricing Pill */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div>
            <div className="mono-text" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RAZORPAY SUBSCRIPTION</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
              ₹299 <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ month</span>
            </div>
          </div>

          <span className="badge blue">Cancel Anytime</span>
        </div>

        {/* Upgrade Action Button */}
        <button
          onClick={handleSimulatePayment}
          disabled={isProcessing}
          className="btn-pro"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '14px',
            fontSize: '1rem',
            borderRadius: 'var(--radius-pill)'
          }}
        >
          <span>{isProcessing ? 'Verifying Webhook Signature...' : 'Upgrade Now (Razorpay Simulation)'}</span>
          <ArrowRight size={18} />
        </button>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '12px' }}>
          🔒 Secured via Razorpay Webhook HMAC-SHA256 signature verification.
        </p>
      </div>
    </div>
  );
}
