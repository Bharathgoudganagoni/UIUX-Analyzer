import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { analysisApi, projectsApi } from '../services/api';

const AnalysisContext = createContext(null);

const STORAGE_KEY = 'uiux_analyzer_current_session';

export function AnalysisProvider({ children }) {
  const [currentAnalysis, setCurrentAnalysisState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).currentAnalysis : null;
    } catch {
      return null;
    }
  });

  const [currentImage, setCurrentImageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).currentImage : null;
    } catch {
      return null;
    }
  });

  const [currentRedesign, setCurrentRedesignState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).currentRedesign : null;
    } catch {
      return null;
    }
  });

  const [generatedCode, setGeneratedCodeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).generatedCode : null;
    } catch {
      return null;
    }
  });

  const [isDemo, setIsDemoState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).isDemo : false;
    } catch {
      return false;
    }
  });

  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentAnalysis,
          currentImage,
          currentRedesign,
          generatedCode,
          isDemo,
          currentProjectId,
          currentAnalysisId,
        })
      );
    } catch (_) {}
  }, [currentAnalysis, currentImage, currentRedesign, generatedCode, isDemo, currentProjectId, currentAnalysisId]);

  const setCurrentAnalysis = useCallback((val) => {
    setCurrentAnalysisState(val);
  }, []);

  const setCurrentImage = useCallback((val) => {
    setCurrentImageState(val);
  }, []);

  const setCurrentRedesign = useCallback((val) => {
    setCurrentRedesignState(val);
  }, []);

  const setGeneratedCode = useCallback((val) => {
    setGeneratedCodeState(val);
  }, []);

  const setIsDemo = useCallback((val) => {
    setIsDemoState(val);
  }, []);

  const resetSession = useCallback(() => {
    setCurrentAnalysisState(null);
    setCurrentImageState(null);
    setCurrentRedesignState(null);
    setGeneratedCodeState(null);
    setIsDemoState(false);
    setCurrentProjectId(null);
    setCurrentAnalysisId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }, []);

  // Helper to load an analysis or project into context
  const loadAnalysisFromRecord = useCallback((analysisRecord) => {
    if (!analysisRecord) return;
    const aiData = analysisRecord.rawAiResponse || {
      summary: analysisRecord.summary,
      categories: {},
      recommendations: [],
    };

    // If issues are array from DB, rebuild categories
    if (analysisRecord.issues && analysisRecord.issues.length > 0 && (!aiData.categories || Object.keys(aiData.categories).length === 0)) {
      const cats = {};
      analysisRecord.issues.forEach((iss) => {
        const catKey = (iss.category || 'layout').toLowerCase();
        if (!cats[catKey]) cats[catKey] = { issues: [], automatedChecks: [] };
        if (iss.source === 'AXE_CORE') {
          cats[catKey].automatedChecks.push(iss);
        } else {
          cats[catKey].issues.push(iss);
        }
      });
      aiData.categories = cats;
    }

    setCurrentAnalysisState(aiData);
    const img = analysisRecord.originalImagePath
      ? analysisRecord.originalImagePath.startsWith('/uploads')
        ? analysisRecord.originalImagePath
        : `/uploads/${analysisRecord.originalImagePath.split(/[\\/]/).pop()}`
      : null;
    setCurrentImageState(img);
    setIsDemoState(analysisRecord.source === 'DEMO' || analysisRecord.userInstruction?.includes('Demo'));
    setCurrentAnalysisId(analysisRecord.id);
    setCurrentProjectId(analysisRecord.projectId);

    if (analysisRecord.redesigns && analysisRecord.redesigns.length > 0) {
      const latestRedesign = analysisRecord.redesigns[0];
      setCurrentRedesignState(latestRedesign);
      if (latestRedesign.generatedCodes && latestRedesign.generatedCodes.length > 0) {
        setGeneratedCodeState(latestRedesign.generatedCodes[0]);
      }
    }
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        currentAnalysis,
        setCurrentAnalysis,
        currentImage,
        setCurrentImage,
        currentRedesign,
        setCurrentRedesign,
        generatedCode,
        setGeneratedCode,
        isDemo,
        setIsDemo,
        currentProjectId,
        setCurrentProjectId,
        currentAnalysisId,
        setCurrentAnalysisId,
        resetSession,
        loadAnalysisFromRecord,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}
