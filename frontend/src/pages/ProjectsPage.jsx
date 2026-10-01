import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, AlertCircle, FolderOpen, Clock,
  Search, Globe, Image as ImageIcon, Sparkles,
  ArrowRight, ExternalLink, RefreshCw, Wand2,
  FileCode, CheckCircle2, ChevronRight, ArrowLeft
} from 'lucide-react';
import { projectsApi } from '../services/api';
import { useAnalysis } from '../contexts/AnalysisContext';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeProjectId } = useParams();
  const { loadAnalysisFromRecord, setCurrentRedesign } = useAnalysis();

  const isHistoryView = location.pathname.startsWith('/history');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'url' | 'screenshot' | 'demo'
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await projectsApi.getProjects();
      const projs = result.projects || [];
      setProjects(projs);

      if (routeProjectId) {
        const found = projs.find(p => p.id === routeProjectId);
        if (found) {
          setSelectedProject(found);
        } else {
          // fetch individual
          try {
            const single = await projectsApi.getProject(routeProjectId);
            setSelectedProject(single.project || null);
          } catch (_) {}
        }
      } else {
        setSelectedProject(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [routeProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project and all its analyses?')) return;
    setDeleting(id);
    try {
      await projectsApi.deleteProject(id);
      setProjects((p) => p.filter((proj) => proj.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        navigate(isHistoryView ? '/history' : '/projects');
      }
    } catch (err) {
      alert(err.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleOpenAnalysis = (analysisRecord, e) => {
    if (e) e.stopPropagation();
    if (!analysisRecord) return;
    loadAnalysisFromRecord(analysisRecord);
    navigate('/analysis-result');
  };

  const handleOpenRedesign = (analysisRecord, e) => {
    if (e) e.stopPropagation();
    if (!analysisRecord) return;
    loadAnalysisFromRecord(analysisRecord);
    if (analysisRecord.redesigns && analysisRecord.redesigns.length > 0) {
      setCurrentRedesign(analysisRecord.redesigns[0]);
    }
    navigate('/redesign-studio');
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const latest = project.analyses?.[0];
    const nameMatch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (latest?.sourceUrl && latest.sourceUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (latest?.summary && latest.summary.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!nameMatch) return false;

    if (filterType === 'url') {
      return latest?.type === 'URL' || project.name.includes('.') || project.name.startsWith('http');
    }
    if (filterType === 'screenshot') {
      return latest?.type === 'SCREENSHOT' && !project.name.toLowerCase().includes('demo');
    }
    if (filterType === 'demo') {
      return project.name.toLowerCase().includes('demo') || latest?.userInstruction?.toLowerCase().includes('demo');
    }
    return true;
  });

  // Single project detail view
  if (selectedProject) {
    const latestAnalysis = selectedProject.analyses?.[0];
    return (
      <div style={{ padding: '48px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setSelectedProject(null);
            navigate(isHistoryView ? '/history' : '/projects');
          }}
          style={{ marginBottom: 24 }}
        >
          <ArrowLeft size={16} /> Back to {isHistoryView ? 'History' : 'Projects'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <FolderOpen size={22} color="var(--accent-light)" />
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>{selectedProject.name}</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Created: {new Date(selectedProject.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} · {selectedProject.analyses?.length || 0} total analysis records
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {latestAnalysis && (
              <button
                className="btn btn-primary"
                onClick={() => handleOpenAnalysis(latestAnalysis)}
              >
                <ExternalLink size={16} /> View Analysis Report
              </button>
            )}
            <button
              className="btn btn-danger btn-sm"
              onClick={(e) => handleDelete(selectedProject.id, e)}
              disabled={deleting === selectedProject.id}
            >
              <Trash2 size={16} /> Delete Project
            </button>
          </div>
        </div>

        {/* Analyses list within this project */}
        <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Analysis Snapshots</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(selectedProject.analyses || []).map((analysis, idx) => {
            const issues = analysis.issues || [];
            const highSeverity = issues.filter((i) => i.severity === 'HIGH' || i.severity === 'high').length;
            const hasRedesign = analysis.redesigns && analysis.redesigns.length > 0;

            return (
              <motion.div
                key={analysis.id || idx}
                className="card"
                style={{ padding: 22 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                        Snapshot #{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(analysis.createdAt).toLocaleString()}
                      </span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {analysis.type || 'SCREENSHOT'}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-primary)', fontSize: '0.925rem', marginBottom: 10, lineHeight: 1.6 }}>
                      {analysis.summary || 'AI audit completed successfully.'}
                    </p>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge-medium">{issues.length} Issues Found</span>
                      {highSeverity > 0 && <span className="badge badge-high">{highSeverity} Critical</span>}
                      {hasRedesign && (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <Wand2 size={12} /> Redesign Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenAnalysis(analysis)}
                    >
                      <ExternalLink size={14} /> Full Critique
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenRedesign(analysis)}
                    >
                      <Wand2 size={14} /> Redesign
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
              {isHistoryView ? <Clock size={11} /> : <FolderOpen size={11} />}
              {isHistoryView ? 'Analysis History' : 'Saved Projects'}
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: 6 }}>
            {isHistoryView ? 'UI/UX Audit History' : 'Project Library'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            {isHistoryView
              ? 'Complete timeline of past interface critiques, heuristic reviews, and accessibility audits.'
              : 'Organize, review, and re-generate redesigned variations of your design projects.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={fetchProjects} title="Refresh">
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')} id="new-project-btn">
            <Plus size={16} /> New Analysis
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <div>
            <strong>Notice</strong>
            <br />
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search by project name, website URL, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        {/* Filter tabs */}
        <div className="tabs">
          {[
            { id: 'all', label: 'All Audits' },
            { id: 'screenshot', label: 'Screenshots' },
            { id: 'url', label: 'Websites' },
            { id: 'demo', label: 'Demos' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${filterType === tab.id ? 'active' : ''}`}
              onClick={() => setFilterType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: 22 }}>
              <div className="skeleton" style={{ height: 18, width: '40%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '80%' }} />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state" style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-default)', padding: 48 }}>
          <div className="empty-icon">
            <FolderOpen size={30} color="var(--accent-light)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 4 }}>No Saved Analyses Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 16px' }}>
            {searchQuery
              ? `No matching records found for "${searchQuery}". Try a different search.`
              : 'Run your first design analysis to see it archived in your history and projects.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
            <Plus size={16} /> Start New Analysis
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredProjects.map((project, i) => {
            const latestAnalysis = project.analyses?.[0];
            const issues = latestAnalysis?.issues || [];
            const highCount = issues.filter((iss) => iss.severity === 'HIGH' || iss.severity === 'high').length;
            const isUrl = latestAnalysis?.type === 'URL' || project.name.includes('.') || project.name.startsWith('http');
            const isDemo = project.name.toLowerCase().includes('demo') || latestAnalysis?.userInstruction?.toLowerCase().includes('demo');

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card"
                style={{ padding: '20px 24px', cursor: 'pointer' }}
                onClick={() => {
                  if (latestAnalysis) {
                    handleOpenAnalysis(latestAnalysis);
                  } else {
                    setSelectedProject(project);
                  }
                }}
                whileHover={{ borderColor: 'var(--accent-light)', y: -2 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1, minWidth: 260 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: isUrl ? 'rgba(6, 182, 212, 0.12)' : isDemo ? 'rgba(16, 185, 129, 0.12)' : 'rgba(124, 58, 237, 0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${isUrl ? 'rgba(6,182,212,0.25)' : isDemo ? 'rgba(16,185,129,0.25)' : 'rgba(124,58,237,0.25)'}`,
                    }}>
                      {isUrl ? <Globe size={18} color="var(--cyan)" /> : isDemo ? <Sparkles size={18} color="#10b981" /> : <ImageIcon size={18} color="var(--accent-light)" />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '1rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {project.name}
                        </h4>
                        {isDemo && <span className="badge badge-demo" style={{ fontSize: '0.65rem' }}>Demo</span>}
                        {isUrl && <span className="badge badge-info" style={{ fontSize: '0.65rem', background: 'rgba(6,182,212,0.1)', color: 'var(--cyan)' }}>Website</span>}
                      </div>

                      {latestAnalysis?.summary && (
                        <p style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          marginBottom: 8,
                          lineHeight: 1.5,
                          maxWidth: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {latestAnalysis.summary}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {new Date(project.updatedAt || project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {project._count?.analyses || project.analyses?.length || 1} {project.analyses?.length === 1 ? 'audit' : 'audits'}
                        </span>
                        {issues.length > 0 && (
                          <span className="badge badge-medium" style={{ fontSize: '0.7rem' }}>
                            {issues.length} issues
                          </span>
                        )}
                        {highCount > 0 && (
                          <span className="badge badge-high" style={{ fontSize: '0.7rem' }}>
                            {highCount} critical
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {latestAnalysis && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => handleOpenAnalysis(latestAnalysis, e)}
                        style={{ gap: 4 }}
                        title="View Full Report"
                      >
                        View Report <ExternalLink size={13} />
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => handleDelete(project.id, e)}
                      disabled={deleting === project.id}
                      id={`delete-project-${project.id}`}
                      style={{ color: 'var(--severity-high)', opacity: deleting === project.id ? 0.5 : 0.8 }}
                      title="Delete Project"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
