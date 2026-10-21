'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Repeat,
  SkipForward,
  SkipBack,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export type VideoPlayMode = 'normal' | 'loop' | 'autonext';

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
  caption?: string | null;
  playMode?: VideoPlayMode;
  onPlayModeChange?: (mode: VideoPlayMode) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  autoPlay?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  caption,
  playMode = 'autonext',
  onPlayModeChange,
  onNext,
  onPrev,
  hasNext = true,
  hasPrev = true,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Swipe gesture detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Handle autoPlay when source changes or autoPlay prop is enabled
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay with sound might be blocked by browser policy without user gesture
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            }
          });
      }
    }
  }, [src, autoPlay]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleEnded = () => {
    if (playMode === 'loop') {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    } else if (playMode === 'autonext' && onNext) {
      onNext();
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  // Touch swipe gestures on video
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Minimum swipe threshold 45px and predominantly horizontal
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0 && onNext) {
        onNext(); // Swiped left -> Next video
      } else if (deltaX > 0 && onPrev) {
        onPrev(); // Swiped right -> Previous video
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden border border-border group select-none"
    >
      {/* Video Viewport with Touch Gestures */}
      <div
        className="relative flex items-center justify-center bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          loop={playMode === 'loop'}
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          className="w-full h-auto max-h-[50vh] sm:max-h-[65vh] object-contain cursor-pointer"
          playsInline
        />

        {/* Floating Quick Prev / Next Buttons */}
        {hasPrev && onPrev && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous video"
            title="Previous video (Swipe Right)"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white flex items-center justify-center transition-all opacity-85 sm:opacity-0 sm:group-hover:opacity-100 z-10 shadow-md backdrop-blur-2xs touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {hasNext && onNext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next video"
            title="Next video (Swipe Left)"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-white flex items-center justify-center transition-all opacity-85 sm:opacity-0 sm:group-hover:opacity-100 z-10 shadow-md backdrop-blur-2xs touch-manipulation"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Video Control Bar */}
      <div className="bg-surface/95 border-t border-border px-2.5 sm:px-4 py-2 sm:py-2.5 flex flex-col gap-1.5 sm:gap-2">
        {/* Seek Bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-accent"
          aria-label="Seek video playback"
        />

        <div className="flex flex-wrap items-center justify-between text-xs text-text gap-2">
          {/* Playback Controls & Time */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {hasPrev && onPrev && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrev}
                aria-label="Previous video"
                title="Previous video"
                className="p-1.5 text-text hover:text-accent touch-manipulation shrink-0"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1.5 text-text hover:text-accent touch-manipulation shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            {hasNext && onNext && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                aria-label="Next video"
                title="Next video"
                className="p-1.5 text-text hover:text-accent touch-manipulation shrink-0"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            )}

            <span className="text-[11px] sm:text-xs text-text-muted font-mono shrink-0 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume */}
            <div className="flex items-center gap-1 sm:gap-1.5 ml-1 sm:ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 text-text hover:text-accent touch-manipulation shrink-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden sm:block w-16 h-1.5 bg-background rounded appearance-none cursor-pointer accent-accent"
                aria-label="Volume slider"
              />
            </div>
          </div>

          {/* Right Section: Mode Controls (Loop & Auto-Next) + Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play Mode Switcher (Loop / Auto-Next) */}
            <div className="inline-flex items-center p-0.5 bg-background border border-border rounded-md">
              <button
                type="button"
                onClick={() =>
                  onPlayModeChange?.(playMode === 'autonext' ? 'normal' : 'autonext')
                }
                title={
                  playMode === 'autonext'
                    ? 'Auto-Next is active (automatically advances to next video)'
                    : 'Click to enable Auto-Next'
                }
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-[11px] font-semibold transition-all touch-manipulation',
                  playMode === 'autonext'
                    ? 'bg-accent text-accent-contrast shadow-2xs'
                    : 'text-text-muted hover:text-text'
                )}
              >
                <SkipForward className="w-3 h-3" />
                <span>Auto-Next</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onPlayModeChange?.(playMode === 'loop' ? 'normal' : 'loop')
                }
                title={
                  playMode === 'loop'
                    ? 'Loop is active (repeats current video indefinitely)'
                    : 'Click to enable Loop'
                }
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-[11px] font-semibold transition-all touch-manipulation',
                  playMode === 'loop'
                    ? 'bg-accent text-accent-contrast shadow-2xs'
                    : 'text-text-muted hover:text-text'
                )}
              >
                <Repeat className="w-3 h-3" />
                <span>Loop</span>
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              aria-label="Full screen"
              className="p-1.5 text-text hover:text-accent touch-manipulation shrink-0"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
