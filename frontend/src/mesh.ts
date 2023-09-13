import { GridData, Location, NormalizedLocation } from "./gridData";

export type Point = {
  x: number;
  y: number;
};

export type GridEntry = {
  index: number;
  uvX: number;
  uvY: number;
  x: number;
  y: number;
};

export type MeshState = {
  x: number;
  y: number;
  pinned: boolean;
}[];

/** See backend for explanation */
const getMercatorScaleFactor = (lat: number) => {
  return 1 / Math.cos((lat * Math.PI) / 180);
};

export const locationToNormalized = (
  location: Location,
  gridData: GridData
): NormalizedLocation => {
  const STATIC_MAP_SIZE_COEF = 280;

  const maxOffsetLat =
    STATIC_MAP_SIZE_COEF /
    2 ** gridData.zoom /
    getMercatorScaleFactor(location.lat);

  const maxOffsetLng = STATIC_MAP_SIZE_COEF / 2 ** gridData.zoom;

  const x =
    (location.lng - gridData.center.lng + maxOffsetLng) / (2 * maxOffsetLng);
  const y =
    (-location.lat + gridData.center.lat + maxOffsetLat) / (2 * maxOffsetLat);
  return { x, y };
};

export const getMesh = (gridSize: number, gridData: GridData) => {
  const grid: GridEntry[][] = new Array(gridSize);
  let index = 0;

  for (let y = 0; y < gridSize; y++) {
    grid[y] = [];
    for (let x = 0; x < gridSize; x++) {
      const location = gridData.locations[index].snapped_location;
      const normalized = locationToNormalized(location, gridData);

      grid[y].push({
        index: index,
        uvX: normalized.x,
        uvY: normalized.y,
        x: normalized.x,
        y: normalized.y,
      });
      index++;
    }
  }

  const triangles: Array<[number, number, number]> = [];

  for (let x = 0; x < gridSize - 1; x++) {
    for (let y = 0; y < gridSize - 1; y++) {
      if (x % 2 === y % 2) {
        triangles.push(
          [grid[x][y].index, grid[x + 1][y].index, grid[x][y + 1].index],
          [grid[x + 1][y].index, grid[x + 1][y + 1].index, grid[x][y + 1].index]
        );
      } else {
        triangles.push(
          [grid[x][y].index, grid[x + 1][y].index, grid[x + 1][y + 1].index],
          [grid[x][y].index, grid[x + 1][y + 1].index, grid[x][y + 1].index]
        );
      }
    }
  }

  return {
    grid: grid,
    triangleIndices: new Float32Array(triangles.flat()),
  };
};
