import { Stage, SimpleMesh, AppConsumer } from '@pixi/react';
import { StretchyMap } from './StretchyMap';
import { APP_HEIGHT, APP_WIDTH } from './constants';
import { useRef, useState } from 'react';

const w = APP_WIDTH;
const h = APP_HEIGHT;

const App = () => {
  const [nClicks, setNClicks] = useState(0);
  return (
    <div
      tabIndex={-1}
      onClick={(e) => {
        setNClicks(nClicks + 1);
      }}
    >
      <Stage
        width={w}
        height={h}
        options={{ autoDensity: true, backgroundColor: 0xeef1f5 }}
      >
        <StretchyMap nClicks={nClicks} />
      </Stage>
    </div>
  );
};

export default App;
