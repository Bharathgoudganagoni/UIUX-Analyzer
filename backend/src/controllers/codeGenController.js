import { storeService } from '../services/storeService.js';
import { aiService } from '../services/aiService.js';
import { logger } from '../utils/logger.js';

export async function generateCode(req, res, next) {
  try {
    const { analysisId, redesignId, userInstruction } = req.body;

    let analysis = null;
    let redesign = null;

    try {
      if (analysisId) {
        analysis = await storeService.getAnalysis(analysisId);
      }
      if (redesignId) {
        redesign = await storeService.getRedesign(redesignId);
      }
    } catch (err) {
      logger.warn('Error fetching analysis/redesign for code generation:', err.message);
    }

    const analysisData = analysis?.rawAiResponse || req.body.analysisData || {};
    const redesignImagePath = redesign?.imageUrl || req.body.redesignImagePath || null;

    let codeResult;
    try {
      codeResult = await aiService.generateCode(analysisData, redesignImagePath, userInstruction);
    } catch (aiErr) {
      logger.error('Code generation failed:', aiErr.message);
      return res.status(503).json({
        error: 'Code generation failed',
        message: aiErr.message,
        hint: 'Ensure the Python AI service is running with a capable language model.',
      });
    }

    // Save to Store
    if (redesignId && codeResult) {
      try {
        await storeService.saveGeneratedCode({
          redesignId,
          jsxCode: codeResult.jsx || null,
          cssCode: codeResult.css || null,
          tailwindCode: codeResult.tailwind || null,
        });
      } catch (saveErr) {
        logger.warn('Failed to save generated code to store:', saveErr.message);
      }
    }

    res.json({
      success: true,
      code: codeResult,
    });
  } catch (error) {
    next(error);
  }
}
