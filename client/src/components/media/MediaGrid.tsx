'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trash2,
  Edit2,
  Play,
  Calendar,
  ExternalLink,
  Upload,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Media, MediaType } from '../../types';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { VideoPlayer, VideoPlayMode } from './VideoPlayer';
import { useToast } from '../ui/Toast';

export interface PendingUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  mediaType: MediaType;
  status: 'uploading' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface MediaGridProps {
  mediaList: Media[];
  pendingUploads?: PendingUploadItem[];
  mediaType: MediaType;
  onItemDeleted: (id: string) => void;
  onItemUpdated: (media: Media) => void;
}

export function MediaGrid({
  mediaList,
  pendingUploads,
  mediaType,
  onItemDeleted,
  onItemUpdated,
}: MediaGridProps) {
  const toast = useToast();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [videoPlayMode, setVideoPlayMode] = useState<VideoPlayMode>('autonext');

  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [deletingMedia, setDeletingMedia] = useState<Media | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isVideo = mediaType === 'video';

  const currentIndex = selectedMedia
    ? mediaList.findIndex((m) => m.id === selectedMedia.id)
    : -1;
  const hasMultiple = mediaList.length > 1;

  // Navigate to previous item
  const handlePrevMedia = useCallback(() => {
    if (mediaList.length <= 1 || currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
    setSelectedMedia(mediaList[prevIndex]);
    setAutoPlayNext(true);
  }, [currentIndex, mediaList]);

  // Navigate to next item
  const handleNextMedia = useCallback(
    (shouldAutoPlay = true) => {
      if (mediaList.length <= 1 || currentIndex === -1) return;
      const nextIndex = (currentIndex + 1) % mediaList.length;
      setSelectedMedia(mediaList[nextIndex]);
      setAutoPlayNext(shouldAutoPlay);
    },
    [currentIndex, mediaList]
  );

  // Keyboard navigation when preview modal is open
  useEffect(() => {
    if (!selectedMedia) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNextMedia(true);
      } else if (e.key === 'ArrowLeft') {
        handlePrevMedia();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, handleNextMedia, handlePrevMedia]);

  // Touch swipe gestures for Image Preview
  const imgTouchStartX = useRef<number | null>(null);
  const imgTouchStartY = useRef<number | null>(null);

  const handleImgTouchStart = (e: React.TouchEvent) => {
    imgTouchStartX.current = e.touches[0].clientX;
    imgTouchStartY.current = e.touches[0].clientY;
  };

  const handleImgTouchEnd = (e: React.TouchEvent) => {
    if (imgTouchStartX.current === null || imgTouchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - imgTouchStartX.current;
    const deltaY = e.changedTouches[0].clientY - imgTouchStartY.current;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        handleNextMedia(true);
      } else {
        handlePrevMedia();
      }
    }
    imgTouchStartX.current = null;
    imgTouchStartY.current = null;
  };

  const handleStartEdit = (m: Media) => {
    setEditingMedia(m);
    setNewCaption(m.caption || '');
  };

  const handleSaveCaption = async () => {
    if (!editingMedia) return;
    setActionLoading(true);
    try {
      const res = await api.patch<{ media: Media }>(`/media/${editingMedia.id}`, {
        caption: newCaption.trim() || null,
      });
      onItemUpdated(res.media);
      setEditingMedia(null);
      toast.success('Caption updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update caption');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMedia) return;
    setActionLoading(true);
    try {
      await api.delete(`/media/${deletingMedia.id}`);
      onItemDeleted(deletingMedia.id);
      setDeletingMedia(null);
      if (selectedMedia?.id === deletingMedia.id) {
        setSelectedMedia(null);
      }
      toast.success('Media deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete media');
    } finally {
      setActionLoading(false);
    }
  };

  const hasItems = mediaList.length > 0 || (pendingUploads && pendingUploads.length > 0);

  if (!hasItems) {
    return (
      <div className="text-center py-12 sm:py-16 bg-surface border border-border rounded-xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-text">No {isVideo ? 'videos' : 'images'} uploaded yet</p>
        <p className="text-xs text-text-muted mt-1">
          Use the upload button above to add your first {isVideo ? 'video' : 'photo'}.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Media Grid: 2 columns on mobile, 3-4 columns on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Optimistic Pending Upload Cards with Live Spinner */}
        {pendingUploads?.map((pending) => (
          <div
            key={pending.id}
            className="group relative bg-surface border-2 border-accent/40 rounded-lg sm:rounded-xl overflow-hidden flex flex-col justify-between shadow-xs"
          >
            {/* Thumbnail Preview with Spinner Overlay */}
            <div className="relative aspect-[4/3] sm:aspect-video bg-background overflow-hidden flex items-center justify-center">
              {pending.previewUrl ? (
                pending.mediaType === 'video' ? (
                  <video
                    src={pending.previewUrl}
                    className="w-full h-full object-cover opacity-60"
                    muted
                  />
                ) : (
                  <img
                    src={pending.previewUrl}
                    alt={pending.caption || 'Uploading preview'}
                    className="w-full h-full object-cover opacity-60"
                  />
                )
              ) : (
                <div className="w-full h-full bg-surface-hover flex items-center justify-center" />
              )}

              {/* Glowing Loader Overlay */}
              <div className="absolute inset-0 bg-black/65 backdrop-blur-2xs flex flex-col items-center justify-center p-2 sm:p-3 text-center gap-1.5 sm:gap-2">
                {pending.status === 'uploading' ? (
                  <>
                    <div className="relative flex items-center justify-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                      <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent absolute" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-white tracking-tight drop-shadow-xs">
                      Uploading {pending.mediaType === 'video' ? 'Video' : 'Image'}...
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-white/70 truncate max-w-[110px] sm:max-w-[140px]">
                      {pending.file.name}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-[#DC2626]" />
                    <span className="text-[10px] sm:text-xs font-bold text-white">Upload Failed</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {pending.onRetry && (
                        <button
                          type="button"
                          onClick={pending.onRetry}
                          className="px-2 py-0.5 rounded text-[10px] bg-accent text-white font-semibold"
                        >
                          Retry
                        </button>
                      )}
                      {pending.onDismiss && (
                        <button
                          type="button"
                          onClick={pending.onDismiss}
                          className="px-2 py-0.5 rounded text-[10px] bg-white/20 text-white font-semibold"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="p-2 sm:p-3">
              <p className="text-[11px] sm:text-xs font-medium text-text line-clamp-1 sm:line-clamp-2 min-h-0 sm:min-h-[2rem]">
                {pending.caption || pending.file.name}
              </p>
              <div className="flex items-center justify-between mt-1 pt-1.5 sm:mt-2 sm:pt-2 border-t border-border text-[10px] sm:text-[11px] text-text-muted">
                <span className="text-accent font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                  <span>Processing...</span>
                </span>
                <span>{(pending.file.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
          </div>
        ))}

        {/* Existing Uploaded Media Cards */}
        {mediaList.map((item) => (
          <div
            key={item.id}
            className="group bg-surface border border-border rounded-lg sm:rounded-xl overflow-hidden flex flex-col justify-between hover:border-accent/40 hover:shadow-md transition-all duration-200"
          >
            {/* Media Thumbnail Container */}
            <div
              onClick={() => {
                setSelectedMedia(item);
                setAutoPlayNext(false);
              }}
              className="relative aspect-[4/3] sm:aspect-video bg-background cursor-pointer overflow-hidden flex items-center justify-center"
            >
              {isVideo ? (
                <>
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.caption || 'Video thumbnail'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-black/40 flex items-center justify-center" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface/90 text-accent flex items-center justify-center shadow-xs">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  alt={item.caption || 'Uploaded image'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              )}
            </div>

            {/* Media Details & Actions */}
            <div className="p-2 sm:p-3">
              <p className="text-[11px] sm:text-xs font-medium text-text line-clamp-1 sm:line-clamp-2 min-h-0 sm:min-h-[2rem]">
                {item.caption || <span className="text-text-muted italic">No caption</span>}
              </p>

              <div className="flex items-center justify-between mt-1 pt-1.5 sm:mt-2 sm:pt-2 border-t border-border text-[10px] sm:text-[11px] text-text-muted">
                <span className="truncate max-w-[70px] sm:max-w-none">
                  {item.taken_on ? formatDate(item.taken_on) : formatDate(item.created_at)}
                </span>

                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1 sm:p-1.5 text-text-muted hover:text-accent rounded transition-colors touch-manipulation"
                    aria-label="Edit caption"
                  >
                    <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingMedia(item)}
                    className="p-1 sm:p-1.5 text-text-muted hover:text-[#DC2626] rounded transition-colors touch-manipulation"
                    aria-label="Delete asset"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Media Preview Modal (Mobile friendly with Swipe & Controls) */}
      <Modal
        isOpen={Boolean(selectedMedia)}
        onClose={() => {
          setSelectedMedia(null);
          setAutoPlayNext(false);
        }}
        title={
          isVideo
            ? `Video Player (${currentIndex + 1} of ${mediaList.length})`
            : (selectedMedia?.caption || `Image Preview (${currentIndex + 1} of ${mediaList.length})`)
        }
        maxWidth="2xl"
      >
        {selectedMedia && (
          <div className="space-y-3 sm:space-y-4">
            {isVideo ? (
              <VideoPlayer
                src={selectedMedia.url}
                poster={selectedMedia.thumbnail_url}
                caption={selectedMedia.caption}
                playMode={videoPlayMode}
                onPlayModeChange={setVideoPlayMode}
                onNext={() => handleNextMedia(true)}
                onPrev={handlePrevMedia}
                hasNext={hasMultiple}
                hasPrev={hasMultiple}
                autoPlay={autoPlayNext}
              />
            ) : (
              <div
                className="relative max-h-[60vh] sm:max-h-[72vh] w-full flex items-center justify-center bg-black/30 rounded-lg sm:rounded-xl overflow-hidden border border-border select-none group"
                onTouchStart={handleImgTouchStart}
                onTouchEnd={handleImgTouchEnd}
              >
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.caption || 'Preview image'}
                  className="max-h-[60vh] sm:max-h-[72vh] w-auto max-w-full object-contain mx-auto"
                />

                {/* Left & Right floating chevron buttons for photo navigation */}
                {hasMultiple && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevMedia();
                      }}
                      aria-label="Previous photo"
                      title="Previous photo (Swipe Right)"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all opacity-85 sm:opacity-0 sm:group-hover:opacity-100 z-10 shadow-md backdrop-blur-2xs touch-manipulation"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextMedia(false);
                      }}
                      aria-label="Next photo"
                      title="Next photo (Swipe Left)"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all opacity-85 sm:opacity-0 sm:group-hover:opacity-100 z-10 shadow-md backdrop-blur-2xs touch-manipulation"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Navigation indicator & info row */}
            <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-text-muted pt-2 border-t border-border gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text">
                  {currentIndex + 1} of {mediaList.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  {selectedMedia.taken_on
                    ? formatDate(selectedMedia.taken_on)
                    : formatDate(selectedMedia.created_at)}
                </span>
                <a
                  href={selectedMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent font-semibold hover:underline"
                >
                  <span>Open original</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Caption Modal */}
      <Modal
        isOpen={Boolean(editingMedia)}
        onClose={() => setEditingMedia(null)}
        title="Edit Caption"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input
            label="Caption"
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder="Enter caption..."
            maxLength={300}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingMedia(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCaption}
              loading={actionLoading}
            >
              Save Caption
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingMedia)}
        onClose={() => setDeletingMedia(null)}
        title="Confirm Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Are you sure you want to permanently delete this {isVideo ? 'video' : 'image'}? This action
            removes the file from Cloudinary and cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingMedia(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={actionLoading}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
