import math
from typing import Literal, TypedDict
from pydantic import BaseModel
import tqdm.auto as tqdm
import logging

from backend.gmaps import TravelMode, get_sparsified_distance_matrix, snap_to_road
from backend.location import Location, NormalizedLocation, get_mercator_scale_factor

STATIC_MAP_SIZE_COEF = 0.7
MAX_SNAP_NORMALIZED_DISTANCE = 0.05

logger = logging.getLogger(__name__)


class GridLocation(BaseModel):
    raw_location: Location
    snapped_location: Location
    grid_x: int
    grid_y: int
    snap_result_types: list[str] | None
    snap_result_place_id: str | None


class RouteMatrixEntry(TypedDict):
    originIndex: int
    destinationIndex: int
    status: dict
    distanceMeters: int
    duration: str  # e.g. "123s"
    condition: Literal["ROUTE_EXISTS"]


class Grid:
    def __init__(
        self,
        center: Location,
        zoom: int,
        size: int,
        snap_to_roads: bool = True,
        # The pixel size matters for placing the markers on the static map image, because
        # a bigger size_pixels covers a larger area
        size_pixels: int = 400,
        travel_mode: TravelMode = TravelMode.DRIVE,
    ):
        """A grid of locations, possibly with distance information.

        Args:
            center: The center of the grid.
            zoom: The zoom level of the grid.
            size: The number of rows and columns in the grid.
            snap_to_roads: Whether to snap the grid locations to roads.
            size_pixels: The size of the static map image, in pixels.
        """
        self.center = center
        self.zoom = zoom
        self.size = size
        self.size_pixels = size_pixels
        self.travel_mode = travel_mode

        self.locations: list[GridLocation] = []
        self.route_matrix: list[RouteMatrixEntry] | None = None

        raw_grid = make_grid(center, zoom, size, size_pixels)

        for y, row in tqdm.tqdm(
            enumerate(raw_grid),
            total=size,
            desc="Snapping to roads",
            disable=not snap_to_roads,
        ):
            for x, location in enumerate(row):
                cur: GridLocation = GridLocation(
                    raw_location=location,
                    snapped_location=location,
                    grid_x=x,
                    grid_y=y,
                    snap_result_types=None,
                    snap_result_place_id=None,
                )
                if snap_to_roads:
                    try:
                        snap_result = snap_to_road(location)

                        snap_distance = self.get_normalized_distance(
                            location, snap_result["location"]
                        )
                        if snap_distance > MAX_SNAP_NORMALIZED_DISTANCE:
                            logger.warning(
                                f"Snapped location is too far from original ({snap_distance:.3f}), "
                                "skipping: "
                                f"{location}"
                            )
                        else:
                            cur.snapped_location = snap_result["location"]
                            cur.snap_result_types = snap_result["types"]
                            cur.snap_result_place_id = snap_result["place_id"]
                    except ValueError:
                        logger.warning(f"Failed to snap location to road: {location}")
                        # A bit of a hack since it's not actually snapped
                        cur.snapped_location = location

                self.locations.append(cur)

    def to_json(self):
        return {
            "center": self.center.model_dump(mode="json"),
            "zoom": self.zoom,
            "size": self.size,
            "size_pixels": self.size_pixels,
            "travel_mode": self.travel_mode,
            "locations": [x.model_dump(mode="json") for x in self.locations],
            "route_matrix": self.route_matrix,
            "dense_travel_times": get_dense_travel_times(self.route_matrix),
        }

    def get_snapped_locations(self) -> list[Location]:
        return [x.snapped_location for x in self.locations]

    def get_raw_locations(self) -> list[Location]:
        return [x.raw_location for x in self.locations]

    def location_to_normalized(self, location: Location) -> NormalizedLocation:
        max_offset_lat = (
            STATIC_MAP_SIZE_COEF
            * self.size_pixels
            / 2**self.zoom
            / get_mercator_scale_factor(location.lat)
        )

        max_offset_lng = STATIC_MAP_SIZE_COEF * self.size_pixels / 2**self.zoom

        x = (location.lng - self.center.lng + max_offset_lng) / (2 * max_offset_lng)
        y = (-location.lat + self.center.lat + max_offset_lat) / (2 * max_offset_lat)
        return NormalizedLocation(x=x, y=y)

    def compute_sparsified_distance_matrix(
        self, max_normalized_distance: float
    ) -> None:
        """Compute a distance matrix where we only compute distance nearby points.

        Specifically, we measure "normalized distance" - Euclidean distance of the
        points when projected onto the map, normalized to [0, 1] along both axes.
        """

        def should_include(a: Location, b: Location):
            if a == b:
                return False
            a_normalized = self.location_to_normalized(a)
            b_normalized = self.location_to_normalized(b)
            distance = math.hypot(
                a_normalized.x - b_normalized.x, a_normalized.y - b_normalized.y
            )
            return distance < max_normalized_distance

        distance_matrix = list(
            get_sparsified_distance_matrix(
                self.get_snapped_locations(),
                self.get_snapped_locations(),
                should_include=should_include,
                travel_mode=self.travel_mode,
            )
        )
        original_len = len(distance_matrix)
        distance_matrix = [
            entry for entry in distance_matrix if entry["condition"] == "ROUTE_EXISTS"
        ]
        if len(distance_matrix) != original_len:
            logger.info(
                f"Filtered away {original_len - len(distance_matrix)} distance matrix "
                "entries for which routes were not found. "
                f"{len(distance_matrix)} entries remain."
            )

        self.route_matrix = distance_matrix

    def get_normalized_distance(self, a: Location, b: Location) -> float:
        """Get the normalized distance between two locations."""
        a_normalized = self.location_to_normalized(a)
        b_normalized = self.location_to_normalized(b)
        return math.hypot(
            a_normalized.x - b_normalized.x, a_normalized.y - b_normalized.y
        )


def get_dense_travel_times(route_matrix: list[RouteMatrixEntry]):
    """Fills in the sparse route matrix to get a dense matrix of travel times."""
    n_locations = (
        max(max(x["originIndex"], x["destinationIndex"]) for x in route_matrix) + 1
    )
    m = [
        [None if i != j else 0 for j in range(n_locations)] for i in range(n_locations)
    ]
    for route in route_matrix:
        origin = route["originIndex"]
        destination = route["destinationIndex"]
        duration = int(route["duration"][:-1])

        m[origin][destination] = duration
        m[destination][origin] = duration

    # Run the Floyd-Warshall algorithm to fill in the rest of the matrix.
    for k in tqdm.trange(len(m), desc="Computing dense matrix"):
        for i in range(len(m)):
            for j in range(len(m)):
                if m[i][k] is not None and m[k][j] is not None:
                    if m[i][j] is None or m[i][j] > m[i][k] + m[k][j]:
                        m[i][j] = m[i][k] + m[k][j]

    return m


def linspace(a, b, n):
    return [a + (b - a) / (n - 1) * i for i in range(n)]


def get_map_dimensions(
    center: Location, zoom: int, size_pixels: int
) -> tuple[float, float]:
    """Get the (lat, lng) dimensions of the map at a given zoom level."""
    max_offset_lat = (
        STATIC_MAP_SIZE_COEF
        * 2
        * size_pixels
        / (2**zoom)
        / get_mercator_scale_factor(center.lat)
    )

    max_offset_lng = STATIC_MAP_SIZE_COEF * 2 * size_pixels / (2**zoom)

    return max_offset_lat, max_offset_lng


def make_grid(
    center: Location, zoom: int, size: int = 5, size_pixels: int = 400
) -> list[list[Location]]:
    """Make a grid of locations around a center location, for plotting on a map."""

    # If place markers on the map returned get_static_map() such that you move
    # from the center by STATIC_MAP_SIZE_COEF (adjusted for zoom and Mercator)
    # in each "diagonal" direction, you will reach the four corners of the map.

    map_size_lat, map_size_lng = get_map_dimensions(
        center=center, zoom=zoom, size_pixels=size_pixels
    )

    locations = []
    # Reverse the latitude so that the markers go "top to bottom" (north to south)
    for lat in reversed(
        linspace(center.lat - map_size_lat / 2, center.lat + map_size_lat / 2, size)
    ):
        locations_row = []
        for lng in linspace(
            center.lng - map_size_lng / 2, center.lng + map_size_lng / 2, size
        ):
            locations_row.append(Location(lat=lat, lng=lng))

        locations.append(locations_row)

    return locations
