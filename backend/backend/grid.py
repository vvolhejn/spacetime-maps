from dataclasses import dataclass
import math
from typing import TypedDict
import tqdm.auto as tqdm

from backend.gmaps import get_sparsified_distance_matrix, snap_to_road
from backend.location import Location, NormalizedLocation, get_mercator_scale_factor

STATIC_MAP_SIZE_COEF = 280


@dataclass
class GridLocation:
    raw_location: Location
    snapped_location: Location
    grid_x: int
    grid_y: int
    snap_result_types: list[str] | None
    snap_result_place_id: str | None

    def to_json(self):
        return {
            "raw_location": self.raw_location.to_json(),
            "snapped_location": self.snapped_location.to_json(),
            "grid_x": self.grid_x,
            "grid_y": self.grid_y,
            "snap_result_types": self.snap_result_types,
            "snap_result_place_id": self.snap_result_place_id,
        }


class Grid:
    def __init__(
        self, center: Location, zoom: int, size: int, snap_to_roads: bool = True
    ):
        self.center = center
        self.zoom = zoom
        self.size = size

        self.locations: list[GridLocation] = []
        self.route_matrix: list[dict] | None = None

        raw_grid = make_grid(center, zoom, size)

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
                    snap_result = snap_to_road(location)
                    cur.snapped_location = snap_result["location"]
                    cur.snap_result_types = snap_result["types"]
                    cur.snap_result_place_id = snap_result["place_id"]

                self.locations.append(cur)

    def to_json(self):
        return {
            "center": self.center.to_json(),
            "zoom": self.zoom,
            "size": self.size,
            "locations": [x.to_json() for x in self.locations],
            "route_matrix": self.route_matrix,
        }

    def get_snapped_locations(self) -> list[Location]:
        return [x.snapped_location for x in self.locations]

    def location_to_normalized(self, location: Location) -> NormalizedLocation:
        max_offset_lat = (
            STATIC_MAP_SIZE_COEF
            / 2**self.zoom
            / get_mercator_scale_factor(location.lat)
        )

        max_offset_lng = STATIC_MAP_SIZE_COEF / 2**self.zoom

        x = (location.lng - self.center.lng + max_offset_lng) / (2 * max_offset_lng)
        y = (-location.lat + self.center.lat + max_offset_lat) / (2 * max_offset_lat)
        return NormalizedLocation(x, y)

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

        self.route_matrix = list(
            get_sparsified_distance_matrix(
                self.get_snapped_locations(),
                self.get_snapped_locations(),
                should_include=should_include,
            )
        )


def linspace(a, b, n):
    return [a + (b - a) / (n - 1) * i for i in range(n)]


def make_grid(center: Location, zoom: int, size: int = 5) -> list[list[Location]]:
    """Make a grid of locations around a center location, for plotting on a map."""

    # If place markers on the map returned get_static_map() such that you move
    # from the center by STATIC_MAP_SIZE_COEF (adjusted for zoom and Mercator)
    # in each "diagonal" direction, you will reach the four corners of the map.

    max_offset_lat = (
        STATIC_MAP_SIZE_COEF / (2**zoom) / get_mercator_scale_factor(center.lat)
    )

    max_offset_lng = STATIC_MAP_SIZE_COEF / (2**zoom)

    locations = []
    # Reverse the latitude so that the markers go "top to bottom" (north to south)
    for lat in reversed(
        linspace(center.lat - max_offset_lat, center.lat + max_offset_lat, size)
    ):
        locations_row = []
        for lng in linspace(
            center.lng - max_offset_lng, center.lng + max_offset_lng, size
        ):
            locations_row.append(Location(lat, lng))

        locations.append(locations_row)

    return locations
