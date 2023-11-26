import { forwardRef, useEffect, useState } from "react";
import { HamburgerMenuIcon } from "./HamburgerMenuIcon";
import { CITIES } from "./cityData";

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
  const conditionalStyle = selected ? "bg-gray-600" : "";
  return (
    <li>
      <button
        className={
          `block px-4 py-2 hover:bg-gray-500 w-full ${conditionalStyle}` +
          " plausible-event-name=City+switch"
        }
        onClick={() => {
          onClick();
          setMenuOpen(false);
        }}
      >
        {text}
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

  return (
    <div className="w-full">
      <button
        id="dropdownDefaultButton"
        onClick={() => {
          setDropdownOpen(!isDropdownOpen);
        }}
        className={
          "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-800 focus:outline-none " +
          " focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center " +
          " inline-flex items-center w-full"
        }
        type="button"
      >
        City{" "}
        <svg
          className="w-2.5 h-2.5 ms-3"
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
      </button>

      <div
        id="dropdown"
        className={
          "z-10 divide-y divide-gray-100 rounded-lg shadow w-full bg-gray-700 " +
          (isDropdownOpen ? "block" : "hidden")
        }
      >
        <ul
          className="py-2 text-sm text-gray-200"
          aria-labelledby="dropdownDefaultButton"
        >
          {Object.entries(CITIES).map(([curCityName, curCity]) => (
            <DropdownItem
              text={curCity.displayName}
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
    }: MenuProps,
    ref
  ) => {
    const conditionalStyle = isMenuOpen
      ? ""
      : "translate-y-[calc(100%-3rem)] md:translate-y-0 ";

    // Reset timeness when city changes
    useEffect(() => {
      setTimeness(0);
    }, [cityName, setTimeness]);

    return (
      <div
        className={
          "w-full md:w-96 md:h-full " +
          "fixed bottom-0 px-3 " +
          "md:bottom-auto md:top-0 md:right-0 " +
          "bg-primary text-white " +
          "text-xl " +
          "transition " +
          conditionalStyle
        }
        ref={ref}
      >
        {/* Always visible part */}
        <div className="flex justify-between items-center gap-3 ">
          <div className="flex justify-between items-center gap-3 h-[3rem]">
            <span>Space</span>
            <div className="w-60 bg-gray-200 h-4 transition-all duration-300 relative">
              <div
                className="bg-blue-600 h-4 absolute right-0"
                style={{ width: `${timeness * 100}%` }}
              ></div>
            </div>
            <span>Time</span>
          </div>
          <button onClick={() => setMenuOpen(!isMenuOpen)}>
            <HamburgerMenuIcon />
          </button>
        </div>
        {/* Expandable part */}
        <div
          className={"text-white p-4 text-base max-w-md gap-y-2 flex flex-col"}
        >
          <p>
            This is a map that can show <strong>time</strong> instead of space.
            Points that are close but take a long time to travel between get
            pushed away from each other, and vice versa.
          </p>
          <p>
            <a
              href="https://vvolhejn.github.io/2023/11/25/spacetime-map.html"
              className="underline"
            >
              About
            </a>
          </p>
          <CitySelector
            cityName={cityName}
            setCityName={setCityName}
            setMenuOpen={setMenuOpen}
          />
          <p>Map data ©Google</p>
        </div>
      </div>
    );
  }
);
