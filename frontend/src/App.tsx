import { Stage } from "@pixi/react";
import { SpacetimeMap } from "./SpacetimeMap";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Point } from "./mesh";
import { Menu } from "./Menu";
import { DEFAULT_CITY } from "./cityData";
import { TimenessAnimation } from "./TimenessAnimation";
import { useMapSizePx } from "./useIsMobile";

const clamp = (num: number, min: number, max: number) => {
  return Math.min(Math.max(num, min), max);
};

const App = () => {
  const [toggledKeys, setToggledKeys] = useLocalStorage(
    "SpacetimeMap.toggledKeys",
    [] as string[]
  );
  const [isPressed, setIsPressed] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [timeness, setTimeness] = useState(0);
  const [city, setCity] = useState(DEFAULT_CITY);

  const mapSizePx = useMapSizePx();

  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const onTick = (deltaSeconds: number) => {
    const SECONDS_TO_MAX = 0.5;
    const newTimeness =
      timeness + ((isPressed ? +1 : -1) * deltaSeconds) / SECONDS_TO_MAX;
    setTimeness(clamp(newTimeness, 0, 1));
  };

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
        onPointerDown={(e) => {
          setIsPressed(true);
        }}
        onPointerUp={(e) => {
          setIsPressed(false);
        }}
        onPointerMove={(e) => {
          console.log("move");
          setHoveredPoint({
            x: e.clientX,
            y: e.clientY,
          });
        }}
        // I'm not sure why, but without these onTouch events, the hovered point doesn't
        // update properly on mobile, or only updates irregularly.
        onTouchStart={(e) => {
          setHoveredPoint({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          });
        }}
        onTouchMove={(e) => {
          setHoveredPoint({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          });
        }}
        onTouchEnd={(e) => {
          setHoveredPoint(null);
          setIsPressed(false);
        }}
        className="absolute -z-10 select-none"
      >
        {/* The <Stage> wrapper must live outside of the SpacetimeMap component
            for useTick() to work. */}
        <Stage
          width={mapSizePx}
          height={mapSizePx}
          options={{
            autoDensity: true,
            backgroundColor: 0xeef1f5,
          }}
        >
          <SpacetimeMap
            toggledKeys={toggledKeys}
            hoveredPoint={hoveredPoint}
            timeness={timeness}
            city={city}
            isPressed={isPressed}
            onTick={onTick}
          />
        </Stage>
        {/* Place an invisible div over the canvas to intercept mouse events.
            This fixes drag-to-scroll on not working on mobile. */}
        <div className="absolute top-0 left-0 w-full h-full z-10"></div>
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
