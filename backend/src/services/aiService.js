import axios from 'axios';
import { logger } from '../utils/logger.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * AI Service abstraction layer.
 * Keeps AI provider details behind this interface.
 * To swap providers, update this service without touching controllers.
 */
class AIService {
  constructor() {
    this.baseUrl = AI_SERVICE_URL;
    this.timeout = 120000; // 2 minutes
  }

  async analyzeImage(imagePath, userInstruction = '') {
    try {
      const response = await axios.post(`${this.baseUrl}/analyze/image`, {
        image_path: imagePath,
        user_instruction: userInstruction,
      }, { timeout: this.timeout });

      return this.validateAnalysisResponse(response.data);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('AI service is unavailable. Please ensure the Python AI service is running.');
      }
      if (error.response?.status === 503) {
        throw new Error('AI model is not configured. Please set up Ollama with a vision model.');
      }
      throw error;
    }
  }

  async analyzeWebsite(url, screenshotPath, htmlContent, axeResults, userInstruction = '') {
    try {
      const response = await axios.post(`${this.baseUrl}/analyze/website`, {
        url,
        screenshot_path: screenshotPath,
        html_content: htmlContent,
        axe_results: axeResults,
        user_instruction: userInstruction,
      }, { timeout: this.timeout });

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
      const response = await axios.post(`${this.baseUrl}/generate/code`, {
        analysis: analysisData,
        redesign_image_path: redesignImagePath,
        user_instruction: userInstruction,
      }, { timeout: this.timeout });

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
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
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
