import * as PIXI from "pixi.js";
import { useCallback } from "react";
import { Graphics, Text } from "@pixi/react";
import { GridEntry, VertexPosition, Point } from "./mesh";
import { Spring, getForce } from "./springs";
import { ViewSettings } from "./viewSettings";

const getClosestMeshPoint = (
  point: Point,
  vertexPositions: VertexPosition[]
) => {
  let closestIndex = 0;
  let closestDist = Infinity;

  vertexPositions.forEach((p, i) => {
    if (p.pinned) return;
    const dist = Math.hypot(p.x - point.x, p.y - point.y);
    if (dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  });
  return closestIndex;
};

const drawArrow = (
  g: PIXI.Graphics,
  x: number,
  y: number,
  angle: number,
  scale: number = 1,
  color: number = 0x000000
) => {
  g.beginFill(color, 0.8);
  g.moveTo(
    x + 10 * scale * Math.cos(angle + Math.PI / 2),
    y + 10 * scale * Math.sin(angle + Math.PI / 2)
  );
  g.lineTo(
    x + 10 * scale * Math.cos(angle - Math.PI / 2),
    y + 10 * scale * Math.sin(angle - Math.PI / 2)
  );
  g.lineTo(x + 20 * scale * Math.cos(angle), y + 20 * scale * Math.sin(angle));
  g.closePath();
  g.endFill();
};

const getForcesForEntry = (
  vertexPositions: VertexPosition[],
  springs: Spring[],
  index: number
): { entry: VertexPosition; force: number; spring: Spring }[] => {
  return springs
    .filter((spring) => spring.from === index || spring.to === index)
    .map((spring) => {
      const [iTo, iFrom] =
        spring.from === index
          ? [spring.to, spring.from]
          : [spring.from, spring.to];

      const from = vertexPositions[iFrom];
      const to = vertexPositions[iTo];

      const force = getForce(from, to, spring.length);

      return { entry: to, force, spring };
    });
};

const simpleHash = (data: string): number => {
  let hash = 0;
  if (data.length === 0) return hash;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

const hashPair = (num1: number, num2: number): number => {
  const pairString = `${num1},${num2}`;
  return simpleHash(pairString);
};

export const DebugOverlay = ({
  vertexPositions,
  grid,
  springs,
  viewSettings,
  normalizedHoveredPoint,
  mapSizePx,
}: {
  vertexPositions: VertexPosition[];
  grid: GridEntry[][];
  springs: Spring[];
  viewSettings: ViewSettings;
  normalizedHoveredPoint: Point | null;
  mapSizePx: number;
}) => {
  const drawGridPoints = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();

      vertexPositions.forEach((point) => {
        g.lineStyle(0);
        g.beginFill(point.pinned ? 0x555555 : 0xff000b, 0.5);
        g.drawCircle(
          point.x * mapSizePx,
          point.y * mapSizePx,
          point.pinned ? 5 : 10
        );
        g.endFill();
      });
    },
    [vertexPositions, mapSizePx]
  );

  const drawGrid = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();
      const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
        const pos1 = vertexPositions[grid[x1][y1].index];
        const pos2 = vertexPositions[grid[x2][y2].index];
        g.lineStyle(3, 0x555555, 0.5);
        g.moveTo(pos1.x * mapSizePx, pos1.y * mapSizePx);
        g.lineTo(pos2.x * mapSizePx, pos2.y * mapSizePx);
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
    [vertexPositions, grid, mapSizePx]
  );

  const drawSpringArrows = useCallback(
    (g: PIXI.Graphics) => {
      if (!normalizedHoveredPoint) return;
      g.clear();
      const closestIndex = getClosestMeshPoint(
        normalizedHoveredPoint,
        vertexPositions
      );
      const closestMeshPoint = vertexPositions[closestIndex];

      g.beginFill(0x000000, 0.5);
      g.drawCircle(
        closestMeshPoint.x * mapSizePx,
        closestMeshPoint.y * mapSizePx,
        10
      );

      const forces = getForcesForEntry(vertexPositions, springs, closestIndex);

      forces.forEach(({ entry, force, spring }) => {
        const from = closestMeshPoint;
        const to = entry;

        let angle = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI / 2;
        const distanceRatio =
          Math.hypot(to.x - from.x, to.y - from.y) / spring.length;

        if (distanceRatio < 1) {
          angle += Math.PI;
        }

        const pushingAway = force < 0;

        drawArrow(
          g,
          entry.x * mapSizePx,
          entry.y * mapSizePx,
          angle + Math.PI / 2,
          2 * Math.sqrt(Math.abs(force)),
          pushingAway ? 0xef767a : 0x2f52e0
        );
      });
    },
    [vertexPositions, normalizedHoveredPoint, springs, mapSizePx]
  );

  const drawSpringsByDistance = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();
      springs.forEach((spring) => {
        const from = vertexPositions[spring.from];
        const to = vertexPositions[spring.to];
        if (from.pinned || to.pinned) return;

        const length = Math.hypot(from.x - to.x, from.y - to.y);
        if (length > viewSettings.showSpringsThreshold) return;

        // Only show a subset of the springs, otherwise there'd be too many.
        if (hashPair(spring.from, spring.to) % 32 !== 0) {
          return;
        }

        g.lineStyle(2, 0x000000, 0.1);
        g.moveTo(from.x * mapSizePx, from.y * mapSizePx);
        g.lineTo(to.x * mapSizePx, to.y * mapSizePx);
      });
    },
    [vertexPositions, springs, viewSettings, mapSizePx]
  );

  const numbers = vertexPositions
    // The second half of the mesh are the "pinned" points
    .slice(0, vertexPositions.length / 2)
    .map((point, i) => (
      <Text
        x={point.x * mapSizePx - 15}
        y={point.y * mapSizePx - 15}
        text={i + ""}
        key={i}
      />
    ));

  return (
    <>
      {viewSettings.showSpringArrows && <Graphics draw={drawSpringArrows} />}
      {viewSettings.showGridNumbers && numbers}
      {viewSettings.showGridPoints && <Graphics draw={drawGridPoints} />}
      {viewSettings.showGrid && <Graphics draw={drawGrid} />}
      {viewSettings.showSpringsByDistance && (
        <Graphics draw={drawSpringsByDistance} />
      )}
    </>
  );
};
