import { Router } from 'express';
import { CodingController } from '../controllers/coding.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Fetch a single profile from platform API
router.get('/profile', CodingController.fetchProfile);

// Aggregate multiple user profiles and produce 365-day combined heatmap
router.post('/aggregate', CodingController.aggregateProfiles);

export default router;
