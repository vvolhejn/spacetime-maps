import { Container, Stage, Text } from "@pixi/react";
import { SpacetimeMap } from "./SpacetimeMap";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Point } from "./mesh";
import { Menu } from "./Menu";
import { City, DEFAULT_CITY, fetchCity } from "./cityData";
import { useMapSizePx } from "./useIsMobile";
import { useSearchParamsState } from "./useSearchParamsState";
import { ExplanationModal } from "./ExplanationModal";
import { ViewSettings, updateViewSettings } from "./viewSettings";

const clamp = (num: number, min: number, max: number) => {
  return Math.min(Math.max(num, min), max);
};

/**
 * Animate timeness as a sinusoid. Spend a bit of time at 0 timeness
 * ("dip") to give the springs a bit of time to reset.
 */
const getTimenessForAnimation = (totalTime: number) => {
  const SECONDS_TO_SWITCH = 5;
  const DIP = 0.05; // "Dip" below the 0 point
  return clamp(
    Math.sin((totalTime * Math.PI * 2) / SECONDS_TO_SWITCH) * (0.5 + DIP) +
      (0.5 - DIP),
    0,
    1
  );
};

const App = () => {
  const [viewSettings, setViewSettings] = useLocalStorage<ViewSettings>(
    "SpacetimeMap.viewSettings",
    {
      animate: false,
      focusOnHover: false,
      showSpringArrows: false,
      showGridPoints: false,
      showGrid: false,
      showGridNumbers: false,
    }
  );
  const [isPressed, setIsPressed] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [timeness, setTimeness] = useState(0);
  const [cityName, setCityName] = useSearchParamsState("city", DEFAULT_CITY);
  const [city, setCity] = useState<City | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [showExplantion, setShowExplantion] = useState(true);

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
    setTotalTime(totalTime + deltaSeconds);
    if (viewSettings.animate) {
      setTimeness(getTimenessForAnimation(totalTime));
    } else {
      const SECONDS_TO_MAX = 0.2;
      let newTimeness =
        timeness + ((isPressed ? +1 : -1) * deltaSeconds) / SECONDS_TO_MAX;
      newTimeness = clamp(newTimeness, 0, 1);

      if (newTimeness === 1) {
        setShowExplantion(false);
      }

      setTimeness(newTimeness);
    }
  };

  useEffect(() => {
    fetchCity(cityName).then(
      (city) => {
        setCity(city);
      },
      (error) => {
        if (error.toString().includes("Unknown variable dynamic import")) {
          console.error(`City "${cityName}" not found, resetting`);
          setCityName(DEFAULT_CITY);
        } else {
          console.error("Error fetching city data", error);
        }
      }
    );
    // The setCityName dependency is missing, but I get an infinite loop if I add it.
  }, [cityName]);

  return (
    <div>
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          setViewSettings(updateViewSettings(viewSettings, e.code));
        }}
        onPointerDown={(e) => {
          setIsPressed(true);
        }}
        onPointerUp={(e) => {
          setIsPressed(false);
        }}
        onPointerMove={(e) => {
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
        {showExplantion && <ExplanationModal />}
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
          {city === null && (
            <Container>
              <Text
                text="Loading..."
                anchor={0.5}
                x={mapSizePx / 2}
                y={mapSizePx / 2}
              />
            </Container>
          )}
          {!(city === null) && (
            <SpacetimeMap
              viewSettings={viewSettings}
              // This turned out to be confusing from a UX perspective, so let's disable it for now.
              hoveredPoint={hoveredPoint}
              // hoveredPoint={null}
              timeness={timeness}
              city={city}
              onTick={onTick}
            />
          )}
        </Stage>
        {/* Place an invisible div over the canvas to intercept mouse events.
            This fixes drag-to-scroll on not working on mobile. */}
        <div className="absolute top-0 left-0 w-full h-full z-10"></div>
      </div>
      <Menu
        ref={menuRef}
        timeness={timeness}
        setTimeness={setTimeness}
        isMenuOpen={isMenuOpen}
        setMenuOpen={setMenuOpen}
        cityName={cityName}
        setCityName={setCityName}
      />
    </div>
  );
};

export default App;
