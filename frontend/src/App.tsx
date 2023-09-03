import { Stage } from '@pixi/react';
import { StretchyMap } from './StretchyMap';
import { APP_HEIGHT, APP_WIDTH } from './constants';
import { useEffect, useRef, useState } from 'react';

const w = APP_WIDTH;
const h = APP_HEIGHT;

const App = () => {
  const [toggledKeys, setToggledKeys] = useState([] as string[]);

  const wrapperDivRef = useRef<HTMLDivElement>(null);

  // Focus the div on mount to receive keyboard events
  useEffect(() => {
    const wrapperDiv = wrapperDivRef.current;
    if (!wrapperDiv) return;
    wrapperDiv.focus();
  });

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if (toggledKeys.includes(e.code)) {
          setToggledKeys(toggledKeys.filter((k) => k !== e.code));
        } else {
          setToggledKeys([...toggledKeys, e.code]);
        }
        console.log(toggledKeys);
      }}
      ref={wrapperDivRef}
    >
      <Stage
        width={w}
        height={h}
        options={{ autoDensity: true, backgroundColor: 0xeef1f5 }}
      >
        <StretchyMap toggledKeys={toggledKeys} />
      </Stage>
    </div>
  );
};

export default App;
