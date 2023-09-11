import { GridData } from "./gridData";
import { MeshState } from "./mesh";

export type Spring = {
  from: number;
  to: number;
  length: number;
  strength: number;
};

export const routeMatrixToSprings = (gridData: GridData): Spring[] => {
  const nLocations =
    gridData.route_matrix.reduce(
      (acc, entry) => Math.max(acc, entry.originIndex, entry.destinationIndex),
      0
    ) + 1;

  const validRoutes = gridData.route_matrix
    .filter(
      (entry) =>
        entry.condition === "ROUTE_EXISTS" &&
        entry.originIndex !== entry.destinationIndex
    )
    .filter((entry) => {
      // For some pairs of locations, the route matrix returns a duration of 0s.
      // I suspect this is because they're close to each other and they resolve into
      // the same location on the road.
      if (entry.duration === "0s") {
        console.error("Invalid duration, skipping: " + JSON.stringify(entry));
        return false;
      } else {
        return true;
      }
    })
    .map((entry) => {
      if (entry.duration[entry.duration.length - 1] !== "s") {
        throw new Error('Invalid duration, expected it to end with "s"');
      }
      const durationSeconds = parseInt(entry.duration.split("s")[0]);
      if (durationSeconds === 0) {
        throw new Error(
          "Invalid duration, expected it to be > 0: " + JSON.stringify(entry)
        );
      }

      const origin = gridData.locations[entry.originIndex].snapped_location;
      const destination =
        gridData.locations[entry.destinationIndex].snapped_location;
      const sphericalDistanceMeters = getSphericalDistance(
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng
      );

      if (sphericalDistanceMeters === 0) {
        throw new Error(
          "Invalid sphericalDistanceMeters, expected it to be > 0: " +
            JSON.stringify(entry)
        );
      }

      return {
        ...entry,
        durationSeconds,
        metersPerSecond: sphericalDistanceMeters / durationSeconds,
        sphericalDistanceMeters,
      };
    });

  const averageSpeed =
    validRoutes.reduce((acc, entry) => acc + entry.metersPerSecond, 0) /
    validRoutes.length;

  const kmh = (averageSpeed * 3.6).toFixed(1);
  console.log(`averageSpeed: ${kmh} km/h`);

  const res = validRoutes.map((entry) => ({
    from: entry.originIndex,
    to: entry.destinationIndex,
    length: averageSpeed / entry.metersPerSecond,
    strength: 0.1 / nLocations,
  }));
  return res;
};

export const stepSprings = (
  meshState: MeshState,
  springs: Spring[],
  deltaSeconds: number
): MeshState => {
  let newMeshState = meshState.map((entry, i) => ({
    x: entry.x,
    y: entry.y,
    dx: 0,
    dy: 0,
    pinned: entry.pinned,
  }));

  springs.forEach((spring) => {
    const from = newMeshState[spring.from];
    const to = newMeshState[spring.to];
    const distance = Math.sqrt(
      (from.x - to.x) * (from.x - to.x) + (from.y - to.y) * (from.y - to.y)
    );
    const force = (distance - spring.length) * spring.strength * deltaSeconds;

    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const dx = Math.cos(angle) * force;
    const dy = Math.sin(angle) * force;
    newMeshState[spring.from].dx += dx;
    newMeshState[spring.from].dy += dy;
    newMeshState[spring.to].dx -= dx;
    newMeshState[spring.to].dy -= dy;
  });

  return newMeshState.map((entry) => ({
    x: entry.pinned ? entry.x : entry.x + entry.dx,
    y: entry.pinned ? entry.y : entry.y + entry.dy,
    pinned: entry.pinned,
  }));
};

const getSphericalDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  // Convert latitude and longitude from degrees to radians
  const toRadians = (angle: number) => (angle * Math.PI) / 180;
  lat1 = toRadians(lat1);
  lng1 = toRadians(lng1);
  lat2 = toRadians(lat2);
  lng2 = toRadians(lng2);

  // Radius of the Earth in meters
  const radius = 6371.0 * 1000; // Earth's mean radius

  // Haversine formula
  const dlng = lng2 - lng1;
  const dlat = lat2 - lat1;
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = radius * c;

  return distance;
};
