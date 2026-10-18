'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface VideoPlayerProps {
  src: string;
  poster?: string | null;
  caption?: string | null;
}

export function VideoPlayer({ src, poster, caption }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

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

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden border border-border group"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        className="w-full h-auto max-h-[52vh] sm:max-h-[70vh] object-contain cursor-pointer"
        playsInline
      />

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

        <div className="flex items-center justify-between text-xs text-text gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1.5 text-text hover:text-accent touch-manipulation shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <span className="text-[11px] sm:text-xs text-text-muted font-mono shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

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

          <div className="flex items-center gap-1">
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
