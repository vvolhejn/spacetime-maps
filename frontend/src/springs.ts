import { GridData } from "./gridData";
import { VertexPosition, Point, locationToNormalized } from "./mesh";
import {
  QUADRATIC_PENALTY,
  SPEED_AVERAGING_TYPE,
  STRENGTH_MULTIPLIER,
  USE_RELATIVE_STRENGTH,
} from "./settings";

export type Spring = {
  from: number;
  to: number;
  length: number;
  strength: number;
  isAnchor: boolean;
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
        // Only include each pair once
        entry.originIndex < entry.destinationIndex
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

      const originNormalized = locationToNormalized(origin, gridData);
      const destinationNormalized = locationToNormalized(destination, gridData);
      const normalizedDistance = Math.hypot(
        originNormalized.x - destinationNormalized.x,
        originNormalized.y - destinationNormalized.y
      );

      return {
        ...entry,
        durationSeconds,
        metersPerSecond: sphericalDistanceMeters / durationSeconds,
        sphericalDistanceMeters,
        normalizedDistance,
      };
    });

  let averageSpeed: number;
  if (SPEED_AVERAGING_TYPE === "median") {
    validRoutes.sort((a, b) => a.metersPerSecond - b.metersPerSecond);
    averageSpeed =
      validRoutes[Math.floor(validRoutes.length / 2)].metersPerSecond;
  } else {
    averageSpeed =
      validRoutes.reduce((acc, entry) => acc + entry.metersPerSecond, 0) /
      validRoutes.length;
  }

  const kmh = (averageSpeed * 3.6).toFixed(1);
  console.log(
    `averageSpeed: ${kmh} km/h (averaged using ${SPEED_AVERAGING_TYPE})`
  );

  const res = validRoutes.map((entry) => ({
    from: entry.originIndex,
    to: entry.destinationIndex,
    // If the speed (aerial m)/(road s) is exactly equal to the average, the spring
    // is "happy". If the speed is lower, it wants to expand (the length is larger),
    // and vice versa.
    length: (entry.normalizedDistance * averageSpeed) / entry.metersPerSecond,
    strength: USE_RELATIVE_STRENGTH
      ? STRENGTH_MULTIPLIER / entry.normalizedDistance / nLocations
      : STRENGTH_MULTIPLIER / nLocations,
    isAnchor: false,
  }));
  return res;
};

export const getForce = (
  from: VertexPosition,
  to: VertexPosition,
  springLength: number
): number => {
  const distance = Math.hypot(from.x - to.x, from.y - to.y);
  const delta = distance - springLength;

  let force: number;
  if (QUADRATIC_PENALTY) {
    force = Math.sign(delta) * delta ** 2;
    if (force < 0) {
    }
  } else {
    force = delta;
  }
  // force = Math.min(force, 0);
  return force;
};

const interpolate = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const stepSprings = (
  vertexPositions: VertexPosition[],
  springs: Spring[],
  deltaSeconds: number,
  normalizedHoveredPoint: Point | null,
  timeness: number
): [VertexPosition[], number] => {
  let newVertexPositions = vertexPositions.map((entry, i) => ({
    x: entry.x,
    y: entry.y,
    dx: 0,
    dy: 0,
    pinned: entry.pinned,
  }));

  let loss = 0;

  springs.forEach((spring) => {
    const from = newVertexPositions[spring.from];
    const to = newVertexPositions[spring.to];

    let force = getForce(from, to, spring.length);
    loss += force ** 2;
    force *=
      spring.strength *
      deltaSeconds *
      (spring.isAnchor ? interpolate(1.0, 0.5, timeness) : timeness);

    if (normalizedHoveredPoint !== null) {
      const distanceFromHover = Math.hypot(
        (from.x + to.x) / 2 - normalizedHoveredPoint.x,
        (from.y + to.y) / 2 - normalizedHoveredPoint.y
      );
      const coef = Math.min(10, 1 / (distanceFromHover + 0.01));
      force *= coef;
    }

    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const dx = Math.cos(angle) * force;
    const dy = Math.sin(angle) * force;
    newVertexPositions[spring.from].dx += dx;
    newVertexPositions[spring.from].dy += dy;
    newVertexPositions[spring.to].dx -= dx;
    newVertexPositions[spring.to].dy -= dy;
  });

  return [
    newVertexPositions.map((entry) => ({
      x: entry.pinned ? entry.x : entry.x + entry.dx,
      y: entry.pinned ? entry.y : entry.y + entry.dy,
      pinned: entry.pinned,
    })),
    loss,
  ];
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
