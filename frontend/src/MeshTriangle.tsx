import { PixiComponent } from "@pixi/react";
import * as PIXI from "pixi.js";

type Props = {
  image: string;
  uvs: Float32Array;
  vertices: Float32Array;
};

const indices = new Float32Array([0, 1, 2]);

/**
 * This component works pretty much just like <SimpleMesh> with some specialization:
 * it only renders a single triangle. However, <SimpleMesh> was causing a memory leak
 * that I couldn't debug, and this component somehow avoids it.
 */
export default PixiComponent("MeshTriangle", {
  create: (props: Props) => {
    return new PIXI.SimpleMesh(
      PIXI.Texture.from(props.image),
      props.vertices,
      props.uvs,
      indices,
      PIXI.DRAW_MODES.TRIANGLES
    );
  },
  applyProps: (instance, oldProps, newProps) => {
    if (oldProps.vertices !== newProps.vertices) {
      instance.vertices = newProps.vertices;
    }
    // We don't need to update `uvs` or `image` but let's leave the code here
    // in case we need it later.
    if (oldProps.uvs !== newProps.uvs) {
      instance.uvs = newProps.uvs;
    }
    if (oldProps.image !== newProps.image) {
      instance.texture = PIXI.Texture.from(newProps.image);
    }
  },
  didMount: (instance, parent) => {},
  willUnmount: (instance, parent) => {},
  config: {
    // destroy instance on unmount? (default: true)
    destroy: true,
    // destroy its children on unmount? (default: true)
    destroyChildren: true,
  },
});
