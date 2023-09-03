import * as PIXI from 'pixi.js';
import { useCallback } from 'react';
import { APP_HEIGHT, APP_WIDTH } from './constants';
import { Graphics } from '@pixi/react';
import { GridEntry, MeshState } from './mesh';

export const DebugOverlay = ({
  meshState,
  toggledKeys,
  grid,
}: {
  meshState: MeshState;
  toggledKeys: string[];
  grid: GridEntry[][];
}) => {
  const drawPoints = useCallback(
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

  const drawGrid = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();
      const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
        const pos1 = meshState[grid[x1][y1].index];
        const pos2 = meshState[grid[x2][y2].index];
        g.lineStyle(3, 0x555555, 0.5);
        g.moveTo(pos1.x * APP_WIDTH, pos1.y * APP_HEIGHT);
        g.lineTo(pos2.x * APP_WIDTH, pos2.y * APP_HEIGHT);
      };

      for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[x].length; y++) {
          if (x < grid.length - 1) {
            drawLine(x, y, x + 1, y);
          }
          if (y < grid[x].length - 1) {
            drawLine(x, y, x, y + 1);
          }
        }
      }
    },
    [meshState, grid]
  );

  return (
    <>
      {toggledKeys.includes('KeyD') && <Graphics draw={drawPoints} />}
      {toggledKeys.includes('KeyF') && <Graphics draw={drawGrid} />}
    </>
  );
};
