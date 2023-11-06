import { Container, Stage } from "@pixi/react";
import { SpacetimeMap } from "./SpacetimeMap";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Point } from "./mesh";
import useWindowDimensions from "./windowDimensions";

const DEBUG_PADDING = 50;

const App = () => {
  const [toggledKeys, setToggledKeys] = useLocalStorage(
    "SpacetimeMap.toggledKeys",
    [] as string[]
  );
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [timeness, setTimeness] = useState(0);

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
        style={{
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
                x: e.global.x,
                y: e.global.y,
              });
            }}
            pointerout={() => {
              setHoveredPoint(null);
            }}
            interactive={true}
          >
            <SpacetimeMap
              toggledKeys={toggledKeys}
              hoveredPoint={hoveredPoint}
              timeness={timeness}
            />
          </Container>
        </Stage>
      </div>

      <div
        className={
          "absolute bottom-0 right-0 p-3 " +
          "bg-primary text-white " +
          "flex justify-between items-center gap-3 " +
          "text-xl text-right"
        }
      >
        <span>Space</span>

        <input
          id="default-range"
          type="range"
          min="0"
          max="1"
          step="0.1"
          className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer"
          value={timeness}
          onChange={(e) => {
            console.log(e);
            setTimeness(parseFloat(e.target.value));
          }}
        />
        <span>Time</span>

        {/* Commented out for debugging */}
        {/* <div>Map data ©Google</div> */}
      </div>
    </>
  );
};

export default App;
