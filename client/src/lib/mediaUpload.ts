import { api } from './api';
import { Media, MediaType } from '../types';

export interface UploadProgressCallback {
  (percentage: number): void;
}

export interface UploadMediaOptions {
  caption?: string;
  takenOn?: string;
  journalEntryId?: string;
  onProgress?: UploadProgressCallback;
}

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function isVideoFile(file: File): boolean {
  return (
    file.type.startsWith('video/') ||
    /\.(mp4|mov|webm|m4v|ogv|mkv)$/i.test(file.name)
  );
}

/**
 * Uploads a media asset (photo or video).
 * Uses direct signed upload to Cloudinary to bypass Vercel serverless 4.5MB payload limit
 * and Next.js proxy rewrite limitations, with real-time percentage progress tracking.
 * Automatically falls back to backend proxy upload if direct upload is blocked.
 */
export async function uploadMediaAsset(
  file: File,
  options: UploadMediaOptions = {}
): Promise<Media> {
  const isVideo = isVideoFile(file);
  const mediaType: MediaType = isVideo ? 'video' : 'image';
  const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

  if (file.size > maxSize) {
    const limitMb = isVideo ? 100 : 10;
    throw new Error(
      `${isVideo ? 'Video' : 'Photo'} exceeds maximum allowable size of ${limitMb}MB.`
    );
  }

  // Initial progress
  options.onProgress?.(5);

  try {
    // 1. Fetch secure signature from backend
    const sigRes = await api.post<{
      signature: string;
      timestamp: number;
      apiKey: string;
      cloudName: string;
      folder: string;
    }>('/media/signature', { media_type: mediaType });

    options.onProgress?.(10);

    const resourceType = mediaType === 'video' ? 'video' : 'image';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${sigRes.cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sigRes.apiKey);
    formData.append('timestamp', String(sigRes.timestamp));
    formData.append('signature', sigRes.signature);
    formData.append('folder', sigRes.folder);

    // 2. Direct upload to Cloudinary via XMLHttpRequest for smooth upload progress
    const cloudinaryData = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);

      if (xhr.upload) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            // Map 10% -> 90% during actual file transmission
            const uploadPercent = Math.round((event.loaded / event.total) * 80);
            options.onProgress?.(10 + uploadPercent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const parsed = JSON.parse(xhr.responseText);
            resolve(parsed);
          } catch {
            reject(new Error('Failed to parse Cloudinary response'));
          }
        } else {
          try {
            const errJson = JSON.parse(xhr.responseText);
            reject(
              new Error(
                errJson.error?.message ||
                  `Cloudinary upload failed with status ${xhr.status}`
              )
            );
          } catch {
            reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () =>
        reject(new Error('Network connection error while uploading to Cloudinary'));
      xhr.send(formData);
    });

    options.onProgress?.(92);

    // 3. Persist media record in our PostgreSQL database
    const confirmRes = await api.post<{ media: Media }>('/media/confirm', {
      cloudinary_public_id: cloudinaryData.public_id,
      url: cloudinaryData.secure_url,
      media_type: mediaType,
      mime_type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
      size_bytes: cloudinaryData.bytes || file.size,
      caption: options.caption?.trim() || null,
      taken_on: options.takenOn || null,
      journal_entry_id: options.journalEntryId || null,
    });

    options.onProgress?.(100);
    return confirmRes.media;
  } catch (directErr: any) {
    console.warn(
      'Direct upload to Cloudinary failed, falling back to backend multipart upload:',
      directErr
    );

    // 4. Fallback: upload directly to backend Express server
    const fallbackForm = new FormData();
    fallbackForm.append('file', file);
    if (options.caption?.trim()) {
      fallbackForm.append('caption', options.caption.trim());
    }
    if (options.takenOn) {
      fallbackForm.append('taken_on', options.takenOn);
    }
    if (options.journalEntryId) {
      fallbackForm.append('journal_entry_id', options.journalEntryId);
    }

    const res = await api.upload<{ media: Media }>('/media', fallbackForm);
    options.onProgress?.(100);
    return res.media;
  }
}
