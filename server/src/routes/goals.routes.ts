import { Router } from 'express';
import { GoalsController } from '../controllers/goals.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createGoalSchema,
  updateGoalSchema,
  goalQuerySchema,
  uuidParamSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(goalQuerySchema, 'query'), GoalsController.getGoals);
router.post('/', validate(createGoalSchema, 'body'), GoalsController.createGoal);
router.patch(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateGoalSchema, 'body'),
  GoalsController.updateGoal
);
router.delete('/:id', validate(uuidParamSchema, 'params'), GoalsController.deleteGoal);

export default router;
