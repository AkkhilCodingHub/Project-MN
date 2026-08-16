import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Trash2, Cpu, Database, ArrowRight } from 'lucide-react';
import { ingestDocument } from '../services/api';

export default function DocumentIngest({ uploadedDocs, setUploadedDocs, isPro, onLimitExceeded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrorMsg('Only PDF documents are supported for RAG vector embedding.');
      return;
    }

    if (!isPro && uploadedDocs.length >= 3) {
      onLimitExceeded();
      setErrorMsg('Free tier upload limit reached (max 3 files). Upgrade to Pro for unlimited PDF uploads!');
      return;
    }

    setErrorMsg('');
    setIsUploading(true);
    setUploadProgress('Reading PDF stream & extracting text page-by-page...');

    try {
      setTimeout(() => setUploadProgress('Chunking text (1000 characters, 200 overlap)...'), 600);
      setTimeout(() => setUploadProgress('Generating 768-dim Gemini embeddings...'), 1200);
      setTimeout(() => setUploadProgress('Upserting vectors into Pinecone user namespace...'), 1800);

      const result = await ingestDocument(file);

      const newDoc = {
        id: Date.now().toString(),
        fileName: result.file_name || file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        namespace: result.pinecone_namespace || `user_8a7b9c1d`,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setUploadedDocs(prev => [newDoc, ...prev]);
    } catch (err) {
      setErrorMsg(err.message || 'Ingestion failed');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const removeDoc = (id) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div style={{ margin: '24px var(--pad-page) 0 var(--pad-page)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="cross" />
          <span className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--neon-lime)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            RAG Document Ingestion Pipeline
          </span>
        </div>
        <span className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Pinecone Index: <strong style={{ color: 'var(--text-main)' }}>studytrace-index</strong>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="glass-panel"
          style={{
            padding: '24px',
            border: isDragging ? '2px dashed var(--brand-blue)' : '1px dashed rgba(255, 255, 255, 0.25)',
            background: isDragging 
              ? 'rgba(51, 70, 255, 0.12)' 
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(18, 20, 29, 0.6) 100%)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '180px',
            position: 'relative'
          }}
        >
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />

          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(51, 70, 255, 0.15)',
            border: '1px solid rgba(51, 70, 255, 0.4)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--neon-cyan)',
            marginBottom: '12px'
          }}>
            <UploadCloud size={24} />
          </div>

          <h4 style={{ fontSize: '1.02rem', fontWeight: 600 }}>
            Upload Course Notes or Past Exam PDFs
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '320px' }}>
            Drag & drop PDF files here, or click to browse. Max 3 files on Free Tier.
          </p>

          {isUploading && (
            <div style={{ marginTop: '14px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                <Cpu size={14} color="var(--neon-lime)" className="pulse-dot" />
                <span className="mono-text" style={{ fontSize: '0.75rem', color: 'var(--neon-lime)' }}>
                  {uploadProgress}
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: '75%',
                  background: 'linear-gradient(90deg, var(--brand-blue) 0%, var(--neon-lime) 100%)',
                  borderRadius: '2px',
                  animation: 'pulse-dot 1.5s infinite alternate'
                }} />
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{
              marginTop: '12px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 76, 65, 0.15)',
              border: '1px solid rgba(255, 76, 65, 0.4)',
              color: 'var(--alert-red)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Uploaded Documents List */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} color="var(--neon-cyan)" />
              <span>Indexed Vector Files ({uploadedDocs.length})</span>
            </h4>
            <span className="badge green" style={{ fontSize: '0.65rem' }}>
              768-D EMBEDDINGS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, maxHeight: '220px', overflowY: 'auto' }}>
            {uploadedDocs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px 0', fontSize: '0.85rem' }}>
                No custom files uploaded yet. Using pre-loaded subject notes!
              </div>
            ) : (
              uploadedDocs.map((doc) => (
                <div key={doc.id} style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <FileText size={18} color="var(--neon-lime)" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.fileName}
                      </div>
                      <div className="mono-text" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {doc.fileSize} • NS: {doc.namespace}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeDoc(doc.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="Remove from vector index"
                  >
                    <Trash2 size={14} color="var(--alert-red)" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
