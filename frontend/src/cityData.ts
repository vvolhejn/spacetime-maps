import { GridData } from "./gridData";

export type CityMetadata = {
  displayName: string;
  maxTimeness: number;
  mode: "car" | "public transport" | "pedestrian";
};

export type City = CityMetadata & {
  mapImage: string;
  data: GridData;
};

export const CITIES: { [key: string]: CityMetadata } = {
  newyork: {
    displayName: "New York City",
    maxTimeness: 0.15,
    mode: "car",
  },
  newyork_transit: {
    displayName: "New York City",
    maxTimeness: 0.15,
    mode: "public transport",
  },
  prague: {
    displayName: "Prague",
    maxTimeness: 0.05,
    mode: "car",
  },
  prague_transit: {
    displayName: "Prague",
    maxTimeness: 0.2,
    mode: "public transport",
  },
  zurich: {
    displayName: "Zürich",
    maxTimeness: 0.1,
    mode: "car",
  },
  zurich_transit: {
    displayName: "Zürich",
    maxTimeness: 0.2,
    mode: "public transport",
  },
  london: {
    displayName: "London",
    maxTimeness: 0.15,
    mode: "car",
  },
  london_transit: {
    displayName: "London",
    maxTimeness: 0.15,
    mode: "public transport",
  },
  london_detail: {
    displayName: "London – detail",
    maxTimeness: 0.03,
    mode: "car",
  },
  london_detail_pedestrian: {
    displayName: "London – detail",
    maxTimeness: 0.3,
    mode: "pedestrian",
  },
  losangeles: {
    displayName: "Los Angeles",
    maxTimeness: 0.3,
    mode: "car",
  },
  cairo: {
    displayName: "Cairo",
    maxTimeness: 0.15,
    mode: "car",
  },
  hongkong: {
    displayName: "Hong Kong",
    maxTimeness: 0.08,
    mode: "car",
  },
  lapaz: {
    displayName: "La Paz",
    maxTimeness: 0.15,
    mode: "car",
  },
  seattle_transit_rushhour: {
    displayName: "Seattle",
    maxTimeness: 0.15,
    mode: "public transport",
  },
  // These are testing maps with low grid size.
  // "prague_debug_transit": {
  //   displayName: "Prague - Transit",
  //   maxTimeness: 0.15,
  // },
  // "prague_debug_drive": {
  //   displayName: "Prague - Drive",
  //   maxTimeness: 0.15,
  // },
  // This is a reproduction of the early versions of the Zurich map.
  // It was used in the YouTube video.
  // zurich_dev: {
  //   displayName: "Zurich (dev)",
  //   maxTimeness: 0.15,
  // },
};

export type CityName = keyof typeof CITIES;

export const DEFAULT_CITY = "newyork";

export const fetchCity = async (cityName: CityName) => {
  return Promise.all([
    import(`./assets/${cityName}/grid_data.json`),
    import(`./assets/${cityName}/map.png`),
  ]).then(([gridData, mapImage]) => {
    return {
      ...CITIES[cityName],
      data: gridData.default as GridData,
      mapImage: mapImage.default as string,
    };
  });
};
