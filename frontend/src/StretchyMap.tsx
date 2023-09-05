import { SimpleMesh, useTick } from '@pixi/react';

import * as PIXI from 'pixi.js';
import { useMemo, useState } from 'react';
import exampleMap from './assets/example-map.png';
import { APP_HEIGHT, APP_WIDTH } from './constants';
import { getMesh } from './mesh';
import { DebugOverlay } from './DebugOverlay';
import { Spring, routeMatrixToSprings, stepSprings } from './springs';
import gmailApiResponse from './assets/9x9matrix.json';

export const StretchyMap = ({ toggledKeys }: { toggledKeys: string[] }) => {
  const getConstantGridData = () => {
    const { grid, triangleIndices } = getMesh(9);

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
      length: 0,
      strength: 1,
    }));
    springs = springs.concat(routeMatrixToSprings(gmailApiResponse as any));

    const flatUvs = new Float32Array(
      grid
        .flat()
        .map((entry) => [entry.uvX, entry.uvY])
        .flat()
    );

    return {
      grid,
      initialPositions,
      triangleIndices,
      springs,
      flatUvs,
    };
  };

  const { grid, initialPositions, triangleIndices, springs, flatUvs } = useMemo(
    getConstantGridData,
    []
  );

  const [meshState, setMeshState] = useState(initialPositions);

  useTick((delta) => {
    const deltaSeconds = delta / 60;

    let newMeshState = stepSprings(meshState, springs, deltaSeconds);
    setMeshState(newMeshState);
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
      <DebugOverlay
        meshState={meshState}
        toggledKeys={toggledKeys}
        grid={grid}
      />
    </>
  );
};
