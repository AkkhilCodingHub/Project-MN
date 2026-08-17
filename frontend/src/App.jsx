import React, { useState, useEffect } from 'react';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonToast
} from '@ionic/react';
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
  const [toastMessage, setToastMessage] = useState('');

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
    setToastMessage('Daily query or file limit reached on Free Tier. Upgrade to Pro!');
  };

  const handleUpgradeSuccess = () => {
    setUserTier('pro');
    setToastMessage('🎉 Successfully upgraded to StudyTrace Pro Unlimited Tier!');
  };

  return (
    <IonApp>
      <IonContent fullscreen className="ion-padding-bottom">
        {/* Top Header Navigation */}
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
                  Ionic Framework • Engineering Exam & Study Engine
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

        {/* Ionic Segment Navigation Tabs */}
        <div style={{ margin: '24px var(--pad-page) 0 var(--pad-page)' }}>
          <IonSegment
            value={activeTab}
            onIonChange={(e) => setActiveTab(e.detail.value)}
            scrollable
          >
            <IonSegmentButton value="chat">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                <MessageSquare size={16} color={activeTab === 'chat' ? 'var(--neon-lime)' : 'var(--text-muted)'} />
                <IonLabel>RAG Grounded Chat</IonLabel>
              </div>
            </IonSegmentButton>

            <IonSegmentButton value="quiz">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                <HelpCircle size={16} color={activeTab === 'quiz' ? 'var(--neon-lime)' : 'var(--text-muted)'} />
                <IonLabel>Sessional Quiz Engine</IonLabel>
              </div>
            </IonSegmentButton>

            <IonSegmentButton value="flashcards">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                <Layers size={16} color={activeTab === 'flashcards' ? 'var(--neon-lime)' : 'var(--text-muted)'} />
                <IonLabel>3D Flashcards Deck</IonLabel>
              </div>
            </IonSegmentButton>

            <IonSegmentButton value="ingest">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                <UploadCloud size={16} color={activeTab === 'ingest' ? 'var(--neon-lime)' : 'var(--text-muted)'} />
                <IonLabel>PDF Document Ingest</IonLabel>
              </div>
            </IonSegmentButton>

            <IonSegmentButton value="inspector">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                <Activity size={16} color={activeTab === 'inspector' ? 'var(--neon-lime)' : 'var(--text-muted)'} />
                <IonLabel>Vector Telemetry</IonLabel>
              </div>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Active Studio Panels */}
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

        {/* Ionic Pro Tier Modal */}
        <ProModal
          isOpen={isProModalOpen}
          onClose={() => setIsProModalOpen(false)}
          onUpgradeSuccess={handleUpgradeSuccess}
        />

        {/* Ionic Toast Notifications */}
        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={3500}
          onDidDismiss={() => setToastMessage('')}
          position="top"
          color="dark"
        />
      </IonContent>
    </IonApp>
  );
}
