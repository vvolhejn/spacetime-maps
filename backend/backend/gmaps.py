import os
import time
from typing import Iterable, TypedDict

import tqdm.auto as tqdm
import requests

from .location import Location


def get_api_key():
    return os.getenv("GMAPS_API_KEY")


def get_static_map(
    center: Location, zoom: int, markers: list[Location] | None = None
) -> bytes:
    if not 0 <= zoom <= 21:
        raise ValueError("Zoom must be between 0 and 21")

    if markers is None:
        markers = []

    params = {
        "center": center,
        "zoom": zoom,
        "size": "400x400",
        "key": get_api_key(),
        "markers": "|" + "|".join(str(x) for x in markers),
        "scale": 2,
    }
    params_s = "&".join([f"{k}={v}" for k, v in params.items()])
    response = requests.get(
        f"https://maps.googleapis.com/maps/api/staticmap?{params_s}"
    )
    response.raise_for_status()

    return response.content


def get_distance_matrix_api_payload(
    origins: list[Location], destinations: list[Location]
):
    return {
        "origins": [l.to_route_matrix_location() for l in origins],
        "destinations": [l.to_route_matrix_location() for l in destinations],
        "travelMode": "DRIVE",
        # Note: TRAFFIC_AWARE and TRAFFIC_AWARE_OPTIMAL are more expensive.
        # TRAFFIC_UNAWARE is the default.
        "routingPreference": "TRAFFIC_UNAWARE",
        # "travelMode": "TRANSIT",
        # 9:00 UTC is 11:00 CEST
        # "departureTime": "2023-09-04T09:00:00Z",
    }


def confirm_if_expensive(origins: list[Location], destinations: list[Location]):
    # Note: 1000 elements = 5 dollars
    # https://developers.google.com/maps/documentation/routes/usage-and-billing#rm-basic
    DOLLARS_PER_ELEMENT = 0.005
    n_entries = len(origins) * len(destinations)
    cost_dollars = n_entries * DOLLARS_PER_ELEMENT
    if cost_dollars >= 1:
        print(
            f"WARNING: You are asking for {n_entries} routes, "
            f"which will cost {cost_dollars}$.\n"
            "Do you want to continue? [y/N]"
        )
        if input().lower() != "y":
            raise RuntimeError("User is broke")


def call_distance_matrix_api(
    origins: list[Location], destinations: list[Location], confirm: bool = True
):
    if confirm:
        confirm_if_expensive(origins, destinations)

    data = get_distance_matrix_api_payload(origins, destinations)

    for attempt in range(3):
        response = requests.post(
            "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
            json=data,
            headers={
                "X-Goog-Api-Key": get_api_key(),
                "X-Goog-FieldMask": "originIndex,destinationIndex,"
                "duration,distanceMeters,status,condition",
            },
        )
        if response.status_code == 429:
            print("Rate limit exceeded, retrying...")
            time.sleep(30)
            continue

        response.raise_for_status()
        return response

    raise RuntimeError("Rate limit exceeded")


def get_distance_matrix(
    origins: list[Location], destinations: list[Location]
) -> Iterable[dict]:
    confirm_if_expensive(origins, destinations)

    ROOT_MAX_ENTRIES = 25
    MAX_ENTRIES = ROOT_MAX_ENTRIES * 2

    if len(origins) * len(destinations) > MAX_ENTRIES:
        for i in tqdm.trange(0, len(origins), ROOT_MAX_ENTRIES):
            for j in range(0, len(destinations), ROOT_MAX_ENTRIES):
                response = call_distance_matrix_api(
                    origins[i : i + ROOT_MAX_ENTRIES],
                    destinations[j : j + ROOT_MAX_ENTRIES],
                    confirm=False,  # Already confirmed above
                )

                # Reindex to match the original indices
                matrix_entries = response.json()
                for entry in matrix_entries:
                    # TODO: Some requests returned entries that didn't have
                    # originIndex or destinationIndex, but I couldn't reproduce.
                    if "originIndex" in entry:
                        entry["originIndex"] += i
                    if "destinationIndex" in entry:
                        entry["destinationIndex"] += j
                yield from matrix_entries
    else:
        response = call_distance_matrix_api(origins, destinations)
        yield from response.json()


class ResolvedLocation(TypedDict):
    location: Location
    place_id: str
    types: list[str]


def snap_to_road(location: Location) -> ResolvedLocation:
    """Resolve a lan/lng pair to a location close to a road using reverse geocoding.

    This is useful for snapping points in unreachable locations, like bodies of water,
    to the closest road.
    """
    response = requests.get(
        f"https://maps.googleapis.com/maps/api/geocode/json?"
        f"latlng={location}&key={get_api_key()}"
    )
    data = response.json()

    if data["status"] != "OK":
        raise ValueError(f"Got non-OK status when resolving {location}. Got: {data}")

    # https://developers.google.com/maps/documentation/geocoding/requests-reverse-geocoding
    # The API returns multiple results - different descriptions for the location, like
    # street, city, country, and a bunch of more complicated ones. Filter to the accurate
    # ones. I also tried "street_address", which sounds like what we'd actually want,
    # but this left multiple markers in the lake.
    result_types = ["route", "point_of_interest"]

    filtered_results = [
        x for x in data["results"] if any(t in x["types"] for t in result_types)
    ]

    if not filtered_results:
        raise ValueError(f"No location found when resolving {location}. Got: {data}")

    resolution = filtered_results[0]

    return {
        "location": Location(
            resolution["geometry"]["location"]["lat"],
            resolution["geometry"]["location"]["lng"],
        ),
        "place_id": resolution["place_id"],
        "types": resolution["types"],
    }
