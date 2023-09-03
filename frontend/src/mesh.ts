type GridEntry = {
  index: number;
  uvX: number;
  uvY: number;
  x: number;
  y: number;
};

export const getMesh = (gridSize: number) => {
  const grid: Array<Array<GridEntry>> = [];
  let index = 0;
  for (let x = 0; x < gridSize; x++) {
    grid.push([]);
    for (let y = 0; y < gridSize; y++) {
      grid[x].push({
        index: index,
        uvX: x / (gridSize - 1),
        uvY: y / (gridSize - 1),
        x: x / (gridSize - 1),
        y: y / (gridSize - 1),
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

  const flatTriangles = triangles.flat();

  return {
    grid: grid,
    indices: new Float32Array(flatTriangles),
  };
};
