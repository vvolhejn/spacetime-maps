import { SimpleMesh, useTick } from '@pixi/react';

import * as PIXI from 'pixi.js';
import { useRef, useState } from 'react';
import exampleMap from './assets/example-map.png';
import { APP_HEIGHT, APP_WIDTH } from './constants';
import { getMesh } from './mesh';

const w = APP_WIDTH;
const h = APP_HEIGHT;

export const StretchyMap = () => {
  const [meshState, setMeshState] = useState(getMesh(5));
  const iter = useRef(0);

  useTick((delta) => {
    const i = (iter.current += 0.05 * delta);

    // setMeshState({
    //   ...meshState,
    //   vertices: meshState.vertices.map((v, i) => {
    //     if (i % 2 === 0) {
    //       return v + Math.sin(i * 0.1) * 0.1;
    //     } else {
    //       return v + Math.cos(i * 0.1) * 0.1;
    //     }
    //   }),
    // });
  });

  const flatVertices = new Float32Array(
    meshState.grid
      .flat()
      .map((entry) => [entry.x * APP_WIDTH, entry.y * APP_HEIGHT])
      .flat()
  );
  const flatUvs = new Float32Array(
    meshState.grid
      .flat()
      .map((entry) => [entry.uvX, entry.uvY])
      .flat()
  );

  return (
    <SimpleMesh
      image={exampleMap}
      uvs={flatUvs}
      vertices={flatVertices}
      indices={meshState.indices}
      drawMode={PIXI.DRAW_MODES.TRIANGLES}
    />
  );
};
