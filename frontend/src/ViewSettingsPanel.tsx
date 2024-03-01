import { ReactNode } from "react";
import { ViewSettings, toggleSetting } from "./viewSettings";

const SettingsButton = ({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) => {
  const colorProps = active
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-gray-600 hover:bg-gray-500";
  return (
    <button
      id="dropdownDefaultButton"
      className={
        colorProps +
        " text-white focus:outline-none " +
        "font-medium rounded-lg text-sm px-4 py-2.5 text-center mx-1"
      }
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const ViewSettingsPanel = ({
  viewSettings,
  setViewSettings,
}: {
  viewSettings: ViewSettings;
  setViewSettings: (viewSettings: ViewSettings) => void;
}) => {
  const toggleViewSetting = (setting: keyof ViewSettings) => {
    setViewSettings(toggleSetting(viewSettings, setting));
  };

  const makeSettingsButton = (setting: keyof ViewSettings, text: string) => {
    return (
      <SettingsButton
        active={viewSettings[setting]}
        onClick={() => {
          toggleViewSetting(setting);
        }}
      >
        {text}
      </SettingsButton>
    );
  };

  return (
    // Negative margin to compensate for the margin on the buttons
    <div className="space-y-2 -mx-1">
      {makeSettingsButton("animate", "Animate")}
      {makeSettingsButton("focusOnHover", "Focus on hover")}
      {makeSettingsButton("showSpringArrows", "Arrows")}
      {makeSettingsButton("showGrid", "Grid")}
    </div>
  );
};
