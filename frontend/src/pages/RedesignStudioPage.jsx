import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Wand2, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, Code2
} from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';
import { redesignApi } from '../services/api';

const BACKEND =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.DEV ? 'http://localhost:3001' : '');

export default function RedesignStudioPage() {
  const navigate = useNavigate();
  const { currentAnalysis, currentImage, currentRedesign, setCurrentRedesign } = useAnalysis();
  const [viewMode, setViewMode] = useState('split'); // 'original' | 'redesign' | 'split'
  const [sliderPos, setSliderPos] = useState(50);
  const [userInstruction, setUserInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleRedesignAgain = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await redesignApi.createRedesign({
        originalImagePath: currentImage,
        issues: Object.values(currentAnalysis?.categories || {}).flatMap(c => c?.issues || []),
        redesignInstructions: currentAnalysis?.redesignInstructions || [],
        userInstruction,
      });
      setCurrentRedesign(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(Math.max(pos, 5), 95));
  };

  const redesignAvailable = currentRedesign?.imageUrl && !currentRedesign?.metadata?.unavailable;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(8,10,15,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analysis-result')}>
            <ArrowLeft size={15} /> Back
          </button>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Redesign Studio</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* View controls */}
          <div className="tabs">
            {['original', 'split', 'redesign'].map((mode) => (
              <button
                key={mode}
                className={`tab-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
                id={`view-mode-${mode}`}
              >
                {mode === 'original' ? 'Original' : mode === 'split' ? 'Split View' : 'Redesign'}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/code-generator')}
          >
            <Code2 size={14} /> Generate Code
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Unavailable notice */}
        {(!redesignAvailable && currentRedesign) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert alert-warning"
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Image Generation Not Configured</strong>
              <br />
              <span style={{ fontSize: '0.875rem' }}>
                {currentRedesign.metadata?.message}
                {' '}See{' '}
                <a href="#" onClick={() => navigate('/settings')} style={{ color: 'var(--severity-medium)' }}>
                  Settings
                </a>
                {' '}to configure an image generation provider.
              </span>
            </div>
          </motion.div>
        )}

        {/* Image comparison */}
        {(currentImage || redesignAvailable) && (
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-tertiary)',
              minHeight: 400,
              cursor: viewMode === 'split' ? 'col-resize' : 'default',
            }}
            onMouseMove={handleMouseMove}
            onMouseDown={() => { isDragging.current = true; }}
            onMouseUp={() => { isDragging.current = false; }}
            onMouseLeave={() => { isDragging.current = false; }}
          >
            <AnimatePresence mode="wait">
              {viewMode === 'original' && currentImage && (
                <motion.img
                  key="original"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={`${BACKEND}${currentImage}`}
                  alt="Original design"
                  style={{ width: '100%', maxHeight: 560, objectFit: 'contain', display: 'block' }}
                />
              )}

              {viewMode === 'redesign' && redesignAvailable && (
                <motion.img
                  key="redesign"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={`${BACKEND}${currentRedesign.imageUrl}`}
                  alt="Redesigned UI"
                  style={{ width: '100%', maxHeight: 560, objectFit: 'contain', display: 'block' }}
                />
              )}

              {viewMode === 'split' && (
                <motion.div key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative' }}>
                  {/* Original */}
                  {currentImage && (
                    <img
                      src={`${BACKEND}${currentImage}`}
                      alt="Original"
                      style={{
                        width: '100%', maxHeight: 560,
                        objectFit: 'cover', display: 'block',
                      }}
                    />
                  )}
                  {/* Redesign overlay */}
                  {redesignAvailable && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                    }}>
                      <img
                        src={`${BACKEND}${currentRedesign.imageUrl}`}
                        alt="Redesign"
                        style={{ width: '100%', maxHeight: 560, objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}

                  {/* Slider line */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${sliderPos}%`, width: 2,
                    background: '#fff', zIndex: 5,
                    boxShadow: '0 0 8px rgba(255,255,255,0.5)',
                  }}>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)',
                      width: 40, height: 40, borderRadius: '50%',
                      background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#111',
                    }}>
                      <ChevronLeft size={14} />
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* Labels */}
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span className="badge badge-accent">Before</span>
                  </div>
                  {redesignAvailable && (
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                      <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.25)' }}>
                        After
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Placeholder when no image */}
            {viewMode !== 'original' && !redesignAvailable && !currentRedesign && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 300, gap: 16,
              }}>
                <Wand2 size={40} color="var(--text-muted)" />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Redesign not yet generated. Click "Redesign Again" to try.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Redesign Again panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: 24 }}
        >
          <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>Redesign with Custom Instructions</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Guide the AI with specific design direction for the next iteration.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              'Make it more minimal',
              'Keep existing colors',
              'Mobile-friendly',
              'SaaS dashboard style',
            ].map((preset) => (
              <button
                key={preset}
                className="btn btn-ghost btn-sm"
                onClick={() => setUserInstruction(preset)}
                style={{ fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
              >
                {preset}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'flex-end' }}>
            <textarea
              className="input"
              rows={2}
              placeholder="Custom redesign instructions..."
              value={userInstruction}
              onChange={(e) => setUserInstruction(e.target.value)}
              style={{ flex: 1, minHeight: 60 }}
            />
            <button
              className="btn btn-primary"
              onClick={handleRedesignAgain}
              disabled={loading}
              id="redesign-again-btn"
              style={{ alignSelf: 'stretch', minWidth: 140 }}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {loading ? 'Generating...' : 'Redesign Again'}
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 12 }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {currentRedesign?.promptUsed && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                <strong>Prompt used:</strong> {currentRedesign.promptUsed}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
