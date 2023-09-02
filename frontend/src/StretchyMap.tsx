import { SimpleMesh, useTick } from '@pixi/react';

import * as PIXI from 'pixi.js';
import { useRef, useState } from 'react';
import exampleMap from './assets/example-map.png';
import { APP_HEIGHT, APP_WIDTH } from './constants';

const w = APP_WIDTH;
const h = APP_HEIGHT;

const state = {
  indices: new Uint16Array([
    0, 3, 4, 0, 1, 4, 1, 2, 4, 2, 4, 5, 3, 4, 6, 4, 6, 7, 4, 7, 8, 4, 5, 8,
  ]),
  uvs: new Float32Array([
    0, 0, 0.5, 0, 1, 0, 0, 0.5, 0.5, 0.5, 1, 0.5, 0, 1, 0.5, 1, 1, 1,
  ]),
  vertices: new Float32Array([
    0,
    0,
    w / 2,
    0,
    w,
    0,
    0,
    h / 2,
    w / 2,
    h / 2,
    w,
    h / 2,
    0,
    h,
    w / 2,
    h,
    w,
    h,
  ]),
};

// const reducer = (_: any, { data }: { data: any }) => data;

export const StretchyMap = () => {
  const [motion, update] = useState({ x: 0, y: 0, rotation: 0, anchor: 0 });
  const iter = useRef(0);

  useTick((delta) => {
    const i = (iter.current += 0.05 * delta);

    update({
      x: Math.sin(i) * 100,
      y: Math.sin(i / 1.5) * 100,
      rotation: Math.sin(i) * Math.PI,
      anchor: Math.sin(i / 2),
    });
  });

  const vertices = new Float32Array(state.vertices);
  vertices[8] = w / 2 + motion.x;
  vertices[9] = h / 2 + motion.y - 50;

  return (
    <SimpleMesh
      image={exampleMap}
      uvs={state.uvs}
      vertices={vertices}
      indices={state.indices}
      drawMode={PIXI.DRAW_MODES.TRIANGLES}
    />
  );
};
