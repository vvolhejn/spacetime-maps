import { Container, Stage } from '@pixi/react';
import { StretchyMap } from './StretchyMap';
import { APP_HEIGHT, APP_WIDTH } from './constants';
import { useEffect, useRef, useState } from 'react';

const w = APP_WIDTH;
const h = APP_HEIGHT;
const DEBUG_PADDING = 50;

const App = () => {
  const [toggledKeys, setToggledKeys] = useState([] as string[]);

  const wrapperDivRef = useRef<HTMLDivElement>(null);

  // Focus the div on mount to receive keyboard events
  useEffect(() => {
    const wrapperDiv = wrapperDivRef.current;
    if (!wrapperDiv) return;
    wrapperDiv.focus();
  });

  const padding = toggledKeys.includes('KeyR') ? DEBUG_PADDING : 0;

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
      style={{
        paddingLeft: DEBUG_PADDING - padding,
        paddingTop: DEBUG_PADDING - padding,
        outline: 'none',
      }}
    >
      <Stage
        width={w + 2 * padding}
        height={h + 2 * padding}
        options={{ autoDensity: true, backgroundColor: 0xeef1f5 }}
      >
        <Container x={padding} y={padding}>
          <StretchyMap toggledKeys={toggledKeys} />
        </Container>
      </Stage>
    </div>
  );
};

export default App;
