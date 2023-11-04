import { SimpleMesh, useTick } from "@pixi/react";

import * as PIXI from "pixi.js";
import { useMemo, useState } from "react";
import exampleMap from "./assets/map-v8.png";
import { Point, VertexPosition, getMesh } from "./mesh";
import { DebugOverlay } from "./DebugOverlay";
import { Spring, routeMatrixToSprings, stepSprings } from "./springs";
import gridData from "./assets/20x20grid-v8.json";
import useWindowDimensions from "./windowDimensions";

/**
 * Create a mesh of triangles from individual <SimpleMesh>es.
 * Originally, I had everything in one big <SimpleMesh>, but I ran into a bug where this
 * would break for larger mesh sizes: https://github.com/pixijs/pixijs/issues/9646
 */
const createMesh = (
  vertexPositions: VertexPosition[],
  triangles: Float32Array[],
  flatUvs: Float32Array,
  mapSizePx: number
) => {
  const indices = new Float32Array([0, 1, 2]);

  let meshes = triangles.map((triangle, i) => {
    const curVertices = new Float32Array([
      vertexPositions[triangle[0]].x * mapSizePx,
      vertexPositions[triangle[0]].y * mapSizePx,
      vertexPositions[triangle[1]].x * mapSizePx,
      vertexPositions[triangle[1]].y * mapSizePx,
      vertexPositions[triangle[2]].x * mapSizePx,
      vertexPositions[triangle[2]].y * mapSizePx,
    ]);

    const curUvs = new Float32Array([
      flatUvs[triangle[0] * 2],
      flatUvs[triangle[0] * 2 + 1],
      flatUvs[triangle[1] * 2],
      flatUvs[triangle[1] * 2 + 1],
      flatUvs[triangle[2] * 2],
      flatUvs[triangle[2] * 2 + 1],
    ]);

    return (
      <SimpleMesh
        key={i}
        image={exampleMap}
        uvs={new Float32Array(curUvs)}
        vertices={new Float32Array(curVertices)}
        // Since there is only one triangle now, the indices are trivial
        indices={indices}
        drawMode={PIXI.DRAW_MODES.TRIANGLES}
      />
    );
  });

  return meshes;
};

export const SpacetimeMap = ({
  toggledKeys,
  hoveredPoint,
}: {
  toggledKeys: string[];
  hoveredPoint: Point | null;
}) => {
  const windowDimensions = useWindowDimensions();
  const mapSizePx = Math.min(windowDimensions.width, windowDimensions.height);

  const normalizedHoveredPoint = hoveredPoint
    ? {
        x: hoveredPoint.x / mapSizePx,
        y: hoveredPoint.y / mapSizePx,
      }
    : null;
  const getConstantGridData = () => {
    const gridSize = gridData.size;

    const { grid, triangles } = getMesh(gridSize, gridData as any);

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
      triangles,
      springs,
      flatUvs,
    };
  };

  const { grid, initialPositions, triangles, springs, flatUvs } = useMemo(
    getConstantGridData,
    []
  );

  const [vertexPositions, setVertexPositions] = useState(initialPositions);

  useTick((delta) => {
    const deltaSeconds = delta / 60;

    let [newVertexPositions, _] = stepSprings(
      vertexPositions,
      springs,
      deltaSeconds,
      normalizedHoveredPoint
    );

    setVertexPositions(newVertexPositions);
  });

  const mesh = createMesh(vertexPositions, triangles, flatUvs, mapSizePx);

  return (
    <>
      {mesh}
      <DebugOverlay
        vertexPositions={vertexPositions}
        grid={grid}
        springs={springs}
        toggledKeys={toggledKeys}
        hoveredPoint={hoveredPoint}
        mapSizePx={mapSizePx}
      />
    </>
  );
};