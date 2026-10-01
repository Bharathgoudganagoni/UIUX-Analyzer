import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload, Globe, Image, X, Loader2,
  ArrowRight, FlaskConical, FileImage, LinkIcon,
  Sparkles, Check, Scan, Eye, Cpu, Layers,
  Type, Palette, ShieldCheck, Compass, Zap
} from 'lucide-react';
import { analysisApi, websiteApi } from '../services/api';
import { useAnalysis } from '../contexts/AnalysisContext';

const ANALYSIS_STAGES = [
  { id: 1, label: 'Ingesting UI Layout & Viewport', icon: Scan, desc: 'Parsing DOM & visual bounding boxes' },
  { id: 2, label: 'Evaluating Grid & Whitespace', icon: Layers, desc: 'Measuring margin balance and section breathing room' },
  { id: 3, label: 'Inspecting Typography & Scale', icon: Type, desc: 'Checking font hierarchy, weights, and readability' },
  { id: 4, label: 'Color Contrast & Visual Hierarchy', icon: Palette, desc: 'Auditing CTA prominence and color harmonics' },
  { id: 5, label: 'WCAG 2.1 AA Accessibility Audit', icon: ShieldCheck, desc: 'Evaluating touch targets, focus states, and aria labels' },
  { id: 6, label: 'Synthesizing AI Redesign Blueprint', icon: Sparkles, desc: 'Formulating step-by-step UI/UX improvements' },
];

export default function NewAnalysisPage() {
  const navigate = useNavigate();
  const { setCurrentAnalysis, setCurrentImage, setIsDemo, loadAnalysisFromRecord } = useAnalysis();

  const [mode, setMode] = useState('screenshot'); // 'screenshot' | 'url'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [url, setUrl] = useState('');
  const [instruction, setInstruction] = useState('');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      setError('Only PNG, JPG, and WEBP images under 10MB are accepted.');
      return;
    }
    const f = accepted[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': [], 'image/jpeg': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    noClick: !!preview,
  });

  const simulateProgress = () => {
    let stage = 0;
    const interval = setInterval(() => {
      stage++;
      if (stage < ANALYSIS_STAGES.length) {
        setCurrentStage(stage);
      } else {
        clearInterval(interval);
      }
    }, 1600);
    return () => clearInterval(interval);
  };

  const handleAnalyze = async () => {
    setError(null);

    if (mode === 'screenshot' && !file) {
      setError('Please upload an image to analyze.');
      return;
    }
    if (mode === 'url' && !url.trim()) {
      setError('Please enter a website URL.');
      return;
    }
    if (mode === 'url') {
      try {
        new URL(url);
      } catch {
        setError('Please enter a valid URL (e.g., https://example.com)');
        return;
      }
    }

    setLoading(true);
    setCurrentStage(0);
    const stopProgress = simulateProgress();

    try {
      let result;
      if (mode === 'screenshot') {
        const formData = new FormData();
        formData.append('image', file);
        if (instruction) formData.append('userInstruction', instruction);
        if (projectName) formData.append('projectName', projectName);
        result = await analysisApi.analyze(formData);
      } else {
        result = await websiteApi.analyze({
          url,
          userInstruction: instruction,
          projectName: projectName || new URL(url).hostname,
        });
      }

      stopProgress();
      setCurrentStage(ANALYSIS_STAGES.length - 1);

      setCurrentAnalysis(result.analysis);
      setCurrentImage(result.imageUrl);
      setIsDemo(false);

      setTimeout(() => navigate('/analysis-result'), 400);
    } catch (err) {
      stopProgress();
      setLoading(false);
      setCurrentStage(0);
      setError(err.message || 'Analysis failed. Please try again.');
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    setCurrentStage(0);
    setError(null);
    const stopProgress = simulateProgress();

    try {
      const result = await analysisApi.analyzeDemo();
      stopProgress();
      setCurrentStage(ANALYSIS_STAGES.length - 1);

      setCurrentAnalysis(result.analysis);
      setCurrentImage(null);
      setIsDemo(true);
      setTimeout(() => navigate('/analysis-result'), 400);
    } catch (err) {
      stopProgress();
      setError(err.message || 'Demo mode failed. Please ensure the backend is running.');
      setLoading(false);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
  };

  if (loading) {
    return (
      <FuturisticAnalysisProgress
        stages={ANALYSIS_STAGES}
        currentStage={currentStage}
        targetName={mode === 'url' ? url : file?.name || projectName || 'Uploaded UI'}
        mode={mode}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '48px 32px', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 40 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="badge badge-accent">
            <Sparkles size={11} /> AI UI/UX Engine
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Analyze Your Interface
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Upload a design screenshot or enter a live website URL for comprehensive UX critique, visual hierarchy audit, and redesign recommendations.
        </p>
      </motion.div>

      {/* Mode selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="tabs" style={{ marginBottom: 32, width: 'fit-content' }}>
          <button
            className={`tab-btn ${mode === 'screenshot' ? 'active' : ''}`}
            onClick={() => setMode('screenshot')}
            id="tab-screenshot"
          >
            <FileImage size={15} style={{ marginRight: 6 }} />
            Screenshot Analysis
          </button>
          <button
            className={`tab-btn ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
            id="tab-url"
          >
            <Globe size={15} style={{ marginRight: 6 }} />
            Live Website URL
          </button>
        </div>
      </motion.div>

      {/* Upload area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ marginBottom: 24 }}
      >
        <AnimatePresence mode="wait">
          {mode === 'screenshot' ? (
            <motion.div key="screenshot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!preview ? (
                <div
                  {...getRootProps()}
                  className={`upload-zone ${isDragActive ? 'dragging' : ''}`}
                  style={{
                    padding: '48px 24px',
                    border: '2px dashed var(--border-default)',
                    borderRadius: 'var(--radius-xl)',
                    background: isDragActive ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s',
                  }}
                >
                  <input {...getInputProps()} id="file-upload-input" />
                  <motion.div
                    animate={isDragActive ? { scale: 1.04 } : { scale: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
                  >
                    <div style={{
                      width: 68, height: 68,
                      background: isDragActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      borderRadius: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border-default)',
                      boxShadow: isDragActive ? '0 0 24px rgba(124,58,237,0.3)' : 'none',
                    }}>
                      <Upload size={28} color={isDragActive ? 'var(--accent-light)' : 'var(--text-tertiary)'} />
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>
                        {isDragActive ? 'Drop your UI screenshot here' : 'Drag & drop your UI screenshot'}
                      </p>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                        or{' '}
                        <span
                          style={{ color: 'var(--accent-light)', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => document.getElementById('file-upload-input')?.click()}
                        >
                          browse files
                        </span>
                        {' '}— PNG, JPG, WEBP up to 10MB
                      </p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-tertiary)',
                  }}
                >
                  <img
                    src={preview}
                    alt="Uploaded UI"
                    style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    display: 'flex', gap: 8,
                  }}>
                    <button className="btn btn-secondary btn-sm" onClick={removeFile}>
                      <X size={14} /> Remove
                    </button>
                    <label htmlFor="file-upload-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      <Image size={14} /> Replace
                      <input
                        id="file-upload-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (f) {
                            setFile(f);
                            setPreview(URL.createObjectURL(f));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    padding: '20px 16px 12px',
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#fff', margin: 0, fontWeight: 500 }}>
                      {file?.name} ({(file?.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                padding: 32,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <LinkIcon size={20} color="var(--accent-light)" />
                  <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    Target Website URL
                  </label>
                </div>
                <input
                  type="url"
                  className="input"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  id="url-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  style={{ fontSize: '1rem', padding: '12px 16px' }}
                />
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: 10 }}>
                  A headless Chromium browser will capture full-res screenshots and run automated WCAG axe-core accessibility checks.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Options */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}
      >
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Project Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. SaaS Analytics Dashboard V2"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            id="project-name-input"
          />
        </div>
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Specific Focus or Design Prompt <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="e.g. Focus on improving visual hierarchy, CTA conversion, typography scale, and dark mode contrast..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            id="instruction-input"
            style={{ minHeight: 80 }}
          />
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="alert alert-error"
            style={{ marginBottom: 20 }}
          >
            <X size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}
      >
        <button
          className="btn btn-primary btn-lg"
          onClick={handleAnalyze}
          disabled={loading}
          id="analyze-btn"
          style={{ flex: 1, minWidth: 220, justifyContent: 'center' }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
          {loading ? 'Initializing Engine...' : 'Analyze Design'}
        </button>

        <button
          className="btn btn-secondary btn-lg"
          onClick={handleDemo}
          disabled={loading}
          id="demo-btn"
          style={{ gap: 8 }}
        >
          <FlaskConical size={18} color="var(--cyan)" />
          Try Demo Audit
        </button>
      </motion.div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 14 }}>
        Instant AI Critique covers Layout, Spacing, Visual Hierarchy, Typography, Color Palette, and Accessibility.
      </p>
    </div>
  );
}

// === NEW ULTRA-PREMIUM FUTURISTIC LOADING DESIGN ===
function FuturisticAnalysisProgress({ stages, currentStage, targetName, mode }) {
  const currentStageObj = stages[currentStage] || stages[0];
  const progressPercent = Math.min(100, Math.round(((currentStage + 1) / stages.length) * 100));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background ambient lighting effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 400,
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.08) 50%, transparent 75%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          maxWidth: 620,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          background: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          borderRadius: 'var(--radius-2xl)',
          padding: '36px 32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.15)',
        }}
      >
        {/* Top Status Bar & Engine Telemetry */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 20,
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 12px #22c55e',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--cyan)' }}>
              AI Vision Engine Active
            </span>
          </div>

          <span className="badge" style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--accent-light)', border: '1px solid rgba(124,58,237,0.3)', fontSize: '0.725rem' }}>
            {progressPercent}% Complete
          </span>
        </div>

        {/* Dynamic Holographic Scanner Visual */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, position: 'relative' }}>
          <div style={{
            position: 'relative',
            width: 130,
            height: 130,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            {/* Outer Spinning Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px dashed rgba(6, 182, 212, 0.4)',
              }}
            />

            {/* Middle Reverse Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                inset: 8,
                borderRadius: '50%',
                border: '2px solid rgba(124, 58, 237, 0.35)',
                borderTopColor: 'var(--accent-light)',
                borderBottomColor: 'var(--cyan)',
              }}
            />

            {/* Glowing Center Core */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.8), rgba(6, 182, 212, 0.8))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 35px rgba(124, 58, 237, 0.6), inset 0 0 15px rgba(255,255,255,0.4)',
              }}
            >
              {React.createElement(currentStageObj.icon || Sparkles, {
                size: 34,
                color: '#fff',
                style: { filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' },
              })}
            </motion.div>

            {/* Scanning Laser Sweep line */}
            <motion.div
              animate={{ y: [-45, 45, -45] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                width: '80%',
                height: 2,
                background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)',
                boxShadow: '0 0 12px #22d3ee',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Current Target Name */}
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: 6,
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            Auditing: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{targetName}</span>
          </div>

          <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: 6, fontWeight: 700, textAlign: 'center' }}>
            {currentStageObj.label}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 460, margin: 0 }}>
            {currentStageObj.desc}
          </p>
        </div>

        {/* High-tech Progress Bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            height: 6,
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)',
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.6)',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>
        </div>

        {/* Micro-Stage Checklist Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStage;
            const isCurrent = idx === currentStage;
            const StageIcon = stage.icon;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isCurrent ? 1 : isCompleted ? 0.75 : 0.35,
                  x: 0,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isCurrent ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCurrent ? 'rgba(124, 58, 237, 0.35)' : 'rgba(255,255,255,0.04)'}`,
                  transition: 'all 0.3s',
                }}
              >
                {/* Status Indicator */}
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: isCompleted ? '#22c55e' : isCurrent ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isCurrent ? '0 0 12px rgba(124,58,237,0.5)' : 'none',
                }}>
                  {isCompleted ? (
                    <Check size={12} color="#fff" strokeWidth={3} />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
                    />
                  ) : (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{stage.id}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <StageIcon size={14} color={isCurrent ? 'var(--cyan-light)' : isCompleted ? '#22c55e' : 'var(--text-muted)'} />
                  <span style={{
                    fontSize: '0.85rem',
                    color: isCurrent ? '#fff' : isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 600 : 400,
                  }}>
                    {stage.label}
                  </span>
                </div>

                {isCurrent && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 600, letterSpacing: '0.05em' }}>
                    AUDITING...
                  </span>
                )}
                {isCompleted && (
                  <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>
                    DONE
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0 }}>
            Analyzing UI visual hierarchy, WCAG contrast compliance, and responsive layouts...
          </p>
        </div>
      </motion.div>
    </div>
  );
}
