from dataclasses import dataclass
from typing import TypedDict
import tqdm.auto as tqdm

from backend.gmaps import snap_to_road
from backend.location import Location, get_mercator_scale_factor


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


def linspace(a, b, n):
    return [a + (b - a) / (n - 1) * i for i in range(n)]


def make_grid(center: Location, zoom: int, size: int = 5) -> list[list[Location]]:
    """Make a grid of locations around a center location, for plotting on a map."""

    # If place markers on the map returned get_static_map() such that you move
    # from the center by STATIC_MAP_SIZE_COEF (adjusted for zoom and Mercator)
    # in each "diagonal" direction, you will reach the four corners of the map.
    STATIC_MAP_SIZE_COEF = 280

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
