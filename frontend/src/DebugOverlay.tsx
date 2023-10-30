import * as PIXI from "pixi.js";
import { useCallback } from "react";
import { Graphics, Text } from "@pixi/react";
import { GridEntry, VertexPosition, Point } from "./mesh";
import { Spring, getForce } from "./springs";

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

export const DebugOverlay = ({
  vertexPositions,
  grid,
  springs,
  toggledKeys,
  hoveredPoint,
  mapSizePx,
}: {
  vertexPositions: VertexPosition[];
  grid: GridEntry[][];
  springs: Spring[];
  toggledKeys: string[];
  hoveredPoint: Point | null;
  mapSizePx: number;
}) => {
  const drawPoints = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();

      vertexPositions.forEach((point) => {
        g.lineStyle(0);
        g.beginFill(point.pinned ? 0xffff0b : 0xff000b, 0.5);
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

  const drawSprings = useCallback(
    (g: PIXI.Graphics) => {
      if (!hoveredPoint) return;
      g.clear();
      const closestIndex = getClosestMeshPoint(hoveredPoint, vertexPositions);
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
    [vertexPositions, hoveredPoint, springs, mapSizePx]
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
      {toggledKeys.includes("KeyW") && <Graphics draw={drawSprings} />}
      {toggledKeys.includes("KeyS") && numbers}
      {toggledKeys.includes("KeyD") && <Graphics draw={drawPoints} />}
      {toggledKeys.includes("KeyF") && <Graphics draw={drawGrid} />}
    </>
  );
};
