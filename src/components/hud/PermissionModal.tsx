'use client';
import React from 'react';

interface PermissionModalProps {
  onStart: () => void;
}

export function PermissionModal({ onStart }: PermissionModalProps) {
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-6 text-white font-mono">
      <div className="w-16 h-1 bg-red-600 mb-6" />
      <h1 className="text-4xl font-extrabold tracking-widest text-red-600 mb-2">OBSCURA</h1>
      <p className="text-[10px] text-neutral-500 mb-4 tracking-widest uppercase">Augmented Reality Exorcism Protocol</p>
      
      <div className="max-w-xs text-xs text-neutral-400 space-y-3 mb-8 text-center leading-relaxed">
        <p>• Move physically in dark spaces.</p>
        <p>• Wear headphones for 3D binaural tracking.</p>
        <p>• Hold line-of-sight on sigils with Torch OFF to exorcise.</p>
        <p>• Use Torch to freeze The Watcher before distance breaches 1.1m.</p>
      </div>

      <button
        onClick={onStart}
        className="border border-red-600 bg-red-950/40 px-8 py-4 text-sm font-bold uppercase tracking-widest text-red-100 hover:bg-red-800 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]"
      >
        Initialize Feed
      </button>
    </main>
  );
}
