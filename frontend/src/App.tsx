import { Container, Stage } from "@pixi/react";
import { SpacetimeMap } from "./SpacetimeMap";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Point } from "./mesh";
import { Menu } from "./Menu";
import { DEFAULT_CITY } from "./cityData";
import { TimenessAnimation } from "./TimenessAnimation";
import { useMapSizePx } from "./useIsMobile";

const App = () => {
  const [toggledKeys, setToggledKeys] = useLocalStorage(
    "SpacetimeMap.toggledKeys",
    [] as string[]
  );
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
          />
        </Stage>
        {/* Place an invisible div over the canvas to intercept mouse events.
            This fixes drag-to-scroll on not working on mobile. */}
        <div
          className="absolute top-0 left-0 w-full h-full z-10"
          onContextMenu={(e) => {
            // Prevent the context menu on long-press (mobile) or right-click (desktop)
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
        ></div>
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
