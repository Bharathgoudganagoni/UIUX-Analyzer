import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Server, Key, Info, CheckCircle, XCircle } from 'lucide-react';
import { healthApi } from '../services/api';

export default function SettingsPage() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const result = await healthApi.check();
      setHealthStatus({ ...result, ok: true });
    } catch (err) {
      setHealthStatus({ ok: false, error: err.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  return (
    <div style={{ padding: '48px 32px', maxWidth: 720, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: 8 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure AI services and application settings.</p>
      </motion.div>

      {/* Service status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Server size={16} color="var(--accent-light)" />
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Service Status</h3>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={checkHealth} disabled={checkingHealth} id="check-health-btn">
            <Settings2 size={14} /> {checkingHealth ? 'Checking...' : 'Check Services'}
          </button>
          {healthStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
              {healthStatus.ok
                ? <><CheckCircle size={14} color="var(--severity-low)" /><span style={{ color: 'var(--severity-low)' }}>Backend connected</span></>
                : <><XCircle size={14} color="var(--severity-high)" /><span style={{ color: 'var(--severity-high)' }}>{healthStatus.error}</span></>
              }
            </div>
          )}
        </div>
      </motion.div>

      {/* Environment variables guide */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Key size={16} color="var(--accent-light)" />
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Environment Configuration</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          All configuration is done via environment variables. Edit <code style={{ color: 'var(--cyan)' }}>.env</code> files in the backend and ai-service directories.
        </p>
        <div style={{ background: '#0d1117', borderRadius: 'var(--radius-md)', padding: 16, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.8 }}>
          {[
            ['AI_SERVICE_URL', 'http://localhost:8000', 'Python AI service URL'],
            ['OLLAMA_BASE_URL', 'http://localhost:11434', 'Ollama server URL'],
            ['OLLAMA_VISION_MODEL', 'llava', 'Vision model name'],
            ['IMAGE_GEN_PROVIDER', 'none | placeholder | stable-diff', 'Image generation adapter'],
            ['DATABASE_URL', 'postgresql://...', 'PostgreSQL connection string'],
          ].map(([key, val, desc]) => (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0 16px', marginBottom: 4 }}>
              <span style={{ color: 'var(--accent-light)' }}>{key}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', alignSelf: 'center' }}>
                <span style={{ color: 'var(--severity-low)' }}>{val}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>// {desc}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AI providers guide */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Info size={16} color="var(--accent-light)" />
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Connecting Ollama</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {[
            '1. Install Ollama from https://ollama.ai',
            '2. Run: ollama pull llava (vision model for image analysis)',
            '3. Run: ollama pull llama3 (text model for code generation)',
            '4. Start Ollama: ollama serve',
            '5. Set OLLAMA_BASE_URL=http://localhost:11434 in ai-service/.env',
            '6. Start the Python AI service: uvicorn main:app --reload',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--accent-light)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
