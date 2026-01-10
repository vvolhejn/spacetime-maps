import { GridData } from "./gridData";

export type TransportMode = "car" | "public transport" | "pedestrian";

export type CityMetadata = {
  displayName: string;
  maxTimeness: number;
  mode: TransportMode;
};

export type City = CityMetadata & {
  mapImage: string;
  data: GridData;
};

export type CityConfig = {
  displayName: string;
  modes: {
    [K in TransportMode]?: {
      dataKey: string;
      maxTimeness: number;
    };
  };
};

export const CITY_CONFIGS: { [key: string]: CityConfig } = {
  newyork: {
    displayName: "New York City",
    modes: {
      car: { dataKey: "newyork", maxTimeness: 0.15 },
      "public transport": { dataKey: "newyork_transit", maxTimeness: 0.15 },
    },
  },
  paris: {
    displayName: "Paris",
    modes: {
      car: { dataKey: "paris_car", maxTimeness: 0.1 },
      "public transport": { dataKey: "paris_transit", maxTimeness: 0.15 },
    },
  },
  prague: {
    displayName: "Prague",
    modes: {
      car: { dataKey: "prague", maxTimeness: 0.05 },
      "public transport": { dataKey: "prague_transit", maxTimeness: 0.2 },
    },
  },
  sanfrancisco: {
    displayName: "San Francisco",
    modes: {
      car: { dataKey: "sanfrancisco_car", maxTimeness: 0.1 },
      "public transport": { dataKey: "sanfrancisco_transit", maxTimeness: 0.1 },
    },
  },
  london: {
    displayName: "London",
    modes: {
      car: { dataKey: "london", maxTimeness: 0.15 },
      "public transport": { dataKey: "london_transit", maxTimeness: 0.15 },
    },
  },
  london_detail: {
    displayName: "London – detail",
    modes: {
      car: { dataKey: "london_detail", maxTimeness: 0.03 },
      pedestrian: { dataKey: "london_detail_pedestrian", maxTimeness: 0.3 },
    },
  },
  zurich: {
    displayName: "Zürich",
    modes: {
      car: { dataKey: "zurich", maxTimeness: 0.1 },
      "public transport": { dataKey: "zurich_transit", maxTimeness: 0.2 },
    },
  },
  losangeles: {
    displayName: "Los Angeles",
    modes: {
      car: { dataKey: "losangeles", maxTimeness: 0.3 },
    },
  },
  cairo: {
    displayName: "Cairo",
    modes: {
      car: { dataKey: "cairo", maxTimeness: 0.15 },
    },
  },
  hongkong: {
    displayName: "Hong Kong",
    modes: {
      car: { dataKey: "hongkong", maxTimeness: 0.08 },
    },
  },
  lapaz: {
    displayName: "La Paz",
    modes: {
      car: { dataKey: "lapaz", maxTimeness: 0.15 },
    },
  },
  seattle: {
    displayName: "Seattle",
    modes: {
      "public transport": { dataKey: "seattle_transit_rushhour", maxTimeness: 0.15 },
    },
  },
};

export type CityKey = string;

export const DEFAULT_CITY_KEY = "newyork";
export const DEFAULT_MODE: TransportMode = "car";

export const fetchCity = async (cityKey: CityKey, mode: TransportMode) => {
  const dataKey = getDataKey(cityKey, mode);
  if (!dataKey) {
    throw new Error(`No data available for ${cityKey} with mode ${mode}`);
  }

  return Promise.all([
    import(`./assets/${dataKey}/grid_data.json`),
    import(`./assets/${dataKey}/map.png`),
  ]).then(([gridData, mapImage]) => {
    const metadata = getCityMetadata(cityKey, mode);
    if (!metadata) {
      throw new Error(`No metadata available for ${cityKey} with mode ${mode}`);
    }
    return {
      ...metadata,
      data: gridData.default as GridData,
      mapImage: mapImage.default as string,
    };
  });
};

export const getAvailableModes = (cityKey: CityKey): TransportMode[] => {
  const config = CITY_CONFIGS[cityKey];
  if (!config) return [];
  return Object.keys(config.modes) as TransportMode[];
};

export const getDataKey = (cityKey: CityKey, mode: TransportMode): string | null => {
  const config = CITY_CONFIGS[cityKey];
  if (!config?.modes[mode]) return null;
  return config.modes[mode]!.dataKey;
};

export const getCityMetadata = (cityKey: CityKey, mode: TransportMode): CityMetadata | null => {
  const config = CITY_CONFIGS[cityKey];
  const modeData = config?.modes[mode];
  if (!config || !modeData) return null;
  return {
    displayName: config.displayName,
    maxTimeness: modeData.maxTimeness,
    mode,
  };
};
