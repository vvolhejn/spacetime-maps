import { forwardRef, useState } from "react";
import { HamburgerMenuIcon } from "./HamburgerMenuIcon";

export type MenuProps = {
  timeness: number;
  setTimeness: (timeness: number) => void;
  isMenuOpen: boolean;
  setMenuOpen: (isMenuOpen: boolean) => void;
};

export const Menu = forwardRef<HTMLDivElement, MenuProps>(
  ({ timeness, setTimeness, isMenuOpen, setMenuOpen }: MenuProps, ref) => {
    const conditionalStyle = isMenuOpen ? "" : "translate-y-[calc(100%-3rem)] ";

    return (
      <div
        className={
          "w-full md:w-auto " +
          "md:left-1/2 md:-translate-x-1/2 " +
          "fixed bottom-0 px-3 " +
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
            <input
              id="default-range"
              type="range"
              min="0"
              max="1"
              step="0.1"
              className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer"
              value={timeness}
              onChange={(e) => {
                setTimeness(parseFloat(e.target.value));
              }}
            />
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
            This is a map that shows time instead of space. Drag the slider
            towards "Time". Places that are close in time – those that one can
            travel quickly between by car – get pulled closer together on the
            map.
          </p>
          <p>Map data ©Google</p>
        </div>
      </div>
    );
  }
);
