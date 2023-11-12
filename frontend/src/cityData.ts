import zurichMap from "./assets/map-v8.png";
import zurichData from "./assets/20x20grid-v8.json";
import pragueMap from "./assets/prague-v1.png";
import pragueData from "./assets/prague-v3.json";
import { GridData } from "./gridData";

export type City = {
  displayName: string;
  mapImage: string;
  data: GridData;
  maxTimeness: number;
};

export const CITIES: { [key: string]: City } = {
  prague: {
    displayName: "Prague",
    mapImage: pragueMap,
    data: pragueData,
    maxTimeness: 0.05,
  },
  zurich: {
    displayName: "Zürich",
    mapImage: zurichMap,
    data: zurichData,
    maxTimeness: 1.0,
  },
};

export type CityName = keyof typeof CITIES;

export const DEFAULT_CITY = CITIES["zurich"];
