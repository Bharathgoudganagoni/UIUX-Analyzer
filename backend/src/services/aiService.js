import axios from 'axios';
import fs from 'fs';
import { logger } from '../utils/logger.js';

/**
 * AI Service abstraction layer.
 * Keeps AI provider details behind this interface.
 * Connects to FastAPI AI service via process.env.AI_SERVICE_URL (Vercel service binding or local).
 */
class AIService {
  constructor() {
    this.timeout = 120000; // 2 minutes
  }

  getServiceUrl() {
    return (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
  }

  async analyzeImage(imagePath, userInstruction = '') {
    try {
      const url = this.getServiceUrl();
      let imageBase64 = null;
      if (imagePath && fs.existsSync(imagePath)) {
        try {
          imageBase64 = fs.readFileSync(imagePath).toString('base64');
        } catch (e) {
          logger.warn(`Could not read image for base64 serialization: ${e.message}`);
        }
      }

      const response = await axios.post(
        `${url}/analyze/image`,
        {
          image_path: imagePath || '',
          image_base64: imageBase64,
          user_instruction: userInstruction || '',
        },
        { timeout: this.timeout }
      );

      return this.validateAnalysisResponse(response.data);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI service is unavailable. Please ensure the Python AI service is running.');
      }
      if (error.response?.status === 503) {
        throw new Error('AI model is not configured. Please set up Ollama with a vision model or an external AI provider.');
      }
      throw error;
    }
  }

  async analyzeWebsite(url, screenshotPath, htmlContent, axeResults, userInstruction = '') {
    try {
      const serviceUrl = this.getServiceUrl();
      let screenshotBase64 = null;
      if (screenshotPath && fs.existsSync(screenshotPath)) {
        try {
          screenshotBase64 = fs.readFileSync(screenshotPath).toString('base64');
        } catch (e) {
          logger.warn(`Could not read screenshot for base64: ${e.message}`);
        }
      }

      const response = await axios.post(
        `${serviceUrl}/analyze/website`,
        {
          url,
          screenshot_path: screenshotPath || '',
          screenshot_base64: screenshotBase64,
          html_content: htmlContent || '',
          axe_results: axeResults,
          user_instruction: userInstruction || '',
        },
        { timeout: this.timeout }
      );

      return this.validateAnalysisResponse(response.data);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI service is unavailable. Please ensure the Python AI service is running.');
      }
      throw error;
    }
  }

  async generateCode(analysisData, redesignImagePath, userInstruction = '') {
    try {
      const serviceUrl = this.getServiceUrl();
      const response = await axios.post(
        `${serviceUrl}/generate/code`,
        {
          analysis: analysisData,
          redesign_image_path: redesignImagePath,
          user_instruction: userInstruction,
        },
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI service is unavailable. Please ensure the Python AI service is running.');
      }
      throw error;
    }
  }

  async checkHealth() {
    try {
      const serviceUrl = this.getServiceUrl();
      const response = await axios.get(`${serviceUrl}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }

  validateAnalysisResponse(data) {
    // Ensure the AI response conforms to our expected schema
    const required = ['summary', 'categories'];
    for (const field of required) {
      if (!data[field]) {
        logger.warn(`AI response missing required field: ${field}`);
        data[field] = field === 'summary' ? 'Analysis completed' : {};
      }
    }

    const categories = ['layout', 'typography', 'color', 'spacing', 'hierarchy', 'accessibility'];
    for (const cat of categories) {
      if (!data.categories[cat]) {
        data.categories[cat] = { issues: [] };
      }
      if (!Array.isArray(data.categories[cat].issues)) {
        data.categories[cat].issues = [];
      }
    }

    // Validate each issue
    for (const cat of categories) {
      data.categories[cat].issues = data.categories[cat].issues.map(issue => ({
        title: issue.title || 'Untitled Issue',
        description: issue.description || '',
        whyItMatters: issue.whyItMatters || issue.why_it_matters || '',
        recommendation: issue.recommendation || '',
        severity: ['low', 'medium', 'high'].includes(issue.severity) ? issue.severity : 'medium',
      }));
    }

    if (!Array.isArray(data.recommendations)) {
      data.recommendations = [];
    }

    if (!Array.isArray(data.redesignInstructions)) {
      data.redesignInstructions = data.redesign_instructions || [];
    }

    return data;
  }
}

export const aiService = new AIService();
