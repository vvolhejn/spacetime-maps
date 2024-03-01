export type ViewSettings = {
  animate: boolean;
  focusOnHover: boolean;
  showSpringArrows: boolean;
  showGridPoints: boolean;
  showGrid: boolean;
  showGridNumbers: boolean;
  // Using normalized distance
  showSpringsThreshold: number;
  showSpringsByDistance: boolean;
};

export const toggleSetting = (
  viewSettings: ViewSettings,
  setting: keyof ViewSettings
) => {
  return { ...viewSettings, [setting]: !viewSettings[setting] };
};

export const updateViewSettings = (
  viewSettings: ViewSettings,
  keyCode: string
) => {
  const keyCodeToSetting: { [key: string]: keyof ViewSettings } = {
    KeyA: "animate",
    KeyS: "showGridNumbers",
    KeyD: "showGridPoints",
    KeyF: "showGrid",
    KeyH: "focusOnHover",
    KeyQ: "showSpringsByDistance",
    KeyW: "showSpringArrows",
  };
  const setting = keyCodeToSetting[keyCode];
  return setting ? toggleSetting(viewSettings, setting) : viewSettings;
};
