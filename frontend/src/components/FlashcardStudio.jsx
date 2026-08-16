import React, { useState, useEffect } from 'react';
import { Layers, ChevronLeft, ChevronRight, RotateCcw, Check, Sparkles, RefreshCw } from 'lucide-react';
import katex from 'katex';
import { fetchFlashcards } from '../services/api';

export default function FlashcardStudio({ activeSubject }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [masteredIds, setMasteredIds] = useState(new Set());

  useEffect(() => {
    loadCards();
  }, [activeSubject]);

  const loadCards = async () => {
    setIsLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);

    try {
      const data = await fetchFlashcards();
      setCards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleMastered = () => {
    setMasteredIds(prev => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  const renderMathText = (text) => {
    if (!text) return null;
    if (text.includes('$') || text.includes('\\')) {
      try {
        let htmlStr = text.replace(/\$(.*?)\$/g, (_, math) => {
          return katex.renderToString(math, { displayMode: false, throwOnError: false });
        });
        return <span dangerouslySetInnerHTML={{ __html: htmlStr }} />;
      } catch {
        // fallback
      }
    }
    return text;
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="glass-panel" style={{
      margin: '24px var(--pad-page) 0 var(--pad-page)',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Top Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(0, 240, 255, 0.15)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--neon-cyan)'
          }}>
            <Layers size={20} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Interactive 3D Flashcard Deck</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click card to flip between engineering terms & derivations.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {cards.length > 0 && (
            <span className="mono-text" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Mastered: <strong style={{ color: 'var(--neon-lime)' }}>{masteredIds.size} / {cards.length}</strong>
            </span>
          )}

          <button onClick={loadCards} disabled={isLoading} className="btn-ghost" style={{ fontSize: '0.8rem' }}>
            <RefreshCw size={14} className={isLoading ? 'pulse-dot' : ''} />
            <span>Reload Deck</span>
          </button>
        </div>
      </div>

      {/* 3D Card Display */}
      {!currentCard ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading flashcard deck...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          {/* Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`flip-card ${isFlipped ? 'flipped' : ''}`}
            style={{
              width: '100%',
              maxWidth: '560px',
              height: '280px',
              cursor: 'pointer'
            }}
          >
            <div className="flip-card-inner">
              {/* Front Side */}
              <div className="flip-card-front glass-panel glass-panel-glow" style={{
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(51, 70, 255, 0.15) 0%, rgba(18, 20, 29, 0.95) 100%)',
                borderColor: 'rgba(51, 70, 255, 0.5)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge blue" style={{ fontSize: '0.65rem' }}>
                    TERM / CONCEPT
                  </span>
                  <span className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Card {currentIndex + 1} of {cards.length}
                  </span>
                </div>

                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  color: '#fff',
                  lineHeight: 1.4
                }}>
                  {renderMathText(currentCard.front)}
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--neon-cyan)' }} className="mono-text">
                  (Click to flip card ➔)
                </div>
              </div>

              {/* Back Side */}
              <div className="flip-card-back glass-panel" style={{
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(193, 255, 0, 0.12) 0%, rgba(18, 20, 29, 0.95) 100%)',
                borderColor: 'rgba(193, 255, 0, 0.4)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge green" style={{ fontSize: '0.65rem' }}>
                    EXPLANATION / DERIVATION
                  </span>
                  <span className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Card {currentIndex + 1} of {cards.length}
                  </span>
                </div>

                <div style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                  lineHeight: 1.5
                }}>
                  {renderMathText(currentCard.back)}
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--neon-lime)' }} className="mono-text">
                  (Click to flip back ➔)
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={handlePrev} className="btn-ghost" style={{ borderRadius: '50%', padding: '10px' }}>
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={toggleMastered}
              className={`btn-ghost ${masteredIds.has(currentIndex) ? 'badge green' : ''}`}
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              <Check size={16} color={masteredIds.has(currentIndex) ? 'var(--neon-lime)' : 'var(--text-muted)'} />
              <span>{masteredIds.has(currentIndex) ? 'Mastered!' : 'Mark as Mastered'}</span>
            </button>

            <button onClick={handleNext} className="btn-ghost" style={{ borderRadius: '50%', padding: '10px' }}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
