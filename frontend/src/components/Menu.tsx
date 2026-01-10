import { forwardRef, useEffect, useState } from "react";
import { HamburgerMenuIcon } from "./HamburgerMenuIcon";
import {
  CITY_CONFIGS,
  CityKey,
  TransportMode,
  getAvailableModes,
} from "../cityData";
import { ViewSettingsPanel } from "./ViewSettingsPanel";
import { ViewSettings } from "../viewSettings";
import { ExplanationText } from "./ExplanationText";

export const DropdownItem = ({
  text,
  onClick,
  selected = false,
  setMenuOpen,
}: {
  text: string;
  onClick: () => void;
  selected?: boolean;
  setMenuOpen: (isOpen: boolean) => void;
}) => {
  return (
    <li>
      <button
        className={
          `block px-4 py-2 w-full text-left transition-colors duration-150 ` +
          `${
            selected
              ? "bg-fuchsia-600 text-white font-medium"
              : "hover:bg-gray-600 text-gray-200"
          }` +
          " plausible-event-name=City+switch flex items-center justify-between"
        }
        onClick={() => {
          onClick();
          setMenuOpen(false);
        }}
      >
        <span>{text}</span>
        {selected && CHECKMARK_SVG}
      </button>
    </li>
  );
};

const ModeButton = ({
  mode,
  isSelected,
  onClick,
  isFirst,
  isLast,
}: {
  mode: TransportMode;
  isSelected: boolean;
  onClick: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const modeLabels = {
    car: "Car",
    "public transport": "Transit",
    pedestrian: "Walk",
  };

  const roundedClasses = (() => {
    if (isFirst && isLast) return "rounded-md";
    if (isFirst) return "rounded-l-md";
    if (isLast) return "rounded-r-md";
    return "";
  })();

  return (
    <button
      onClick={onClick}
      className={
        `flex-1 py-2 text-sm font-medium transition-all duration-150 ${roundedClasses} ` +
        (isSelected
          ? "bg-fuchsia-600 text-white"
          : "bg-gray-600 text-gray-200 hover:bg-gray-500")
      }
    >
      {modeLabels[mode]}
    </button>
  );
};

export const ModeSelector = ({
  cityKey,
  selectedMode,
  onModeChange,
}: {
  cityKey: CityKey;
  selectedMode: TransportMode;
  onModeChange: (mode: TransportMode) => void;
}) => {
  const availableModes = getAvailableModes(cityKey);

  if (availableModes.length <= 1) {
    return (
      <div className="w-full">
        <label className="text-xs text-gray-300 mb-1 block">
          Transport mode: {selectedMode}
        </label>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="text-xs text-gray-300 mb-1 block">Transport mode</label>
      <div className="flex">
        {availableModes.map((mode, index) => (
          <ModeButton
            key={mode}
            mode={mode}
            isSelected={mode === selectedMode}
            onClick={() => onModeChange(mode)}
            isFirst={index === 0}
            isLast={index === availableModes.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export const CitySelector = ({
  cityKey,
  onCityChange,
  setMenuOpen,
}: {
  cityKey: CityKey;
  onCityChange: (cityKey: CityKey) => void;
  setMenuOpen: (isOpen: boolean) => void;
}) => {
  const [isDropdownOpen, setDropdownOpen] = useState(true);
  const selectedCity = CITY_CONFIGS[cityKey];

  return (
    <div className="w-full">
      <button
        id="dropdownDefaultButton"
        onClick={() => {
          setDropdownOpen(!isDropdownOpen);
        }}
        className={
          "text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none " +
          "font-medium rounded-t-md text-sm px-4 py-2.5 " +
          "inline-flex items-center justify-between w-full transition-all duration-200 " +
          (isDropdownOpen ? "rounded-b-none" : "rounded-b-md")
        }
        type="button"
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-fuchsia-200">City</span>
          <span className="font-semibold">
            {selectedCity?.displayName || cityKey}
          </span>
        </div>
        <ChevronSVG isOpen={isDropdownOpen} />
      </button>

      <div
        id="dropdown"
        className={
          "z-10 rounded-b-lg shadow-lg w-full bg-gray-700 border border-t-0 border-gray-600 " +
          "transition-all duration-200 overflow-hidden " +
          (isDropdownOpen
            ? "max-h-48 opacity-100"
            : "max-h-0 opacity-0 border-0")
        }
      >
        <ul
          className="overflow-y-auto max-h-48 text-sm"
          aria-labelledby="dropdownDefaultButton"
        >
          {Object.entries(CITY_CONFIGS).map(([key, config]) => (
            <DropdownItem
              text={config.displayName}
              onClick={() => {
                console.log(
                  "DropdownItem onClick, key:",
                  key,
                  "type:",
                  typeof key
                );
                onCityChange(key as CityKey);
              }}
              key={key}
              selected={cityKey === key}
              setMenuOpen={setMenuOpen}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export type MenuProps = {
  timeness: number;
  setTimeness: (timeness: number) => void;
  isMenuOpen: boolean;
  setMenuOpen: (isMenuOpen: boolean) => void;
  cityKey: CityKey;
  mode: TransportMode;
  onCityChange: (cityKey: CityKey, mode: TransportMode) => void;
  viewSettings: ViewSettings;
  setViewSettings: (viewSettings: ViewSettings) => void;
};

export const Menu = forwardRef<HTMLDivElement, MenuProps>(
  (
    {
      timeness,
      setTimeness,
      isMenuOpen,
      setMenuOpen,
      cityKey,
      mode,
      onCityChange,
      viewSettings,
      setViewSettings,
    }: MenuProps,
    ref
  ) => {
    const conditionalStyle = isMenuOpen
      ? ""
      : "translate-y-[calc(100%-3rem)] lg:translate-y-0 ";

    // Reset timeness when city or mode changes
    useEffect(() => {
      setTimeness(0);
    }, [cityKey, mode, setTimeness]);

    const handleCityChange = (newCityKey: CityKey) => {
      const modes = getAvailableModes(newCityKey);
      // Try to keep the current mode if available in the new city, otherwise use the first available mode
      const newMode = modes.includes(mode) ? mode : modes[0];
      onCityChange(newCityKey, newMode);
    };

    const handleModeChange = (newMode: TransportMode) => {
      onCityChange(cityKey, newMode);
    };

    return (
      <div
        className={
          "w-full lg:w-96 lg:h-full " +
          "fixed bottom-0 px-3 " +
          "lg:bottom-auto lg:top-0 lg:right-0 " +
          "bg-primary text-white " +
          "text-xl " +
          "transition " +
          conditionalStyle
        }
        ref={ref}
      >
        {/* Always visible part */}
        <div className="flex justify-between items-center gap-3 ">
          <div className="flex items-center gap-3 h-[3rem] grow">
            <span>Space</span>
            <div className="bg-gray-200 h-4 transition-all duration-300 relative grow">
              <div
                className="bg-fuchsia-400 h-4 absolute right-0"
                style={{ width: `${timeness * 100}%` }}
              ></div>
            </div>
            <span className="text-fuchsia-400">Time</span>
          </div>
          <button
            onClick={() => setMenuOpen(!isMenuOpen)}
            className="lg:hidden"
          >
            <HamburgerMenuIcon />
          </button>
        </div>
        {/* Expandable part */}
        <div
          className={"text-white p-4 text-base max-w-md gap-y-2 flex flex-col"}
        >
          <ExplanationText />
          <p>
            <a
              href="https://www.youtube.com/watch?v=rC2VQ-oyDG0"
              className="underline"
            >
              Check out the video for more details.
            </a>
          </p>
          <ViewSettingsPanel
            viewSettings={viewSettings}
            setViewSettings={setViewSettings}
          />
          <CitySelector
            cityKey={cityKey}
            onCityChange={handleCityChange}
            setMenuOpen={setMenuOpen}
          />
          <ModeSelector
            cityKey={cityKey}
            selectedMode={mode}
            onModeChange={handleModeChange}
          />
          <p>
            By{" "}
            <a href="https://vvolhejn.com/" className="underline">
              Václav Volhejn
            </a>
            . Map data ©Google
          </p>
        </div>
      </div>
    );
  }
);

const CHECKMARK_SVG = (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const ChevronSVG = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={
      "w-4 h-4 transition-transform duration-200 " +
      (isOpen ? "rotate-180" : "rotate-0")
    }
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 10 6"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m1 1 4 4 4-4"
    />
  </svg>
);
