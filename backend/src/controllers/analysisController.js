import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { aiService } from '../services/aiService.js';
import { storeService } from '../services/storeService.js';
import { logger } from '../utils/logger.js';
import { DEMO_ANALYSIS } from '../utils/demoData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createAnalysis(req, res, next) {
  try {
    const { projectName, userInstruction, isDemo } = req.body;
    const userId = req.headers['x-user-id'] || req.body.userId || 'default_user';

    // Demo mode
    if (isDemo === 'true' || isDemo === true) {
      const project = await storeService.createProject({
        name: projectName || 'Demo Analysis - Modern Web Dashboard',
        userId,
      });

      const analysis = await storeService.createAnalysis({
        projectId: project.id,
        userId,
        type: 'SCREENSHOT',
        originalImagePath: null,
        status: 'COMPLETED',
        userInstruction: userInstruction || 'Demo UI analysis evaluation',
        summary: DEMO_ANALYSIS.summary,
        rawAiResponse: DEMO_ANALYSIS,
      });

      // Save demo issues to store
      const categoryMap = {
        layout: 'LAYOUT',
        typography: 'TYPOGRAPHY',
        color: 'COLOR',
        spacing: 'SPACING',
        hierarchy: 'HIERARCHY',
        accessibility: 'ACCESSIBILITY',
        navigation: 'NAVIGATION',
        content: 'CONTENT',
      };

      const issueData = [];
      for (const [cat, data] of Object.entries(DEMO_ANALYSIS.categories || {})) {
        for (const issue of data.issues || []) {
          issueData.push({
            category: categoryMap[cat] || 'LAYOUT',
            title: issue.title,
            description: issue.description,
            whyItMatters: issue.whyItMatters,
            recommendation: issue.recommendation,
            severity: issue.severity,
            source: 'DEMO',
          });
        }
      }
      await storeService.saveIssues(analysis.id, issueData);

      return res.status(200).json({
        success: true,
        isDemo: true,
        analysisId: analysis.id,
        projectId: project.id,
        analysis: DEMO_ANALYSIS,
        message: 'Demo analysis loaded and saved to history',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No image provided',
        message: 'Please upload a PNG, JPG, or WEBP image',
      });
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    const project = await storeService.createProject({
      name: projectName || `UI Analysis ${new Date().toLocaleDateString()}`,
      userId,
    });

    const analysis = await storeService.createAnalysis({
      projectId: project.id,
      userId,
      type: 'SCREENSHOT',
      originalImagePath: imagePath,
      status: 'PROCESSING',
      userInstruction: userInstruction || null,
    });

    // Call AI service
    let aiResult;
    try {
      aiResult = await aiService.analyzeImage(imagePath, userInstruction);
    } catch (aiErr) {
      logger.error('AI analysis failed:', aiErr.message);

      if (analysis) {
        await storeService.updateAnalysis(analysis.id, { status: 'FAILED' });
      }

      return res.status(503).json({
        error: 'AI analysis failed',
        message: aiErr.message,
        hint: 'Make sure the Python AI service is running and a vision model is configured in Ollama.',
      });
    }

    // Save issues
    if (analysis && aiResult) {
      const categoryMap = {
        layout: 'LAYOUT',
        typography: 'TYPOGRAPHY',
        color: 'COLOR',
        spacing: 'SPACING',
        hierarchy: 'HIERARCHY',
        accessibility: 'ACCESSIBILITY',
        navigation: 'NAVIGATION',
        content: 'CONTENT',
      };

      const issueCreateData = [];
      for (const [cat, data] of Object.entries(aiResult.categories || {})) {
        for (const issue of data.issues || []) {
          issueCreateData.push({
            category: categoryMap[cat] || 'LAYOUT',
            title: issue.title,
            description: issue.description,
            whyItMatters: issue.whyItMatters,
            recommendation: issue.recommendation,
            severity: issue.severity,
            source: 'AI',
          });
        }
      }

      await storeService.saveIssues(analysis.id, issueCreateData);
      await storeService.updateAnalysis(analysis.id, {
        status: 'COMPLETED',
        summary: aiResult.summary,
        rawAiResponse: aiResult,
      });
    }

    res.status(200).json({
      success: true,
      isDemo: false,
      analysisId: analysis?.id,
      projectId: project?.id,
      imageUrl,
      analysis: aiResult,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnalysis(req, res, next) {
  try {
    const { id } = req.params;
    const analysis = await storeService.getAnalysis(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
}
