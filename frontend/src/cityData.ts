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
    displayName: "Prague",
    maxTimeness: 0.05,
  },
  zurich: {
    displayName: "Zürich",
    maxTimeness: 0.05,
  },
  london: {
    displayName: "London",
    maxTimeness: 0.15,
  },
  newyork: {
    displayName: "New York",
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
