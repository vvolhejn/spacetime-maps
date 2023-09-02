import { Stage, SimpleMesh, AppConsumer } from '@pixi/react';
import { StretchyMap } from './StretchyMap';
import { APP_HEIGHT, APP_WIDTH } from './constants';

const w = APP_WIDTH;
const h = APP_HEIGHT;

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
