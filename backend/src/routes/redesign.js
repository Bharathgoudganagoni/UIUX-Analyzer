import express from 'express';
import { createRedesign, getRedesign } from '../controllers/redesignController.js';

const router = express.Router();

router.post('/', createRedesign);
router.get('/:id', getRedesign);

export default router;
