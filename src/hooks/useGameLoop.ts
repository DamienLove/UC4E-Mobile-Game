
import React from 'react';
import { GameAction, WorldTransform } from '../types';

export const useGameLoop = (dispatch: React.Dispatch<GameAction>, dimensions: { width: number; height: number }, isPaused: boolean, transform: WorldTransform) => {
  const animationFrameId = React.useRef<number | null>(null);
  const latestState = React.useRef({ dimensions, isPaused, transform });

  // Update refs with latest values on every render
  React.useLayoutEffect(() => {
    latestState.current = { dimensions, isPaused, transform };
  }, [dimensions, isPaused, transform]);

  const loop = React.useCallback(() => {
    const { dimensions: currentDimensions, isPaused: currentIsPaused, transform: currentTransform } = latestState.current;
    if (!currentIsPaused) {
      dispatch({ type: 'TICK', payload: { width: currentDimensions.width, height: currentDimensions.height, transform: currentTransform } });
    }
    animationFrameId.current = requestAnimationFrame(loop);
  }, [dispatch]);

  React.useEffect(() => {
    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [loop]);
};
