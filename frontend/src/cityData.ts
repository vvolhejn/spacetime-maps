import { GridData } from "./gridData";

export type CityMetadata = {
  displayName: string;
  maxTimeness: number;
  dir: string;
};

export type City = CityMetadata & {
  mapImage: string;
  data: GridData;
};

export const CITIES: { [key: string]: CityMetadata } = {
  prague: {
    displayName: "Prague",
    maxTimeness: 0.05,
    dir: "prague",
  },
  zurich: {
    displayName: "Zürich",
    maxTimeness: 0.05,
    dir: "zurich",
  },
  london: {
    displayName: "London",
    maxTimeness: 0.15,
    dir: "london",
  },
  newyork: {
    displayName: "New York",
    maxTimeness: 0.15,
    dir: "newyork",
  },
};

export type CityName = keyof typeof CITIES;

export const DEFAULT_CITY = "zurich";

export const fetchCity = async (cityName: CityName) => {
  const cityMetadata = CITIES[cityName];
  return Promise.all([
    import(`./assets/${cityMetadata.dir}/grid_data.json`),
    import(`./assets/${cityMetadata.dir}/map.png`),
  ]).then(([gridData, mapImage]) => {
    return {
      ...cityMetadata,
      data: gridData.default as GridData,
      mapImage: mapImage.default as string,
    };
  });
};
