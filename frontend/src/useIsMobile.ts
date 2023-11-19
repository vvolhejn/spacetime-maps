import { useMediaQuery } from "react-responsive";
import resolveConfig from "tailwindcss/resolveConfig";
import { Config, KeyValuePair } from "tailwindcss/types/config";

import * as tailwindConfig from "../tailwind.config";
import useWindowDimensions from "./windowDimensions";

const fullConfig = resolveConfig(tailwindConfig as unknown as Config);
const breakpoints = fullConfig.theme?.screens as KeyValuePair<string, string>;

/**
 * A hook that determines if the current screen is mobile based on Tailwind breakpoints.
 * Based on https://stackoverflow.com/a/59982143.
 *
 * @param breakpointKey The Tailwind breakpoint key to use ("lg", "md"). Defaults to
 *   "lg".
 * @returns True if the screen is mobile, false otherwise.
 */
export function useIsMobile(breakpointKey = "lg") {
  const breakpoint = breakpoints[breakpointKey];
  const isLg = useMediaQuery({
    query: `(min-width: ${breakpoint})`,
  });
  return !isLg;
}

export const useMapSizePx = () => {
  const isMobile = useIsMobile();
  const { width, height } = useWindowDimensions();
  return isMobile ? Math.max(width, height) : Math.min(width, height);
};
