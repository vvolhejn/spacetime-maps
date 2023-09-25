import { SimpleMesh, useTick } from "@pixi/react";

import * as PIXI from "pixi.js";
import { useMemo, useState } from "react";
import exampleMap from "./assets/map-v2.png";
import { APP_HEIGHT, APP_WIDTH } from "./constants";
import { MeshState, Point, getMesh } from "./mesh";
import { DebugOverlay } from "./DebugOverlay";
import { Spring, routeMatrixToSprings, stepSprings } from "./springs";
import gridData from "./assets/5x5grid-v5.json";

/**
 * Create a mesh of triangles from individual <SimpleMesh>es.
 * Originally, I had everything in one big <SimpleMesh>, but I ran into a bug where this
 * would break for larger mesh sizes: https://github.com/pixijs/pixijs/issues/9646
 */
const createMesh = (
  meshState: MeshState,
  triangleIndices: Float32Array,
  flatUvs: Float32Array
) => {
  let meshes = [];
  for (let i = 0; i < triangleIndices.length; i += 3) {
    const curIndices = triangleIndices.slice(i, i + 3);
    const curVertices = Array.from(curIndices)
      .map((i) => meshState.flat()[i])
      .map((entry) => [entry.x * APP_WIDTH, entry.y * APP_HEIGHT])
      .flat();
    const curUvs = Array.from(curIndices)
      .map((i) => [flatUvs[i * 2], flatUvs[i * 2 + 1]])
      .flat();

    meshes.push(
      <SimpleMesh
        key={i}
        image={exampleMap}
        uvs={new Float32Array(curUvs)}
        vertices={new Float32Array(curVertices)}
        // Since there is only one triangle now, the indices are trivial
        indices={new Float32Array([0, 1, 2])}
        drawMode={PIXI.DRAW_MODES.TRIANGLES}
      />
    );
  }

  return meshes;
};

export const StretchyMap = ({
  toggledKeys,
  hoveredPoint,
}: {
  toggledKeys: string[];
  hoveredPoint: Point | null;
}) => {
  const getConstantGridData = () => {
    const gridSize = gridData.size;

    const { grid, triangleIndices } = getMesh(gridSize, gridData as any);

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
    springs = springs.concat(routeMatrixToSprings(gridData as any));

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

  const mesh = createMesh(meshState, triangleIndices, flatUvs);

  return (
    <>
      {mesh}
      <DebugOverlay
        meshState={meshState}
        grid={grid}
        springs={springs}
        toggledKeys={toggledKeys}
        hoveredPoint={hoveredPoint}
      />
    </>
  );
};
