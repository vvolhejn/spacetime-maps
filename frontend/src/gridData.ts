export type Location = {
  lat: number;
  lng: number;
};

export type NormalizedLocation = {
  x: number;
  y: number;
};

// e.g.
//   {
//   "originIndex": 0,
//   "destinationIndex": 4,
//   "status": {},
//   "distanceMeters": 6542,
//   "duration": "1111s",
//   "condition": "ROUTE_EXISTS"
// }
export type RouteMatrixAPIEntry = {
  originIndex: number;
  destinationIndex: number;
  status: {};
  distanceMeters?: number;
  duration: string;
  condition: string;
};

export type GridData = {
  center: Location;
  zoom: number;
  size: number;
  // The size of the static map in pixels divided by 2.
  // We divide by 2 because the Google Maps API also has a "scale" parameter
  // which we set to 2, and that multiplies the resolution by 2.
  size_pixels?: number;
  locations: {
    raw_location: Location;
    snapped_location: Location;
    grid_x: number;
    grid_y: number;
    snap_result_types: string[];
    snap_result_place_id: string;
  }[];
  route_matrix: RouteMatrixAPIEntry[];
  // grid_data.dense_travel_times[i][j] is the number of seconds to get between
  // locations i and j.
  dense_travel_times?: number[][];
};

/**
 * Get a route matrix from a sparse or dense representation.
 * The dense representation is a 2D array of numbers (distances in seconds) and
 * it might not be available.
 */
export const getRouteMatrix = (gridData: GridData): RouteMatrixAPIEntry[] => {
  // console.log(gridData);
  if (gridData.dense_travel_times) {
    console.log("Using dense route matrix.");
    const nLocations = gridData.locations.length;
    const res: RouteMatrixAPIEntry[] = [];
    for (let i = 0; i < nLocations; i++) {
      for (let j = 0; j < nLocations; j++) {
        if (i === j) {
          continue;
        }
        const duration = gridData.dense_travel_times[i][j];
        if (duration === 0) {
          continue;
        }
        res.push({
          originIndex: i,
          destinationIndex: j,
          status: {}, // unused
          distanceMeters: 0, // unused
          duration: duration + "s",
          condition: "ROUTE_EXISTS",
        });
      }
    }
    return res;
  } else {
    console.log("No dense route matrix available.");
    return gridData.route_matrix;
  }
};
