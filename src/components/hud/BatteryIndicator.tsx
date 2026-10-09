'use client';
import React from 'react';

interface BatteryIndicatorProps {
  batteryLevel: number;
}

export function BatteryIndicator({ batteryLevel }: BatteryIndicatorProps) {
  return (
    <div className="text-right font-mono">
      <p className="text-xs text-neutral-400">BATTERY: {batteryLevel.toFixed(0)}%</p>
      <div className="w-24 h-1.5 bg-neutral-800 border border-neutral-700 mt-1">
        <div
          className={`h-full transition-all duration-300 ${batteryLevel > 20 ? 'bg-red-600' : 'bg-red-900 animate-pulse'}`}
          style={{ width: `${Math.max(0, Math.min(100, batteryLevel))}%` }}
        />
      </div>
    </div>
  );
}
