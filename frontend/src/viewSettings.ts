export type ViewSettings = {
  animate: boolean;
  focusOnHover: boolean;
  showSpringArrows: boolean;
  showGridPoints: boolean;
  showGrid: boolean;
  showGridNumbers: boolean;
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
    KeyW: "showSpringArrows",
  };
  const setting = keyCodeToSetting[keyCode];
  return setting
    ? { ...viewSettings, [setting]: !viewSettings[setting] }
    : viewSettings;
};
