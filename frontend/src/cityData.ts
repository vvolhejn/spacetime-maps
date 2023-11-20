import zurichMap from "./assets/map-v8.png";
import zurichData from "./assets/20x20grid-v8.json";
import pragueMap from "./assets/prague-v1.png";
import pragueData from "./assets/prague-v3.json";
import londonMap from "./assets/london/map.png";
import londonData from "./assets/london/grid_data.json";
import newyorkMap from "./assets/newyork/map.png";
import newyorkData from "./assets/newyork/grid_data.json";
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
    maxTimeness: 0.05,
  },
  london: {
    displayName: "London",
    mapImage: londonMap,
    data: londonData,
    maxTimeness: 0.15,
  },
  newyork: {
    displayName: "New York",
    mapImage: newyorkMap,
    data: newyorkData,
    maxTimeness: 0.15,
  },
};

export type CityName = keyof typeof CITIES;

export const DEFAULT_CITY = CITIES["zurich"];
