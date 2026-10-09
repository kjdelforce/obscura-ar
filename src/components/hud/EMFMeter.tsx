'use client';
import React from 'react';

interface EMFMeterProps {
  distance: number;
}

export function EMFMeter({ distance }: EMFMeterProps) {
  const intensity = Math.max(1, Math.min(5, Math.ceil(5 - (distance / 2))));

  return (
    <div className="flex flex-col gap-1 bg-black/60 border border-neutral-800 p-2 font-mono text-[10px]">
      <div className="flex justify-between items-center text-neutral-400">
        <span>EMF GAUSS</span>
        <span className={intensity >= 4 ? 'text-red-500 font-bold animate-pulse' : 'text-neutral-300'}>
          LEVEL {intensity}
        </span>
      </div>
      <div className="flex gap-1 h-3">
        {[1, 2, 3, 4, 5].map((lvl) => {
          let bg = 'bg-neutral-800';
          if (lvl <= intensity) {
            bg = lvl <= 2 ? 'bg-green-500' : lvl <= 4 ? 'bg-yellow-500' : 'bg-red-600 animate-pulse';
          }
          return <div key={lvl} className={`flex-1 ${bg} transition-colors duration-150`} />;
        })}
      </div>
    </div>
  );
}
