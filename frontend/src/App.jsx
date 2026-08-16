import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SubjectSeeder from './components/SubjectSeeder';
import DocumentIngest from './components/DocumentIngest';
import ChatStudio from './components/ChatStudio';
import QuizGenerator from './components/QuizGenerator';
import FlashcardStudio from './components/FlashcardStudio';
import VectorInspector from './components/VectorInspector';
import ProModal from './components/ProModal';
import { checkBackendHealth } from './services/api';
import { MessageSquare, HelpCircle, Layers, UploadCloud, Activity } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [userTier, setUserTier] = useState('free'); // 'free' or 'pro'
  const [queriesUsed, setQueriesUsed] = useState(2);
  const [activeSubject, setActiveSubject] = useState('dsa');
  const [isOnline, setIsOnline] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  const [uploadedDocs, setUploadedDocs] = useState([
    {
      id: 'demo-1',
      fileName: 'Data_Structures_Lecture_Notes.pdf',
      fileSize: '412.5 KB',
      namespace: 'user_8a7b9c1d-2e3f',
      uploadedAt: '12:45 PM'
    },
    {
      id: 'demo-2',
      fileName: 'Signals_Unit3_LaplaceTransform.pdf',
      fileSize: '125.8 KB',
      namespace: 'user_8a7b9c1d-2e3f',
      uploadedAt: '01:10 PM'
    }
  ]);

  useEffect(() => {
    async function verifyBackend() {
      const healthy = await checkBackendHealth();
      setIsOnline(healthy);
    }
    verifyBackend();
  }, []);

  const maxQueries = userTier === 'pro' ? Infinity : 10;
  const maxFiles = userTier === 'pro' ? Infinity : 3;

  const handleQueryExecuted = () => {
    if (userTier === 'free') {
      setQueriesUsed(prev => prev + 1);
    }
  };

  const handleLimitExceeded = () => {
    setIsProModalOpen(true);
  };

  const tabs = [
    { id: 'chat', label: 'RAG Grounded Chat', icon: MessageSquare },
    { id: 'quiz', label: 'Sessional Quiz Engine', icon: HelpCircle },
    { id: 'flashcards', label: '3D Flashcards Deck', icon: Layers },
    { id: 'ingest', label: 'PDF Document Ingest', icon: UploadCloud },
    { id: 'inspector', label: 'Vector Telemetry', icon: Activity }
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Top Header */}
      <Header
        userTier={userTier}
        queriesUsed={queriesUsed}
        maxQueries={maxQueries}
        uploadedCount={uploadedDocs.length}
        maxFiles={maxFiles}
        isOnline={isOnline}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      {/* Hero Announcement Banner */}
      <div style={{ margin: '20px var(--pad-page) 0 var(--pad-page)' }}>
        <div className="glass-panel" style={{
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(51, 70, 255, 0.12) 0%, rgba(193, 255, 0, 0.05) 100%)',
          borderColor: 'rgba(51, 70, 255, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="dot" />
              <span className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--neon-lime)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Engineering Exam & Study Dashboard
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              Curriculum-Aligned RAG Engine & Interactive Study Studio
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '720px' }}>
              Upload your course PDFs or lecture notes. Answers are strictly grounded in your syllabus with step-by-step math derivations, comparison tables, and exact page citations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setActiveTab('ingest')}
              className="btn-primary"
            >
              Upload PDF Notes
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="btn-ghost"
            >
              Start RAG Chat
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Loaded Subject Selector */}
      <SubjectSeeder
        activeSubject={activeSubject}
        onSelectSubject={setActiveSubject}
      />

      {/* Navigation Studio Tabs */}
      <div style={{ margin: '24px var(--pad-page) 0 var(--pad-page)' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '10px'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn-ghost ${isActive ? 'glass-panel-glow' : ''}`}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-pill)',
                  background: isActive ? 'rgba(51, 70, 255, 0.25)' : 'rgba(255,255,255,0.03)',
                  borderColor: isActive ? 'var(--brand-blue)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 400,
                  flexShrink: 0
                }}
              >
                <Icon size={16} color={isActive ? 'var(--neon-lime)' : 'var(--text-muted)'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'chat' && (
        <ChatStudio
          activeSubject={activeSubject}
          queriesUsed={queriesUsed}
          maxQueries={maxQueries}
          isPro={userTier === 'pro'}
          onQueryExecuted={handleQueryExecuted}
          onLimitExceeded={handleLimitExceeded}
        />
      )}

      {activeTab === 'quiz' && (
        <QuizGenerator activeSubject={activeSubject} />
      )}

      {activeTab === 'flashcards' && (
        <FlashcardStudio activeSubject={activeSubject} />
      )}

      {activeTab === 'ingest' && (
        <DocumentIngest
          uploadedDocs={uploadedDocs}
          setUploadedDocs={setUploadedDocs}
          isPro={userTier === 'pro'}
          onLimitExceeded={handleLimitExceeded}
        />
      )}

      {activeTab === 'inspector' && (
        <VectorInspector
          uploadedDocs={uploadedDocs}
          queriesUsed={queriesUsed}
          maxQueries={maxQueries}
          isPro={userTier === 'pro'}
          isOnline={isOnline}
        />
      )}

      {/* Pro Tier Upgrade Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onUpgradeSuccess={() => setUserTier('pro')}
      />
    </div>
  );
}
