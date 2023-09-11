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
  distanceMeters: number;
  duration: string;
  condition: string;
};

export type GridData = {
  center: Location;
  zoom: number;
  size: number;
  locations: {
    raw_location: Location;
    snapped_location: Location;
    grid_x: number;
    grid_y: number;
    snap_result_types: string[];
    snap_result_place_id: string;
  }[];
  route_matrix: RouteMatrixAPIEntry[];
};
