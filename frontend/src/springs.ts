import { MeshState } from './mesh';

type Spring = {
  from: number;
  to: number;
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
    const force = distance * 0.5 * deltaSeconds;
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
