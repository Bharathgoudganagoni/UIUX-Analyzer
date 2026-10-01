import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, ArrowRight, TrendingUp, AlertTriangle,
  CheckCircle, FolderOpen, Zap, Activity, Clock,
  Globe, Image as ImageIcon, Sparkles, RefreshCw, FileCode
} from 'lucide-react';
import { projectsApi } from '../services/api';
import { useAnalysis } from '../contexts/AnalysisContext';

function StatCard({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="stat-card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38,
          background: `${color}18`,
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${color}30`,
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { loadAnalysisFromRecord } = useAnalysis();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await projectsApi.getProjects();
      setProjects(res.projects || []);
    } catch (err) {
      console.error('Failed to load dashboard projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleOpenAnalysis = (project) => {
    const latestAnalysis = project.analyses?.[0];
    if (latestAnalysis) {
      loadAnalysisFromRecord(latestAnalysis);
      navigate('/analysis-result');
    } else {
      navigate(`/projects/${project.id}`);
    }
  };

  // Calculations
  const totalAnalyses = projects.reduce((sum, p) => sum + (p._count?.analyses || p.analyses?.length || 0), 0);
  const totalIssues = projects.reduce((sum, p) => {
    return sum + (p.analyses || []).reduce((aSum, a) => aSum + (a.issues?.length || 0), 0);
  }, 0);
  const totalRedesigns = projects.reduce((sum, p) => {
    return sum + (p.analyses || []).reduce((rSum, a) => rSum + (a.redesigns?.length || 0), 0);
  }, 0);

  return (
    <div style={{ padding: '48px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 40 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                <Sparkles size={11} /> AI UI/UX Studio
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>• Live Overview</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Design Intelligence Dashboard
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
              Track UI audits, UX heuristics, visual accessibility, and AI redesigned interfaces.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh Data"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Syncing...' : 'Refresh'}
            </button>
            <motion.button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/analyze')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              id="new-analysis-btn"
            >
              <Plus size={18} /> New Analysis
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid-stats" style={{ marginBottom: 40 }}>
        <StatCard label="Designs Analyzed" value={totalAnalyses} icon={Activity} color="#7c3aed" delay={0.05} />
        <StatCard label="Issues Detected" value={totalIssues} icon={AlertTriangle} color="#f59e0b" delay={0.1} />
        <StatCard label="Active Projects" value={projects.length} icon={FolderOpen} color="#06b6d4" delay={0.15} />
        <StatCard label="AI Redesigns" value={totalRedesigns} icon={Zap} color="#10b981" delay={0.2} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[
          {
            title: 'Analyze a Screenshot',
            desc: 'Upload a UI image for instant AI heuristic and visual hierarchy critique',
            icon: ImageIcon,
            color: '#7c3aed',
            path: '/analyze',
          },
          {
            title: 'Audit Live Website',
            desc: 'Enter a URL for Playwright headless screenshot + WCAG axe-core check',
            icon: Globe,
            color: '#06b6d4',
            path: '/analyze',
          },
          {
            title: 'Analysis History & Projects',
            desc: 'Browse all past audits, inspect category scores, and generate code',
            icon: Clock,
            color: '#f59e0b',
            path: '/history',
          },
        ].map((action, i) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className="card"
            style={{ padding: 24, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            onClick={() => navigate(action.path)}
            whileHover={{ y: -3, borderColor: action.color + '50' }}
          >
            <div style={{
              width: 42, height: 42,
              background: `${action.color}15`,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${action.color}30`,
              marginBottom: 16,
            }}>
              <action.icon size={20} color={action.color} />
            </div>
            <h4 style={{ fontSize: '1rem', marginBottom: 6, fontWeight: 600 }}>{action.title}</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {action.desc}
            </p>
            <div style={{ marginTop: 16, color: action.color, fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Get started <ArrowRight size={14} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Analyses and Projects */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 2 }}>Recent Analyses & Audits</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Click on any analysis to view full AI report or open in Redesign Studio
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
            View all ({projects.length}) <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 16, width: '35%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '65%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(255,255,255,0.01)',
          }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: 16,
              background: 'rgba(124, 58, 237, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid rgba(124, 58, 237, 0.2)'
            }}>
              <Activity size={26} color="var(--accent-light)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 6 }}>No Analyses Performed Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto 20px' }}>
              Upload your interface screenshot or type in any website URL to generate your first AI UI/UX critique.
            </p>
            <button className="btn btn-primary btn-md" onClick={() => navigate('/analyze')}>
              <Plus size={16} /> Start Your First Analysis
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.slice(0, 6).map((project, i) => {
              const latestAnalysis = project.analyses?.[0];
              const issues = latestAnalysis?.issues || [];
              const highCount = issues.filter(iss => iss.severity === 'HIGH' || iss.severity === 'high').length;
              const isUrl = latestAnalysis?.type === 'URL' || project.name.includes('.') || project.name.startsWith('http');
              const isDemo = project.name.toLowerCase().includes('demo') || latestAnalysis?.userInstruction?.toLowerCase().includes('demo');

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.04 }}
                  className="card"
                  style={{
                    padding: '18px 22px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap'
                  }}
                  onClick={() => handleOpenAnalysis(project)}
                  whileHover={{ borderColor: 'var(--accent-light)', y: -1 }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: isUrl ? 'rgba(6, 182, 212, 0.12)' : isDemo ? 'rgba(16, 185, 129, 0.12)' : 'rgba(124, 58, 237, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${isUrl ? 'rgba(6,182,212,0.25)' : isDemo ? 'rgba(16,185,129,0.25)' : 'rgba(124,58,237,0.25)'}`,
                  }}>
                    {isUrl ? (
                      <Globe size={20} color="var(--cyan)" />
                    ) : isDemo ? (
                      <Sparkles size={20} color="#10b981" />
                    ) : (
                      <ImageIcon size={20} color="var(--accent-light)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.975rem', color: 'var(--text-primary)' }}>
                        {project.name}
                      </span>
                      {isDemo && <span className="badge badge-demo" style={{ fontSize: '0.65rem' }}>Demo</span>}
                      {isUrl && <span className="badge badge-info" style={{ fontSize: '0.65rem', background: 'rgba(6,182,212,0.1)', color: 'var(--cyan)' }}>Website Audit</span>}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {new Date(project.updatedAt || project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {issues.length > 0 && (
                        <span>
                          <strong>{issues.length}</strong> total issues
                        </span>
                      )}
                      {latestAnalysis?.summary && (
                        <span style={{
                          maxWidth: 320,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--text-secondary)'
                        }}>
                          "{latestAnalysis.summary}"
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {highCount > 0 && (
                      <span className="badge badge-high" style={{ fontSize: '0.75rem' }}>
                        {highCount} Critical
                      </span>
                    )}
                    {issues.length > 0 && highCount === 0 && (
                      <span className="badge badge-medium" style={{ fontSize: '0.75rem' }}>
                        {issues.length} issues
                      </span>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAnalysis(project);
                      }}
                      style={{ gap: 4 }}
                    >
                      View Report <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
