import { useState, useCallback } from 'react';

export function useGameLoop() {
  const [sanity, setSanity] = useState(100);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const penalizeSanity = useCallback((amount: number) => {
    setSanity((prev) => {
      const next = Math.max(0, prev - amount);
      if (next <= 0) {
        setIsGameOver(true);
      }
      return next;
    });
  }, []);

  const addScore = useCallback((pts: number) => {
    setScore((prev) => prev + pts);
  }, []);

  const resetGame = useCallback(() => {
    setSanity(100);
    setScore(0);
    setIsGameOver(false);
  }, []);

  return {
    sanity,
    score,
    isGameOver,
    penalizeSanity,
    addScore,
    resetGame
  };
}
