import math

from pydantic import BaseModel
import numpy as np


class Location(BaseModel):
    lat: float
    lng: float

    def __str__(self) -> str:
        # This is the format that the Google Maps API expects in URLs
        return f"{self.lat},{self.lng}"

    def with_offset(self, lat: float, lng: float):
        return Location(lat=self.lat + lat, lng=self.lng + lng)

    def to_route_matrix_location(self):
        """Serialize to a JSON that we can pass to the Google Maps Routes API."""
        return {
            "waypoint": {
                "location": {"latLng": {"latitude": self.lat, "longitude": self.lng}}
            }
        }

    def interpolate(self, other: "Location", fraction: float) -> "Location":
        """Interpolate between two locations.

        Args:
            other: The other location to interpolate to.
            fraction: How far along the line to interpolate. 0 is self, 1 is other.
                Can be outside the range [0, 1] to extrapolate.
        """
        return Location(
            lat=self.lat + fraction * (other.lat - self.lat),
            lng=self.lng + fraction * (other.lng - self.lng),
        )

    def __repr__(self) -> str:
        return f"<{self.lat:.5f}, {self.lng:.5f}>"


class NormalizedLocation(BaseModel):
    x: float
    y: float


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


def spherical_distance(location1: Location, location2: Location) -> float:
    # https://en.wikipedia.org/wiki/Haversine_formula
    # Convert latitude and longitude from degrees to radians
    lat1, lng1, lat2, lng2 = np.radians(
        [location1.lat, location1.lng, location2.lat, location2.lng]
    )

    # Radius of the Earth in meters
    radius = 6371.0 * 1000  # Earth's mean radius

    # Haversine formula
    dlng = lng2 - lng1
    dlat = lat2 - lat1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlng / 2) ** 2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    distance = radius * c

    return distance


class Polyline(BaseModel):
    points: list[Location]

    def total_length(self) -> float:
        total = 0
        for i in range(len(self.points) - 1):
            total += spherical_distance(self.points[i], self.points[i + 1])
        return total

    def get_point_at_fraction(self, fraction: float) -> Location:
        """
        Args:
            fraction: How far along the polyline, from 0 to 1
        """
        assert 0 <= fraction <= 1
        total_length = self.total_length()
        target_length = fraction * total_length
        current_length = 0
        for i in range(len(self.points) - 1):
            segment_length = spherical_distance(self.points[i], self.points[i + 1])
            if current_length + segment_length >= target_length:
                remaining_length = target_length - current_length
                fraction_along_segment = remaining_length / segment_length
                return Location(
                    lat=self.points[i].lat
                    + fraction_along_segment
                    * (self.points[i + 1].lat - self.points[i].lat),
                    lng=self.points[i].lng
                    + fraction_along_segment
                    * (self.points[i + 1].lng - self.points[i].lng),
                )
            current_length += segment_length
        return self.points[-1]

    @staticmethod
    def from_route_response(route_response: dict) -> "Polyline":
        polyline = route_response["polyline"]["geoJsonLinestring"]["coordinates"]
        return Polyline(points=[Location(lat=lat, lng=lng) for lng, lat in polyline])
