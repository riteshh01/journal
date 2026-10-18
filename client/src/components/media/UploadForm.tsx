'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MediaType, Media } from '../../types';

interface UploadFormProps {
  mediaType: MediaType;
  onUploadSuccess: (media: Media) => void;
  onCancel?: () => void;
}

export function UploadForm({ mediaType, onUploadSuccess, onCancel }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [takenOn, setTakenOn] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = mediaType === 'image';
  const acceptMime = isImage ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm,video/quicktime';
  const maxSizeMb = isImage ? 10 : 200;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > maxSizeMb * 1024 * 1024) {
        setError(`File exceeds maximum size of ${maxSizeMb}MB`);
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

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (caption.trim()) {
      formData.append('caption', caption.trim());
    }
    if (takenOn) {
      formData.append('taken_on', takenOn);
    }

    try {
      const res = await api.upload<{ media: Media }>('/media', formData);
      setFile(null);
      setCaption('');
      setTakenOn('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess(res.media);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
              <span>Click to select {isImage ? 'an image' : 'a video'}</span>
            )}
          </div>
          <p className="text-xs text-text-muted">
            {isImage
              ? 'JPEG, PNG, WEBP, GIF up to 10MB'
              : 'MP4, WEBM, MOV up to 200MB'}
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
          Upload {isImage ? 'Image' : 'Video'}
        </Button>
      </div>
    </form>
  );
}
