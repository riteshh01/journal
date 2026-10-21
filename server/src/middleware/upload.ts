import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import { sendError } from '../utils/response.js';

// Memory storage keeps file buffers in RAM so we can inspect magic bytes before forwarding to Cloudinary
const storage = multer.memoryStorage();

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

export const multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Global ceiling 100MB
    files: 1,
  },
});

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/x-matroska',
];

export interface ValidatedFile {
  buffer: Buffer;
  mime: string;
  ext: string;
  size: number;
  mediaType: 'image' | 'video';
  originalName: string;
}

export interface UploadRequest extends Request {
  validatedFile?: ValidatedFile;
}

/**
 * Validates file presence and verifies genuine file content using magic bytes.
 */
export const validateMagicBytes = async (
  req: UploadRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.file) {
    sendError(res, 'No file was uploaded', 'FILE_REQUIRED', 400);
    return;
  }

  try {
    const detected = await fileTypeFromBuffer(req.file.buffer);

    if (!detected) {
      sendError(res, 'Unsupported or unrecognized file format', 'INVALID_FILE_TYPE', 400);
      return;
    }

    const isImage = ALLOWED_IMAGE_MIMES.includes(detected.mime);
    const isVideo = ALLOWED_VIDEO_MIMES.includes(detected.mime);

    if (!isImage && !isVideo) {
      sendError(
        res,
        `File type ${detected.mime} is not allowed. Supported types: JPEG, PNG, WEBP, GIF, MP4, WEBM, MOV`,
        'DISALLOWED_MIME_TYPE',
        400
      );
      return;
    }

    // Check individual size constraints
    if (isImage && req.file.size > MAX_IMAGE_SIZE) {
      sendError(res, 'Image exceeds maximum allowable size of 10MB', 'IMAGE_TOO_LARGE', 400);
      return;
    }

    if (isVideo && req.file.size > MAX_VIDEO_SIZE) {
      sendError(res, 'Video exceeds maximum allowable size of 50MB', 'VIDEO_TOO_LARGE', 400);
      return;
    }

    req.validatedFile = {
      buffer: req.file.buffer,
      mime: detected.mime,
      ext: detected.ext,
      size: req.file.size,
      mediaType: isImage ? 'image' : 'video',
      originalName: req.file.originalname,
    };

    next();
  } catch (error) {
    console.error('Magic bytes verification error:', error);
    sendError(res, 'Failed to inspect file contents', 'FILE_INSPECTION_FAILED', 500);
  }
};
