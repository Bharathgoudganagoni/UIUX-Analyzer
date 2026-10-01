import { storeService } from '../services/storeService.js';
import { logger } from '../utils/logger.js';

export async function getProjects(req, res, next) {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId || null;
    const projects = await storeService.getProjects(userId);
    res.json({ success: true, projects });
  } catch (error) {
    logger.error('Error fetching projects:', error);
    next(error);
  }
}

export async function getProject(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || req.query.userId || null;
    const project = await storeService.getProject(id, userId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true, project });
  } catch (error) {
    logger.error('Error fetching project:', error);
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    await storeService.deleteProject(id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    logger.error('Error deleting project:', error);
    next(error);
  }
}
