import math

import numpy as np


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
