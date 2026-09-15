import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Cpu, 
  Zap, 
  Clock, 
  Database,
  HardDrive
} from 'lucide-react';
import { uploadTelemetryCsv, getSampleCsvDownloadUrl } from '../../api/apiClient';

export default function UploadCsvModal({ isOpen, onClose, onBatchUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [modelType, setModelType] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (!f.name.endsWith('.csv')) {
        setError('Please select a valid .csv file.');
        return;
      }
      setSelectedFile(f);
      setError(null);
      setBatchResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (!f.name.endsWith('.csv')) {
        setError('Please upload a .csv file.');
        return;
      }
      setSelectedFile(f);
      setError(null);
      setBatchResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose a CSV file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await uploadTelemetryCsv(selectedFile, modelType);
    setLoading(false);

    if (res.success && res.data) {
      setBatchResult(res.data);
      if (onBatchUploaded) onBatchUploaded(res.data);
    } else {
      setError(res.error || 'Failed to process CSV file. Ensure backend is active.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.78)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="pro-card" style={{
        maxWidth: '740px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '28px',
        border: '1px solid var(--border-medium)',
        background: 'var(--bg-surface)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              High-Speed Telemetry Batch Ingestion
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Process up to 5,000+ sensor rows in &lt;1 second with real-time ML scoring &amp; local storage
            </p>
          </div>
        </div>

        {/* Quick Sample Downloads */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Need a test dataset? Download ready-to-use sample telemetry:
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={getSampleCsvDownloadUrl('armor', 5000)}
              download
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              <Download size={13} />
              <span>Sample 5,000-Row Armor CSV</span>
            </a>
            <a
              href={getSampleCsvDownloadUrl('bearing', 2000)}
              download
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              <Download size={13} />
              <span>Bearing CSV</span>
            </a>
          </div>
        </div>

        {/* Model Selection */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 500, marginBottom: '6px' }}>
            Select Target ML Model Engine:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { id: 'auto', label: 'Auto-Detect', desc: 'Inspects CSV columns' },
              { id: 'armor', label: 'AI4I Ground Armor', desc: 'Torque, speed & wear' },
              { id: 'bearing', label: 'IMS Bearing Model', desc: 'Vibration & RMS harmonics' },
              { id: 'turbofan', label: 'N-CMAPSS Turbofan', desc: '32-sensor thermodynamic cycle' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModelType(m.id)}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  background: modelType === m.id ? 'var(--primary-subtle)' : 'var(--bg-surface-elevated)',
                  border: `1px solid ${modelType === m.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
                  color: modelType === m.id ? 'var(--primary)' : 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '36px 20px',
            textAlign: 'center',
            background: selectedFile ? 'rgba(37, 99, 235, 0.04)' : 'var(--bg-surface-elevated)',
            cursor: 'pointer',
            marginBottom: '20px',
            transition: 'border-color 0.15s ease'
          }}
        >
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: selectedFile ? 'var(--primary-subtle)' : 'var(--bg-surface)',
            color: selectedFile ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Upload size={22} />
          </div>

          {selectedFile ? (
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click or drop another file to replace
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>
                Drop your telemetry CSV file here, or click to browse
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports raw defense sensor dumps up to 10,000+ rows
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#f87171',
            fontSize: '0.82rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Results Card if Batch Scored */}
        {batchResult && (
          <div style={{
            padding: '20px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="var(--success)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                  Batch ML Scoring Completed!
                </h4>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(37, 99, 235, 0.12)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                color: '#60a5fa',
                fontWeight: 600
              }}>
                <Zap size={14} />
                <span>Execution Time: {batchResult.execution_time_ms} ms ({batchResult.execution_time_seconds}s)</span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Records</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {batchResult.row_count.toLocaleString()}
                </div>
              </div>

              <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Critical Alerts</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--danger)', marginTop: '2px' }}>
                  {batchResult.critical_count}
                </div>
              </div>

              <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Watchlist</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--warning)', marginTop: '2px' }}>
                  {batchResult.watch_count}
                </div>
              </div>

              <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Average RUL</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>
                  {batchResult.avg_rul} days
                </div>
              </div>
            </div>

            {/* Persistence Confirmation */}
            <div style={{
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-surface)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              lineHeight: 1.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 600, marginBottom: '4px' }}>
                <HardDrive size={14} color="var(--primary)" />
                <span>Dual Persistent Storage Verified (Stored on your Laptop):</span>
              </div>
              <div>&bull; Raw File: <code style={{ color: '#93c5fd' }}>{batchResult.saved_to_laptop.raw_file}</code></div>
              <div>&bull; Scored Predictions: <code style={{ color: '#86efac' }}>{batchResult.saved_to_laptop.scored_file}</code></div>
              <div>&bull; Embedded DB: <code style={{ color: '#fde047' }}>{batchResult.saved_to_laptop.database}</code></div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            {batchResult ? 'Close' : 'Cancel'}
          </button>

          {!batchResult && (
            <button
              type="button"
              onClick={handleUpload}
              className="btn btn-primary btn-sm"
              disabled={loading || !selectedFile}
            >
              {loading ? 'Scoring Telemetry with ML...' : 'Upload & Run Batch ML Scoring'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
