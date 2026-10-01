import { storeService } from '../services/storeService.js';
import { imageGenerationService } from '../services/imageGenerationService.js';
import { logger } from '../utils/logger.js';

export async function createRedesign(req, res, next) {
  try {
    const { analysisId, userInstruction, issues, redesignInstructions, originalImagePath } = req.body;

    // Try to load from store
    let analysis = null;
    let redesignRecord = null;

    try {
      if (analysisId) {
        analysis = await storeService.getAnalysis(analysisId);
        redesignRecord = await storeService.createRedesign({
          analysisId,
          userInstruction: userInstruction || null,
          status: 'PROCESSING',
        });
      }
    } catch (dbErr) {
      logger.warn('Error creating redesign record:', dbErr.message);
    }

    // Gather issues from store or request body
    const issuesData = analysis?.issues || issues || [];
    const instructionsData = analysis?.rawAiResponse?.redesignInstructions || redesignInstructions || [];
    const imagePath = analysis?.originalImagePath || originalImagePath;

    // Call image generation service
    let result;
    try {
      result = await imageGenerationService.generateRedesign({
        originalImagePath: imagePath,
        issues: issuesData,
        redesignInstructions: instructionsData,
        userInstruction: userInstruction || '',
        designConstraints: req.body.designConstraints || {},
      });
    } catch (genErr) {
      logger.error('Image generation failed:', genErr.message);

      if (redesignRecord) {
        await storeService.updateRedesign(redesignRecord.id, { status: 'FAILED' });
      }

      return res.status(503).json({
        error: 'Redesign generation failed',
        message: genErr.message,
      });
    }

    // Save result to Store
    if (redesignRecord) {
      await storeService.updateRedesign(redesignRecord.id, {
        imageUrl: result.imageUrl,
        promptUsed: result.promptUsed,
        status: result.metadata?.unavailable ? 'UNAVAILABLE' : 'COMPLETED',
        metadata: result.metadata,
      });
    }

    res.json({
      success: true,
      redesignId: redesignRecord?.id,
      imageUrl: result.imageUrl,
      promptUsed: result.promptUsed,
      metadata: result.metadata,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRedesign(req, res, next) {
  try {
    const { id } = req.params;
    const redesign = await storeService.getRedesign(id);

    if (!redesign) {
      return res.status(404).json({ error: 'Redesign not found' });
    }

    res.json({ success: true, redesign });
  } catch (error) {
    next(error);
  }
}
