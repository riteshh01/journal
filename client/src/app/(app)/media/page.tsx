'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Image as ImageIcon, Film, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../../lib/api';
import { Media, MediaType } from '../../../types';
import { MediaGrid, PendingUploadItem } from '../../../components/media/MediaGrid';
import { UploadForm } from '../../../components/media/UploadForm';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Spinner } from '../../../components/ui/Spinner';

export default function MediaPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') === 'video' ? 'video' : 'image') as MediaType;

  const [activeTab, setActiveTab] = useState<MediaType>(initialTab);
  const [images, setImages] = useState<Media[]>([]);
  const [videos, setVideos] = useState<Media[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [imgRes, vidRes] = await Promise.all([
        api.get<{ media: Media[] }>('/media', { type: 'image', limit: 100 }),
        api.get<{ media: Media[] }>('/media', { type: 'video', limit: 100 }),
      ]);
      setImages(imgRes.media || []);
      setVideos(vidRes.media || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load media assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleStartUpload = async (file: File, caption: string, takenOn: string) => {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const previewUrl = URL.createObjectURL(file);
    const targetMediaType = activeTab;

    const newPending: PendingUploadItem = {
      id: uploadId,
      file,
      previewUrl,
      caption,
      mediaType: targetMediaType,
      status: 'uploading',
    };

    // Close modal immediately so user sees the gallery
    setIsUploadModalOpen(false);

    // Prepend to pending uploads list
    setPendingUploads((prev) => [newPending, ...prev]);

    // Perform the background upload
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
      if (res.media.media_type === 'image') {
        setImages((prev) => [res.media, ...prev]);
      } else {
        setVideos((prev) => [res.media, ...prev]);
      }
      setPendingUploads((prev) => prev.filter((p) => p.id !== uploadId));
      URL.revokeObjectURL(previewUrl);
    } catch (err: any) {
      setPendingUploads((prev) =>
        prev.map((p) =>
          p.id === uploadId
            ? {
                ...p,
                status: 'error',
                errorMessage: err.message || 'Upload failed',
                onDismiss: () => {
                  setPendingUploads((current) => current.filter((item) => item.id !== uploadId));
                  URL.revokeObjectURL(previewUrl);
                },
                onRetry: () => {
                  setPendingUploads((current) => current.filter((item) => item.id !== uploadId));
                  handleStartUpload(file, caption, takenOn);
                },
              }
            : p
        )
      );
    }
  };

  const handleUploadSuccess = (newMedia: Media) => {
    if (newMedia.media_type === 'image') {
      setImages((prev) => [newMedia, ...prev]);
    } else {
      setVideos((prev) => [newMedia, ...prev]);
    }
    setIsUploadModalOpen(false);
  };

  const handleItemDeleted = (id: string) => {
    if (activeTab === 'image') {
      setImages((prev) => prev.filter((item) => item.id !== id));
    } else {
      setVideos((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleItemUpdated = (updatedMedia: Media) => {
    if (updatedMedia.media_type === 'image') {
      setImages((prev) => prev.map((item) => (item.id === updatedMedia.id ? updatedMedia : item)));
    } else {
      setVideos((prev) => prev.map((item) => (item.id === updatedMedia.id ? updatedMedia : item)));
    }
  };

  const isImageTab = activeTab === 'image';
  const currentList = isImageTab ? images : videos;

  return (
    <div className="space-y-6">
      {/* Header with Title and Unified Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            {isImageTab ? (
              <ImageIcon className="w-6 h-6 text-accent" />
            ) : (
              <Film className="w-6 h-6 text-accent" />
            )}
            Media Gallery
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Secure visual vault for personal photos and video recordings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={fetchMedia}
            disabled={loading}
            aria-label="Refresh media assets"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Upload {isImageTab ? 'Image' : 'Video'}
          </Button>
        </div>
      </div>

      {/* Switcher Toggle: Photos / Images vs Video Recordings */}
      <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-1.5">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              isImageTab
                ? 'bg-background text-accent border border-border'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photos / Images</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface border border-border text-text-muted">
              {images.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              !isImageTab
                ? 'bg-background text-accent border border-border'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Video Recordings</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface border border-border text-text-muted">
              {videos.length}
            </span>
          </button>
        </div>

        <span className="hidden sm:inline text-xs text-text-muted pr-3">
          {isImageTab ? 'JPEG, PNG, WEBP, GIF (≤10MB)' : 'MP4, WEBM, MOV (≤200MB)'}
        </span>
      </div>

      {/* Loading state */}
      {loading && currentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">Loading {isImageTab ? 'photos' : 'videos'}...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-surface border border-[#DC2626] rounded-lg text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-[#DC2626] mx-auto" />
          <p className="text-sm font-semibold text-text">Error loading media</p>
          <p className="text-xs text-text-muted">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchMedia} className="mt-2">
            Retry
          </Button>
        </div>
      ) : (
        <MediaGrid
          key={activeTab}
          mediaList={currentList}
          pendingUploads={pendingUploads.filter((p) => p.mediaType === activeTab)}
          mediaType={activeTab}
          onItemDeleted={handleItemDeleted}
          onItemUpdated={handleItemUpdated}
        />
      )}

      {/* Upload Modal (automatically adapts to current toggle) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={isImageTab ? 'Upload Image' : 'Upload Video'}
        maxWidth="md"
      >
        <UploadForm
          mediaType={activeTab}
          onStartUpload={handleStartUpload}
          onUploadSuccess={handleUploadSuccess}
          onCancel={() => setIsUploadModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
