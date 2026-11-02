import { Router } from 'express';
import { MediaController } from '../controllers/media.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { multerUpload, validateMagicBytes } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  mediaQuerySchema,
  updateMediaSchema,
  uuidParamSchema,
  confirmMediaSchema,
  signatureQuerySchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(mediaQuerySchema, 'query'), MediaController.getMedia);

// Signed upload parameters for direct client -> Cloudinary uploads
router.get('/signature', uploadLimiter, validate(signatureQuerySchema, 'query'), MediaController.getSignature);
router.post('/signature', uploadLimiter, MediaController.getSignature);

// Confirmation endpoint to record directly-uploaded assets in DB
router.post('/confirm', uploadLimiter, validate(confirmMediaSchema, 'body'), MediaController.confirmUpload);

// Legacy/fallback server-side multipart upload route
router.post(
  '/',
  uploadLimiter,
  multerUpload.single('file'),
  validateMagicBytes,
  MediaController.uploadMedia
);

router.patch(
  '/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateMediaSchema, 'body'),
  MediaController.updateCaption
);

router.delete('/:id', validate(uuidParamSchema, 'params'), MediaController.deleteMedia);

export default router;
