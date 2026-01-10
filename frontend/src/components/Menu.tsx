import { forwardRef, useEffect, useState } from "react";
import { HamburgerMenuIcon } from "./HamburgerMenuIcon";
import { CITIES } from "../cityData";
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
              ? "bg-blue-600 text-white font-medium"
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

export const CitySelector = ({
  cityName,
  setCityName,
  setMenuOpen,
}: {
  cityName: string;
  setCityName: (city: string) => void;
  setMenuOpen: (isOpen: boolean) => void;
}) => {
  const [isDropdownOpen, setDropdownOpen] = useState(true);
  const selectedCity = CITIES[cityName];

  return (
    <div className="w-full">
      <button
        id="dropdownDefaultButton"
        onClick={() => {
          setDropdownOpen(!isDropdownOpen);
        }}
        className={
          "text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none " +
          "font-medium rounded-t-md text-sm px-4 py-2.5 " +
          "inline-flex items-center justify-between w-full transition-all duration-200 " +
          (isDropdownOpen ? "rounded-b-none" : "rounded-b-md")
        }
        type="button"
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-blue-200">City</span>
          <span className="font-semibold">
            {`${selectedCity.displayName} (${selectedCity.mode})`}
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
          {Object.entries(CITIES).map(([curCityName, curCity]) => (
            <DropdownItem
              text={`${curCity.displayName} (${curCity.mode})`}
              onClick={() => setCityName(curCityName)}
              key={curCityName}
              selected={cityName === curCityName}
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
  cityName: string;
  setCityName: (cityName: string) => void;
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
      cityName,
      setCityName,
      viewSettings,
      setViewSettings,
    }: MenuProps,
    ref
  ) => {
    const conditionalStyle = isMenuOpen
      ? ""
      : "translate-y-[calc(100%-3rem)] lg:translate-y-0 ";

    // Reset timeness when city changes
    useEffect(() => {
      setTimeness(0);
    }, [cityName, setTimeness]);

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
                className="bg-blue-300 h-4 absolute right-0"
                style={{ width: `${timeness * 100}%` }}
              ></div>
            </div>
            <span className="text-blue-300">Time</span>
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
            cityName={cityName}
            setCityName={setCityName}
            setMenuOpen={setMenuOpen}
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
