'use client';
import type { RefCallback } from 'react';

interface CameraFeedProps {
  videoRef: RefCallback<HTMLVideoElement>;
}

export function CameraFeed({ videoRef }: CameraFeedProps) {
  return (
    <video
      ref={videoRef}
      playsInline
      muted
      autoPlay
      className="absolute inset-0 h-full w-full object-cover z-0 pointer-events-none"
    />
  );
}
