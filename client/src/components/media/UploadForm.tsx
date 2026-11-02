'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, AlertCircle, Image as ImageIcon, Film } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MediaType, Media } from '../../types';
import { cn } from '../../lib/utils';
import {
  uploadMediaAsset,
  isVideoFile,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from '../../lib/mediaUpload';

interface UploadFormProps {
  mediaType: MediaType;
  onStartUpload?: (file: File, caption: string, takenOn: string) => void;
  onUploadSuccess?: (media: Media) => void;
  onCancel?: () => void;
}

export function UploadForm({
  mediaType: initialMediaType,
  onStartUpload,
  onUploadSuccess,
  onCancel,
}: UploadFormProps) {
  const [selectedType, setSelectedType] = useState<MediaType>(initialMediaType);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [takenOn, setTakenOn] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedType(initialMediaType);
  }, [initialMediaType]);

  const isImage = selectedType === 'image';
  const acceptMime = isImage
    ? 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif'
    : 'video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-matroska,.mp4,.mov,.webm,.m4v,.mkv';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];

      // Auto-detect if user selected a video or image file
      const isVideo = isVideoFile(selected);
      const effectiveType: MediaType = isVideo ? 'video' : 'image';
      setSelectedType(effectiveType);

      const maxBytes = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
      const limitMb = isVideo ? 100 : 10;
      if (selected.size > maxBytes) {
        setError(
          `${effectiveType === 'video' ? 'Video' : 'Photo'} exceeds maximum allowable size of ${limitMb}MB`
        );
        setFile(null);
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload');
      return;
    }

    // Optimistic background upload: dispatch immediately to parent
    if (onStartUpload) {
      onStartUpload(file, caption.trim(), takenOn);
      setFile(null);
      setCaption('');
      setTakenOn('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const media = await uploadMediaAsset(file, {
        caption: caption.trim(),
        takenOn: takenOn || undefined,
      });

      setFile(null);
      setCaption('');
      setTakenOn('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess?.(media);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle: Photo vs Video */}
      <div className="flex items-center justify-center p-1 bg-surface border border-border rounded-lg">
        <button
          type="button"
          onClick={() => {
            setSelectedType('image');
            setError(null);
            if (file && isVideoFile(file)) {
              setFile(null);
            }
          }}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all',
            isImage
              ? 'bg-accent text-accent-contrast shadow-2xs'
              : 'text-text-muted hover:text-text'
          )}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Photo (up to 10MB)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedType('video');
            setError(null);
            if (file && !isVideoFile(file)) {
              setFile(null);
            }
          }}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all',
            !isImage
              ? 'bg-accent text-accent-contrast shadow-2xs'
              : 'text-text-muted hover:text-text'
          )}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Video (up to 100MB)</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-background border border-[#DC2626] rounded-md text-xs text-[#DC2626] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File Drop / Select Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent hover:bg-surface-hover transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptMime}
          onChange={handleFileChange}
          className="hidden"
          id="media-file-input"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 bg-surface border border-border rounded-full text-accent">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-sm font-medium text-text">
            {file ? (
              <span className="text-accent font-semibold">{file.name}</span>
            ) : (
              <span>Click to select {isImage ? 'a photo' : 'a video'}</span>
            )}
          </div>
          <p className="text-xs text-text-muted">
            {isImage
              ? 'JPEG, PNG, WEBP, GIF up to 10MB'
              : 'MP4, WEBM, MOV, MKV up to 100MB'}
          </p>
        </div>
      </div>

      <Input
        label="Caption (Optional)"
        placeholder="Add a short caption or description..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={300}
      />

      <Input
        label="Date Taken (Optional)"
        type="date"
        value={takenOn}
        onChange={(e) => setTakenOn(e.target.value)}
      />

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        {onCancel && (
          <Button variant="outline" size="md" onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={uploading}
          disabled={!file || uploading}
        >
          Upload {isImage ? 'Photo' : 'Video'}
        </Button>
      </div>
    </form>
  );
}
