import * as PIXI from 'pixi.js';
import { useCallback } from 'react';
import { APP_HEIGHT, APP_WIDTH } from './constants';
import { Graphics } from '@pixi/react';
import { MeshState } from './mesh';

export const DebugOverlay = ({ meshState }: { meshState: MeshState }) => {
  const draw = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();

      meshState.forEach((point) => {
        g.lineStyle(0);
        g.beginFill(point.pinned ? 0xffff0b : 0xff000b, 0.5);
        g.drawCircle(
          point.x * APP_WIDTH,
          point.y * APP_HEIGHT,
          point.pinned ? 5 : 10
        );
        g.endFill();
      });
    },
    [meshState]
  );
  return <Graphics draw={draw} />;
};
