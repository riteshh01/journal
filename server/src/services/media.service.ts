import { query } from '../config/db.js';
import { Media, MediaType } from '../types/index.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { ValidatedFile } from '../middleware/upload.js';

export interface MediaListParams {
  type: MediaType;
  page: number;
  limit: number;
}

export class MediaService {
  static async getMedia(
    userId: string,
    params: MediaListParams
  ): Promise<{ media: Media[]; total: number }> {
    const { type, page, limit } = params;
    const offset = (page - 1) * limit;

    const countRes = await query<{ count: string }>(
      'SELECT COUNT(*) FROM media WHERE user_id = $1 AND media_type = $2',
      [userId, type]
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const mediaRes = await query<Media>(
      `
      SELECT id, user_id, media_type, cloudinary_public_id, url, thumbnail_url,
             caption, mime_type, size_bytes, journal_entry_id,
             TO_CHAR(taken_on, 'YYYY-MM-DD') AS taken_on, created_at
      FROM media
      WHERE user_id = $1 AND media_type = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
      `,
      [userId, type, limit, offset]
    );

    return {
      media: mediaRes.rows,
      total,
    };
  }

  static async uploadMedia(
    userId: string,
    file: ValidatedFile,
    metadata: {
      caption?: string;
      taken_on?: string;
      journal_entry_id?: string;
    }
  ): Promise<Media> {
    const folder = file.mediaType === 'image' ? 'journal-app/images' : 'journal-app/videos';

    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadBufferToCloudinary(
        file.buffer,
        folder,
        file.mediaType
      );
    } catch (uploadErr: any) {
      console.error('Cloudinary upload failure:', uploadErr);
      throw new Error(`Media upload failed: ${uploadErr.message || 'Cloudinary error'}`);
    }

    const url = cloudinaryResult.secure_url;
    let thumbnailUrl: string | null = null;

    if (file.mediaType === 'video') {
      // Cloudinary allows replacing extension with .jpg to obtain an automatic video thumbnail
      thumbnailUrl = url.replace(/\.[^/.]+$/, '.jpg');
    } else {
      thumbnailUrl = url;
    }

    const res = await query<Media>(
      `
      INSERT INTO media (
        user_id, media_type, cloudinary_public_id, url, thumbnail_url,
        caption, mime_type, size_bytes, journal_entry_id, taken_on
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, user_id, media_type, cloudinary_public_id, url, thumbnail_url,
                caption, mime_type, size_bytes, journal_entry_id,
                TO_CHAR(taken_on, 'YYYY-MM-DD') AS taken_on, created_at
      `,
      [
        userId,
        file.mediaType,
        cloudinaryResult.public_id,
        url,
        thumbnailUrl,
        metadata.caption || null,
        file.mime,
        file.size,
        metadata.journal_entry_id || null,
        metadata.taken_on || null,
      ]
    );

    return res.rows[0];
  }

  static async updateCaption(
    userId: string,
    mediaId: string,
    caption?: string | null
  ): Promise<Media | null> {
    const res = await query<Media>(
      `
      UPDATE media
      SET caption = $1
      WHERE id = $2 AND user_id = $3
      RETURNING id, user_id, media_type, cloudinary_public_id, url, thumbnail_url,
                caption, mime_type, size_bytes, journal_entry_id,
                TO_CHAR(taken_on, 'YYYY-MM-DD') AS taken_on, created_at
      `,
      [caption || null, mediaId, userId]
    );

    return res.rows[0] || null;
  }

  static async deleteMedia(userId: string, mediaId: string): Promise<boolean> {
    const currentRes = await query<Media>(
      'SELECT id, cloudinary_public_id, media_type FROM media WHERE id = $1 AND user_id = $2',
      [mediaId, userId]
    );

    const media = currentRes.rows[0];
    if (!media) {
      return false;
    }

    // Delete asset from Cloudinary
    await deleteFromCloudinary(media.cloudinary_public_id, media.media_type);

    // Delete database record
    const deleteRes = await query('DELETE FROM media WHERE id = $1 AND user_id = $2', [mediaId, userId]);
    return (deleteRes.rowCount ?? 0) > 0;
  }
}
