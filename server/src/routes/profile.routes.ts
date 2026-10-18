import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', ProfileController.getProfile);
router.put('/', validate(updateProfileSchema, 'body'), ProfileController.updateProfile);

export default router;
