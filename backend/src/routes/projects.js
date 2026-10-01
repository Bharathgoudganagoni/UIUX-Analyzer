import express from 'express';
import { getProjects, getProject, deleteProject } from '../controllers/projectsController.js';

const router = express.Router();

router.get('/', getProjects);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);

export default router;
