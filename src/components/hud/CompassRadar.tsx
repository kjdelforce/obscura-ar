'use client';
import React from 'react';

interface CompassRadarProps {
  entityDistance: number;
}

export function CompassRadar({ entityDistance }: CompassRadarProps) {
  const normDist = Math.max(0.1, Math.min(1, entityDistance / 10));

  return (
    <div className="w-16 h-16 border border-neutral-800 rounded-full relative flex items-center justify-center bg-black/40">
      <div className="absolute inset-0 rounded-full border border-neutral-900 scale-75" />
      <div className="absolute inset-0 rounded-full border border-neutral-900 scale-50" />
      {/* Entity Blip */}
      <div
        className="w-1.5 h-1.5 bg-red-600 rounded-full absolute animate-ping"
        style={{
          transform: `translateY(-${normDist * 28}px)`
        }}
      />
      <div
        className="w-1.5 h-1.5 bg-red-600 rounded-full absolute"
        style={{
          transform: `translateY(-${normDist * 28}px)`
        }}
      />
      {/* Center user dot */}
      <div className="w-1 h-1 bg-neutral-500 rounded-full" />
    </div>
  );
}
