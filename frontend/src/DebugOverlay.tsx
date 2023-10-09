import * as PIXI from "pixi.js";
import { useCallback } from "react";
import { APP_HEIGHT, APP_WIDTH } from "./constants";
import { Graphics, Text } from "@pixi/react";
import { GridEntry, MeshState, MeshStateEntry, Point } from "./mesh";
import { Spring, getForce } from "./springs";

const getClosestMeshPoint = (point: Point, meshState: MeshState) => {
  let closestIndex = 0;
  let closestDist = Infinity;

  meshState.forEach((p, i) => {
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
  meshState: MeshState,
  springs: Spring[],
  index: number
): { entry: MeshStateEntry; force: number; spring: Spring }[] => {
  return springs
    .filter((spring) => spring.from === index || spring.to === index)
    .map((spring) => {
      const [iTo, iFrom] =
        spring.from === index
          ? [spring.to, spring.from]
          : [spring.from, spring.to];

      const from = meshState[iFrom];
      const to = meshState[iTo];

      const distanceRatio =
        Math.hypot(to.x - from.x, to.y - from.y) / spring.length;

      const force = getForce(from, to, spring.length);

      return { entry: to, force, spring };
    });
};

export const DebugOverlay = ({
  meshState,
  grid,
  springs,
  toggledKeys,
  hoveredPoint,
}: {
  meshState: MeshState;
  grid: GridEntry[][];
  springs: Spring[];
  toggledKeys: string[];
  hoveredPoint: Point | null;
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

  const drawSprings = useCallback(
    (g: PIXI.Graphics) => {
      if (!hoveredPoint) return;
      g.clear();
      const closestIndex = getClosestMeshPoint(hoveredPoint, meshState);
      const closestMeshPoint = meshState[closestIndex];

      g.beginFill(0x000000, 0.5);
      g.drawCircle(
        closestMeshPoint.x * APP_WIDTH,
        closestMeshPoint.y * APP_HEIGHT,
        10
      );

      const forces = getForcesForEntry(meshState, springs, closestIndex);

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
          entry.x * APP_WIDTH,
          entry.y * APP_HEIGHT,
          angle + Math.PI / 2,
          2 * Math.sqrt(Math.abs(force)),
          pushingAway ? 0xef767a : 0x2f52e0
        );
      });
    },
    [meshState, hoveredPoint, springs]
  );

  const numbers = meshState
    // The second half of the mesh are the "pinned" points
    .slice(0, meshState.length / 2)
    .map((point, i) => (
      <Text
        x={point.x * APP_WIDTH - 15}
        y={point.y * APP_HEIGHT - 15}
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
