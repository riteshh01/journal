import { Router } from 'express';
import { JournalController } from '../controllers/journal.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  journalParamSchema,
  journalQuerySchema,
  upsertJournalSchema,
  createJournalTaskSchema,
  toggleJournalTaskSchema,
  uuidParamSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate);

// Tasks under journal
router.post(
  '/:date/tasks',
  validate(journalParamSchema, 'params'),
  validate(createJournalTaskSchema, 'body'),
  JournalController.addTask
);
router.patch(
  '/tasks/:id/toggle',
  validate(uuidParamSchema, 'params'),
  validate(toggleJournalTaskSchema, 'body'),
  JournalController.toggleTask
);
router.delete(
  '/tasks/:id',
  validate(uuidParamSchema, 'params'),
  JournalController.deleteTask
);

// Entries
router.get('/', validate(journalQuerySchema, 'query'), JournalController.getEntries);
router.get('/:date', validate(journalParamSchema, 'params'), JournalController.getEntryByDate);
router.put(
  '/:date',
  validate(journalParamSchema, 'params'),
  validate(upsertJournalSchema, 'body'),
  JournalController.upsertEntry
);
router.delete('/:date', validate(journalParamSchema, 'params'), JournalController.deleteEntry);

export default router;

