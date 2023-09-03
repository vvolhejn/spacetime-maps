import { SimpleMesh, useTick } from '@pixi/react';

import * as PIXI from 'pixi.js';
import { useMemo, useRef, useState } from 'react';
import exampleMap from './assets/example-map.png';
import { APP_HEIGHT, APP_WIDTH } from './constants';
import { getMesh } from './mesh';
import { DebugOverlay } from './DebugOverlay';

const w = APP_WIDTH;
const h = APP_HEIGHT;

type Spring = {
  from: number;
  to: number;
};

export const StretchyMap = ({ nClicks }: { nClicks: number }) => {
  const getConstantGridData = () => {
    const { grid, triangleIndices } = getMesh(5);

    const flatGrid = grid.flat();
    const initialPositions = flatGrid
      .map((entry) => ({
        x: entry.x,
        y: entry.y,
        pinned: false,
      }))
      .concat(
        flatGrid.map((entry) => ({
          x: entry.x,
          y: entry.y,
          pinned: true,
        }))
      );

    let springs: Spring[] = flatGrid.map((entry, i) => ({
      from: i,
      to: i + flatGrid.length,
    }));
    springs.push({ from: 6, to: 11 });

    const flatUvs = new Float32Array(
      grid
        .flat()
        .map((entry) => [entry.uvX, entry.uvY])
        .flat()
    );

    return {
      initialPositions,
      triangleIndices,
      springs,
      flatUvs,
    };
  };

  // Use useMemo to memoize the result of the computation
  const { initialPositions, triangleIndices, springs, flatUvs } = useMemo(
    getConstantGridData,
    []
  );

  const [meshState, setMeshState] = useState(initialPositions);
  const iter = useRef(0);

  useTick((delta) => {
    iter.current += 0.05 * delta;
    const time = iter.current;

    let newMeshState = meshState.map((entry, i) => ({
      x: entry.x,
      y: entry.y,
      dx: 0,
      dy: 0,
      pinned: entry.pinned,
    }));

    springs.forEach((spring) => {
      const from = newMeshState[spring.from];
      const to = newMeshState[spring.to];
      const distance = Math.sqrt(
        (from.x - to.x) * (from.x - to.x) + (from.y - to.y) * (from.y - to.y)
      );
      const force = distance * 0.01;
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const dx = Math.cos(angle) * force;
      const dy = Math.sin(angle) * force;
      newMeshState[spring.from].dx += dx;
      newMeshState[spring.from].dy += dy;
      newMeshState[spring.to].dx -= dx;
      newMeshState[spring.to].dy -= dy;
    });

    setMeshState(
      newMeshState.map((entry) => ({
        x: entry.pinned ? entry.x : entry.x + entry.dx,
        y: entry.pinned ? entry.y : entry.y + entry.dy,
        pinned: entry.pinned,
      }))
    );
  });

  const flatVertices = new Float32Array(
    meshState
      .flat()
      .map((entry) => [entry.x * APP_WIDTH, entry.y * APP_HEIGHT])
      .flat()
  );

  return (
    <>
      <SimpleMesh
        image={exampleMap}
        uvs={flatUvs}
        vertices={flatVertices}
        indices={triangleIndices}
        drawMode={PIXI.DRAW_MODES.TRIANGLES}
      />
      {nClicks % 2 === 0 && <DebugOverlay meshState={meshState} />}
    </>
  );
};
