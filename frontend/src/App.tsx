import { Container, Stage } from "@pixi/react";
import { StretchyMap } from "./StretchyMap";
import { APP_HEIGHT, APP_WIDTH } from "./constants";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Point } from "./mesh";
import useWindowDimensions from "./windowDimensions";

const w = APP_WIDTH;
const h = APP_HEIGHT;
const DEBUG_PADDING = 50;

const App = () => {
  const [toggledKeys, setToggledKeys] = useLocalStorage(
    "stretchyMap.toggledKeys",
    [] as string[]
  );
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);

  const wrapperDivRef = useRef<HTMLDivElement>(null);

  // Focus the div on mount to receive keyboard events
  useEffect(() => {
    const wrapperDiv = wrapperDivRef.current;
    if (!wrapperDiv) return;
    wrapperDiv.focus();
  });

  const { width, height } = useWindowDimensions();

  const padding = toggledKeys.includes("KeyE") ? DEBUG_PADDING : 0;

  return (
    <>
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          if (toggledKeys.includes(e.code)) {
            setToggledKeys(toggledKeys.filter((k) => k !== e.code));
          } else {
            setToggledKeys([...toggledKeys, e.code]);
          }
        }}
        ref={wrapperDivRef}
        style={{
          // paddingLeft: DEBUG_PADDING - padding,
          // paddingTop: DEBUG_PADDING - padding,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "absolute",
          zIndex: -1,
        }}
      >
        <Stage
          width={width}
          height={height}
          options={{
            autoDensity: true,
            backgroundColor: 0xeef1f5,
          }}
        >
          <Container
            x={padding}
            y={padding}
            pointermove={(e) => {
              setHoveredPoint({
                x: (e.global.x - padding) / w,
                y: (e.global.y - padding) / h,
              });
            }}
            pointerout={() => {
              setHoveredPoint(null);
            }}
            interactive={true}
          >
            <StretchyMap
              toggledKeys={toggledKeys}
              hoveredPoint={hoveredPoint}
            />
          </Container>
        </Stage>
      </div>
      <div>Stretchy map</div>
    </>
  );
};

export default App;
