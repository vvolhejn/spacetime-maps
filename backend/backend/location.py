import math


class Location:
    def __init__(self, lat: float, lng: float):
        self.lat = lat
        self.lng = lng

    def __str__(self) -> str:
        # This is the format that the Google Maps API expects in URLs
        return f"{self.lat},{self.lng}"

    def with_offset(self, lat: float, lng: float):
        return Location(self.lat + lat, self.lng + lng)

    def to_route_matrix_location(self):
        return {
            "waypoint": {
                "location": {"latLng": {"latitude": self.lat, "longitude": self.lng}}
            }
        }

    def __repr__(self) -> str:
        return f"{self.lat:.5f}, {self.lng:.5f}"


def linspace(a, b, n):
    return [a + (b - a) / (n - 1) * i for i in range(n)]


def deg_to_rad(deg):
    return deg / 180 * math.pi


def get_mercator_scale_factor(lat: float):
    # https://en.wikipedia.org/wiki/Mercator_projection#Cylindrical_projections
    # Since the cylinder is tangential to the globe at the equator, the scale
    # factor between globe and cylinder is unity on the equator but nowhere
    # else. In particular since the radius of a parallel, or circle of latitude,
    # is R cos φ, the corresponding parallel on the map must have been stretched
    # by a factor of 1/cos φ.

    # This seems to be *slightly* off for the static maps from GMaps, but it's
    # close enough.
    return 1 / math.cos(deg_to_rad(lat))


def make_grid(center: Location, zoom: int, size: int = 5) -> list[Location]:
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
        for lng in linspace(
            center.lng - max_offset_lng, center.lng + max_offset_lng, size
        ):
            locations.append(Location(lat, lng))

    return locations
