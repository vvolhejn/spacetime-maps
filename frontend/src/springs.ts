import { MeshState } from './mesh';

export type Spring = {
  from: number;
  to: number;
  length: number;
};

// e.g.
//   {
//   "originIndex": 0,
//   "destinationIndex": 4,
//   "status": {},
//   "distanceMeters": 6542,
//   "duration": "1111s",
//   "condition": "ROUTE_EXISTS"
// }
type RouteMatrixEntry = {
  originIndex: number;
  destinationIndex: number;
  status: any;
  distanceMeters: number;
  duration: string;
  condition: string;
};

type RouteMatrix = RouteMatrixEntry[];

export const routeMatrixToSprings = (routeMatrix: RouteMatrix) => {
  const validRoutes = routeMatrix
    .filter(
      (entry) =>
        entry.condition === 'ROUTE_EXISTS' &&
        entry.originIndex !== entry.destinationIndex
    )
    .map((entry) => {
      if (entry.duration[entry.duration.length - 1] !== 's') {
        throw new Error('Invalid duration, expected it to end with "s"');
      }
      const durationSeconds = parseInt(entry.duration.split('s')[0]);
      if (durationSeconds === 0) {
        throw new Error('Invalid duration, expected it to be > 0');
      }
      return {
        ...entry,
        durationSeconds,
        metersPerSecond: entry.distanceMeters / durationSeconds,
      };
    });

  const averageSpeed =
    validRoutes.reduce((acc, entry) => acc + entry.metersPerSecond, 0) /
    validRoutes.length;

  const res = validRoutes.map((entry) => ({
    from: entry.originIndex,
    to: entry.destinationIndex,
    length: averageSpeed / entry.metersPerSecond,
  }));
  return res;
};

export const stepSprings = (
  meshState: MeshState,
  springs: Spring[],
  deltaSeconds: number
): MeshState => {
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
    const force = (distance - spring.length) * 0.1 * deltaSeconds;

    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const dx = Math.cos(angle) * force;
    const dy = Math.sin(angle) * force;
    newMeshState[spring.from].dx += dx;
    newMeshState[spring.from].dy += dy;
    newMeshState[spring.to].dx -= dx;
    newMeshState[spring.to].dy -= dy;
  });

  return newMeshState.map((entry) => ({
    x: entry.pinned ? entry.x : entry.x + entry.dx,
    y: entry.pinned ? entry.y : entry.y + entry.dy,
    pinned: entry.pinned,
  }));
};
