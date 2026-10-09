'use client';
import React from 'react';

interface GlitchOverlayProps {
  active: boolean;
}

export function GlitchOverlay({ active }: GlitchOverlayProps) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 z-40 bg-red-950/80 mix-blend-hard-light flex items-center justify-center animate-pulse pointer-events-none">
      <div className="w-full h-full bg-[radial-gradient(circle,_transparent_20%,_#000000_100%)] opacity-95" />
      <div className="absolute text-red-600 font-mono font-black text-2xl tracking-widest uppercase">
        PERIMETER BREACH
      </div>
    </div>
  );
}
