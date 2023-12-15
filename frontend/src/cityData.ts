import { GridData } from "./gridData";

export type CityMetadata = {
  displayName: string;
  maxTimeness: number;
};

export type City = CityMetadata & {
  mapImage: string;
  data: GridData;
};

export const CITIES: { [key: string]: CityMetadata } = {
  prague: {
    displayName: "Prague (by car)",
    maxTimeness: 0.05,
  },
  prague_transit: {
    displayName: "Prague (by public transport)",
    maxTimeness: 0.2,
  },
  zurich: {
    displayName: "Zürich",
    maxTimeness: 0.05,
  },
  zurich_transit: {
    displayName: "Zürich (by public transport)",
    maxTimeness: 0.2,
  },
  london: {
    displayName: "London",
    maxTimeness: 0.15,
  },
  newyork: {
    displayName: "New York",
    maxTimeness: 0.15,
  },
  newyork_transit: {
    displayName: "New York (by public transport)",
    maxTimeness: 0.15,
  },
  losangeles: {
    displayName: "Los Angeles",
    maxTimeness: 0.3,
  },
  cairo: {
    displayName: "Cairo",
    maxTimeness: 0.15,
  },
  hongkong: {
    displayName: "Hong Kong",
    maxTimeness: 0.08,
  },
  lapaz: {
    displayName: "La Paz",
    maxTimeness: 0.15,
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
