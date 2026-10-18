import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from './env.js';
import streamifier from 'stream';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  publicId: string;
  url: string;
  thumbnailUrl?: string;
  bytes: number;
  format: string;
  resourceType: 'image' | 'video';
}

/**
 * Uploads a file buffer directly to Cloudinary using upload_stream.
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned empty response'));
        }
        resolve(result);
      }
    );

    const bufferStream = new streamifier.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Deletes an asset from Cloudinary by its public ID and resource type.
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video'
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
  } catch (error) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, error);
    // Don't throw to prevent blocking DB operations if external asset is already removed
  }
};

export { cloudinary };
