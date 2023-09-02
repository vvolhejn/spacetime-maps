type GridEntry = {
  index: number;
  uvX: number;
  uvY: number;
  imageX: number;
  imageY: number;
};

export const getMesh = (
  gridSize: number,
  imageWidth: number,
  imageHeight: number
) => {
  const grid: Array<Array<GridEntry>> = [];
  let index = 0;
  for (let x = 0; x < gridSize; x++) {
    grid.push([]);
    for (let y = 0; y < gridSize; y++) {
      grid[x].push({
        index: index,
        uvX: x / (gridSize - 1),
        uvY: y / (gridSize - 1),
        imageX: (x * imageWidth) / (gridSize - 1),
        imageY: (y * imageHeight) / (gridSize - 1),
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
    uvs: new Float32Array(
      grid
        .flat()
        .map((entry) => [entry.uvX, entry.uvY])
        .flat()
    ),
    vertices: new Float32Array(
      grid
        .flat()
        .map((entry) => [entry.imageX, entry.imageY])
        .flat()
    ),
    indices: new Float32Array(flatTriangles),
  };
};
