'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Trash2, Edit2, Play, Calendar, ExternalLink } from 'lucide-react';
import { Media, MediaType } from '../../types';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { VideoPlayer } from './VideoPlayer';

interface MediaGridProps {
  mediaList: Media[];
  mediaType: MediaType;
  onItemDeleted: (id: string) => void;
  onItemUpdated: (media: Media) => void;
}

export function MediaGrid({
  mediaList,
  mediaType,
  onItemDeleted,
  onItemUpdated,
}: MediaGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [deletingMedia, setDeletingMedia] = useState<Media | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isVideo = mediaType === 'video';

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
    } catch (err) {
      console.error('Failed to update caption:', err);
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
    } catch (err) {
      console.error('Failed to delete media:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (mediaList.length === 0) {
    return (
      <div className="text-center py-16 bg-surface border border-border rounded-lg p-8">
        <p className="text-sm font-semibold text-text">No {isVideo ? 'videos' : 'images'} uploaded yet</p>
        <p className="text-xs text-text-muted mt-1">
          Use the upload button above to add your first {isVideo ? 'video' : 'photo'}.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaList.map((item) => (
          <div
            key={item.id}
            className="group bg-surface border border-border rounded-lg overflow-hidden flex flex-col justify-between"
          >
            {/* Media Thumbnail Container */}
            <div
              onClick={() => setSelectedMedia(item)}
              className="relative aspect-video bg-background cursor-pointer overflow-hidden flex items-center justify-center"
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
                    <div className="w-10 h-10 rounded-full bg-surface/90 text-accent flex items-center justify-center shadow-none">
                      <Play className="w-5 h-5 ml-0.5" />
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
            <div className="p-3">
              <p className="text-xs font-medium text-text line-clamp-2 min-h-[2rem]">
                {item.caption || <span className="text-text-muted italic">No caption</span>}
              </p>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-[11px] text-text-muted">
                <span>{item.taken_on ? formatDate(item.taken_on) : formatDate(item.created_at)}</span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1 text-text-muted hover:text-accent rounded transition-colors"
                    aria-label="Edit caption"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingMedia(item)}
                    className="p-1 text-text-muted hover:text-[#DC2626] rounded transition-colors"
                    aria-label="Delete asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Media Preview Modal */}
      <Modal
        isOpen={Boolean(selectedMedia)}
        onClose={() => setSelectedMedia(null)}
        title={isVideo ? 'Video Player' : (selectedMedia?.caption || 'Image Preview')}
        maxWidth="2xl"
      >
        {selectedMedia && (
          <div className="space-y-4">
            {isVideo ? (
              <VideoPlayer
                src={selectedMedia.url}
                poster={selectedMedia.thumbnail_url}
                caption={selectedMedia.caption}
              />
            ) : (
              <div className="relative max-h-[70vh] flex items-center justify-center bg-black/10 rounded-lg overflow-hidden border border-border">
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.caption || 'Preview image'}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
              <span>Recorded: {formatDate(selectedMedia.taken_on || selectedMedia.created_at)}</span>
              <a
                href={selectedMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                <span>Open original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
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
