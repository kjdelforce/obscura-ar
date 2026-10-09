'use client';
import dynamic from 'next/dynamic';

const GameContainer = dynamic(() => import('@/components/GameContainer'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center font-mono text-red-600 text-xs tracking-widest">
      <div className="w-12 h-1 bg-red-600 mb-4 animate-pulse" />
      INITIALIZING AR INTERFACE...
    </div>
  ),
});

export default function Page() {
  return <GameContainer />;
}
