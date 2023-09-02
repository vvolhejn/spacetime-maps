// import React from 'react';
// import logo from './logo.svg';
// // import './App.css';

// import { BlurFilter } from 'pixi.js';
// import * as PIXI from 'pixi.js';
// import { Stage, Container, Sprite, Text, AppConsumer } from '@pixi/react';
// import { useMemo } from 'react';

import { Stage, SimpleMesh, AppConsumer } from '@pixi/react';
// const { Stage, SimpleMesh, AppConsumer } = ReactPixi;
import React from 'react';
import * as PIXI from 'pixi.js';

const image = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/cake.png';
const w = 500;
const h = 300;

// class MeshExample extends React.Component {
//   count = 0;

//   state = {
//     indices: new Uint16Array([
//       0, 3, 4, 0, 1, 4, 1, 2, 4, 2, 4, 5, 3, 4, 6, 4, 6, 7, 4, 7, 8, 4, 5, 8,
//     ]),
//     uvs: new Float32Array([
//       0, 0, 0.5, 0, 1, 0, 0, 0.5, 0.5, 0.5, 1, 0.5, 0, 1, 0.5, 1, 1, 1,
//     ]),
//     vertices: new Float32Array([
//       0,
//       0,
//       w / 2,
//       0,
//       w,
//       0,
//       0,
//       h / 2,
//       w / 2,
//       h / 2,
//       w,
//       h / 2,
//       0,
//       h,
//       w / 2,
//       h,
//       w,
//       h,
//     ]),
//   };

//   componentDidMount() {
//     this.props.app.ticker.add(this.tick);
//   }

//   componentWillUnmount() {
//     this.props.app.ticker.remove(this.tick);
//   }

//   tick = (delta) => {
//     const { app } = this.props;
//     this.count += 0.05 * delta;

//     // update vertices
//     const vertices = new Float32Array(this.state.vertices);
//     vertices[8] = w / 2 + Math.sin(this.count) * 100;
//     vertices[9] = h / 2 + Math.cos(this.count) * 50 - 50;

//     this.setState({ vertices });
//   };

//   render() {
//     const { vertices, uvs, indices } = this.state;

//     return (
//       <PIXI.SimpleMesh
//         image={image}
//         uvs={uvs}
//         vertices={vertices}
//         indices={indices}
//         drawMode={PIXI.DRAW_MODES.TRIANGLES}
//       />
//     );
//   }
// }

// export const MyComponent = () => {
//   const blurFilter = useMemo(() => new BlurFilter(4), []);

//   return (
//     <Stage>
//       <AppConsumer>{(app) => <MeshExample app={app} />}</AppConsumer>

//       <Sprite
//         image="https://pixijs.io/pixi-react/img/bunny.png"
//         x={400}
//         y={270}
//         anchor={{ x: 0.5, y: 0.5 }}
//       />

//       <Container x={400} y={330}>
//         <Text
//           text="Hello World"
//           anchor={{ x: 0.5, y: 0.5 }}
//           filters={[blurFilter]}
//           style={new PIXI.TextStyle({ fill: 'white' })}
//         />
//       </Container>
//     </Stage>
//   );
// };

// function App() {
//   return (
//     <div className="App">
//       <MyComponent />
//     </div>
//   );
// }

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

// const image = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/cake.png';
// const w = 500;
// const h = 300;

const App = () => (
  <Stage
    width={w}
    height={h}
    options={{ autoDensity: true, backgroundColor: 0xeef1f5 }}
  >
    <SimpleMesh
      image={image}
      uvs={state.uvs}
      vertices={state.vertices}
      indices={state.indices}
      drawMode={PIXI.DRAW_MODES.TRIANGLES}
    />

    {/* <AppConsumer>{(app) => <MeshExample app={app} />}</AppConsumer> */}
  </Stage>
);

export default App;
