import { Stage, SimpleMesh, AppConsumer } from '@pixi/react';
import { StretchyMap } from './StretchyMap';

const w = 500;
const h = 300;

const App = () => (
  <Stage
    width={w}
    height={h}
    options={{ autoDensity: true, backgroundColor: 0xeef1f5 }}
  >
    <StretchyMap />
  </Stage>
);

export default App;
