import { Container, Stage } from "@pixi/react";
import { SpacetimeMap } from "./SpacetimeMap";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Point } from "./mesh";
import useWindowDimensions from "./windowDimensions";
import { Menu } from "./Menu";
import { DEFAULT_CITY } from "./cityData";
import { TimenessAnimation } from "./TimenessAnimation";

const DEBUG_PADDING = 50;

const App = () => {
  const [toggledKeys, setToggledKeys] = useLocalStorage(
    "SpacetimeMap.toggledKeys",
    [] as string[]
  );
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [timeness, setTimeness] = useState(0);
  const [city, setCity] = useState(DEFAULT_CITY);

  const { width, height } = useWindowDimensions();

  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const padding = toggledKeys.includes("KeyE") ? DEBUG_PADDING : 0;

  const handleClickOutside = (event: MouseEvent) => {
    if (
      menuRef.current &&
      event.target instanceof Element &&
      !menuRef.current.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
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
          position: "absolute",
          zIndex: -1,
        }}
      >
        <Stage
          width={Math.max(width, height)}
          height={Math.max(width, height)}
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
              city={city}
            />
          </Container>
        </Stage>
      </div>
      <TimenessAnimation setTimeness={setTimeness} city={city} />
      <Menu
        ref={menuRef}
        timeness={timeness}
        setTimeness={setTimeness}
        isMenuOpen={isMenuOpen}
        setMenuOpen={setMenuOpen}
        city={city}
        setCity={setCity}
      />
    </div>
  );
};

export default App;
