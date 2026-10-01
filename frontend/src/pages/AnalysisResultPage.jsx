import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ChevronDown, ChevronUp, Wand2,
  LayoutDashboard, Type, Palette, Maximize, Layers,
  Accessibility, Navigation, FileText, ArrowLeft,
  ExternalLink, FlaskConical
} from 'lucide-react';
import { useAnalysis } from '../contexts/AnalysisContext';
import { redesignApi } from '../services/api';

const CATEGORY_META = {
  layout: { label: 'Layout', icon: LayoutDashboard, color: '#7c3aed' },
  typography: { label: 'Typography', icon: Type, color: '#06b6d4' },
  color: { label: 'Color', icon: Palette, color: '#ec4899' },
  spacing: { label: 'Spacing', icon: Maximize, color: '#f59e0b' },
  hierarchy: { label: 'Visual Hierarchy', icon: Layers, color: '#10b981' },
  accessibility: { label: 'Accessibility', icon: Accessibility, color: '#ef4444' },
  navigation: { label: 'Navigation', icon: Navigation, color: '#8b5cf6' },
  content: { label: 'Content', icon: FileText, color: '#64748b' },
};

export default function AnalysisResultPage() {
  const navigate = useNavigate();
  const { currentAnalysis, currentImage, isDemo, setCurrentRedesign } = useAnalysis();
  const [activeCategory, setActiveCategory] = useState(null);
  const [redesignLoading, setRedesignLoading] = useState(false);
  const [redesignError, setRedesignError] = useState(null);

  if (!currentAnalysis) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <AlertTriangle size={28} color="var(--accent-light)" />
        </div>
        <h3>No Analysis Found</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>
          Start by uploading a UI screenshot or entering a website URL to analyze.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
          Start New Analysis
        </button>
      </div>
    );
  }

  const { summary, categories, recommendations, axeSummary } = currentAnalysis;

  // Count all issues
  const allIssues = Object.entries(categories || {}).flatMap(([cat, data]) =>
    (data?.issues || []).map(issue => ({ ...issue, category: cat }))
  );
  const highCount = allIssues.filter(i => i.severity === 'high').length;
  const mediumCount = allIssues.filter(i => i.severity === 'medium').length;
  const lowCount = allIssues.filter(i => i.severity === 'low').length;

  const handleGenerateRedesign = async () => {
    setRedesignLoading(true);
    setRedesignError(null);
    try {
      const result = await redesignApi.createRedesign({
        originalImagePath: currentImage,
        issues: allIssues,
        redesignInstructions: currentAnalysis.redesignInstructions,
      });
      setCurrentRedesign(result);
      navigate('/redesign-studio');
    } catch (err) {
      setRedesignError(err.message);
      setRedesignLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(8, 10, 15, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analyze')}>
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Analysis Result</h2>
          {isDemo && <span className="badge badge-demo"><FlaskConical size={10} /> Demo</span>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {redesignError && (
            <span style={{ fontSize: '0.8rem', color: 'var(--severity-high)', alignSelf: 'center' }}>
              {redesignError}
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/code-generator')}
            id="code-gen-btn"
          >
            <ExternalLink size={14} /> Generate Code
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleGenerateRedesign}
            disabled={redesignLoading}
            id="redesign-btn"
          >
            <Wand2 size={14} />
            {redesignLoading ? 'Generating...' : 'Generate Redesign'}
          </button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Summary + Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, marginBottom: 32, alignItems: 'start' }}>
          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: 24 }}
          >
            <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              AI Summary
            </h3>
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '0.9375rem' }}>
              {summary}
            </p>
            {recommendations?.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Top Recommendations
                </p>
                <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recommendations.map((rec, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent-light)', fontWeight: 700, flexShrink: 0 }}>→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 200 }}
          >
            {[
              { label: 'Total Issues', value: allIssues.length, color: 'var(--text-primary)' },
              { label: 'High Severity', value: highCount, color: 'var(--severity-high)' },
              { label: 'Medium Severity', value: mediumCount, color: 'var(--severity-medium)' },
              { label: 'Low Severity', value: lowCount, color: 'var(--severity-low)' },
            ].map((stat) => (
              <div key={stat.label} className="stat-card" style={{ padding: '14px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Image + Issues layout */}
        <div style={{ display: 'grid', gridTemplateColumns: currentImage ? '1fr 1.5fr' : '1fr', gap: 24 }}>
          {/* Original Image */}
          {currentImage && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
                Original Design
              </h3>
              <div style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-tertiary)',
              }}>
                <img
                  src={`${import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '' ? import.meta.env.VITE_API_URL : (import.meta.env.DEV ? 'http://localhost:3001' : '')}${currentImage}`}
                  alt="Original UI design"
                  style={{ width: '100%', display: 'block', maxHeight: 500, objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </motion.div>
          )}

          {/* Issues Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
              Issues by Category
            </h3>

            {/* axe-core automated results */}
            {axeSummary && (
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <Accessibility size={16} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Automated Accessibility Checks (axe-core)</strong>
                  <br />
                  <span style={{ fontSize: '0.85rem' }}>
                    {axeSummary.violations} violations detected · {axeSummary.passes} checks passed
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(categories || {}).map(([catKey, catData], i) => {
                const meta = CATEGORY_META[catKey];
                if (!meta) return null;
                const issues = catData?.issues || [];
                const autoChecks = catData?.automatedChecks || [];
                const allCatIssues = [...issues, ...autoChecks];
                if (allCatIssues.length === 0) return null;
                const isExpanded = activeCategory === catKey;

                return (
                  <motion.div
                    key={catKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => setActiveCategory(isExpanded ? null : catKey)}
                      style={{
                        width: '100%', textAlign: 'left',
                        background: isExpanded ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isExpanded ? meta.color + '40' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'all 0.2s',
                      }}
                    >
                      <meta.icon size={15} style={{ color: meta.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', flex: 1 }}>
                        {meta.label}
                      </span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {allCatIssues.filter(i => i.severity === 'high').length > 0 && (
                          <span className="badge badge-high">{allCatIssues.filter(i => i.severity === 'high').length}</span>
                        )}
                        {allCatIssues.filter(i => i.severity === 'medium').length > 0 && (
                          <span className="badge badge-medium">{allCatIssues.filter(i => i.severity === 'medium').length}</span>
                        )}
                        {allCatIssues.filter(i => i.severity === 'low').length > 0 && (
                          <span className="badge badge-low">{allCatIssues.filter(i => i.severity === 'low').length}</span>
                        )}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {allCatIssues.map((issue, idx) => (
                              <IssueCard key={idx} issue={issue} catColor={meta.color} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue, catColor }) {
  const [expanded, setExpanded] = useState(false);
  const severityClass = `badge badge-${issue.severity?.toLowerCase() || 'medium'}`;

  return (
    <motion.div
      layout
      className="issue-card"
      style={{ borderLeft: `3px solid ${catColor}40` }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
            <span className={severityClass}>{issue.severity}</span>
            {issue.source === 'AXE_CORE' && (
              <span className="badge" style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--cyan)', border: '1px solid rgba(6,182,212,0.2)' }}>
                axe-core
              </span>
            )}
          </div>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
            {issue.title}
          </p>
        </div>
        {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <IssueSection label="Problem" content={issue.description} color="#94a3b8" />
              {issue.whyItMatters && (
                <IssueSection label="Why It Matters" content={issue.whyItMatters} color="#f59e0b" />
              )}
              {issue.recommendation && (
                <IssueSection label="Recommendation" content={issue.recommendation} color="#22c55e" />
              )}
              {issue.elements && (
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    Affected Elements
                  </p>
                  <code style={{ fontSize: '0.75rem', color: 'var(--cyan)', background: 'rgba(6,182,212,0.07)', padding: '4px 8px', borderRadius: 4, display: 'block', overflow: 'auto', maxHeight: 80 }}>
                    {issue.elements}
                  </code>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function IssueSection({ label, content, color }) {
  return (
    <div>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: color || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
        {content}
      </p>
    </div>
  );
}
