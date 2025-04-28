from enum import StrEnum
import os
import time
from typing import Callable, Iterable, TypedDict
import logging

import pytz
from datetime import datetime, timedelta, time
from timezonefinder import TimezoneFinder
import tqdm.auto as tqdm
import requests

from location import Location


logger = logging.getLogger(__name__)


class TravelMode(StrEnum):
    DRIVE = "DRIVE"
    TRANSIT = "TRANSIT"
    WALK = "WALK"

# This class represents a day of the week
# and a time of the day. It is used to specify
# the departure time for a transit route.
#
# It can be returned like "yyyy-mm-ddThh:mm:ssZ"
# which is the RFC3339 UTC "Zulu" format.
class TravelTime():
    # 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    day: int
    hour: int
    minute: int
    location: Location | None = None

    def __init__(self, day: int, hour: int, minute: int, location: Location | None = None):
        self.day = day
        self.hour = hour
        self.minute = minute
        self.location = location

    def from_string(time_str: str, location: Location):
        if time_str.strip() == "":
            return None
        
        travel_time = TravelTime(0, 0, 0, location)

        # Something like monday 10am
        
        day, time, am_pm = time_str.split(" ")

        # Convert the day to an integer
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        travel_time.day = days.index(day.lower())
        if travel_time.day == -1:
            raise ValueError(f"Invalid day of the week '{day}'. Please use a valid day of the week.")
        
        am_pm = am_pm.lower()

        if ":" in time:
            hour, minute = time.split(":")
            travel_time.hour = int(hour)
            travel_time.minute = int(minute)
        else:
            travel_time.hour = int(time)

            if am_pm == "pm":
                if travel_time.hour != 12:
                    travel_time.hour += 12 
            elif am_pm == "am":
                if travel_time.hour == 12:
                    travel_time.hour = 0
            else:
                raise ValueError("Invalid time format. Please use HH(:MM) AM/PM")        

        return travel_time            

    def set_location(self, location: Location):
        self.location = location

    # This function takes the location, finds the timezone,
    # and increments the time until the day and time match
    # at that location.
    def to_string(self):
        if self.location is None:
            raise ValueError("No location specified for the travel time.")
        
        # Step 1: Find the timezone at the specified location
        tf = TimezoneFinder()
        timezone_name = tf.timezone_at(lat=self.location.lat, lng=self.location.lng)
        if timezone_name is None:
            raise ValueError("Could not determine the timezone for the location.")
        tz = pytz.timezone(timezone_name)

        # Step 2: Get the current local time at the location
        now_utc = datetime.now(pytz.utc)
        now_local = now_utc.replace(tzinfo=pytz.utc).astimezone(tz)
        current_weekday = now_local.weekday()
        current_time = now_local.time()

        # Step 3: Compute the next occurrence of the specified day and time
        target_weekday = self.day % 7 
        target_time = time(hour=self.hour, minute=self.minute)
        days_ahead = (target_weekday - current_weekday) % 7

        if days_ahead == 0 and target_time <= current_time:
            days_ahead = 7
        
        target_date = now_local.date() + timedelta(days=days_ahead)
        target_datetime_local = tz.localize(datetime.combine(target_date, target_time))

        # Step 4: Convert the local datetime to UTC and format it
        target_datetime_utc = target_datetime_local.astimezone(pytz.utc)
        target_datetime_str = target_datetime_utc.strftime('%Y-%m-%dT%H:%M:%SZ')
        return target_datetime_str

def get_api_key():
    return os.getenv("GMAPS_API_KEY")


def get_static_map(
    center: Location,
    zoom: int,
    markers: list[Location] | None = None,
    size_pixels: int = 400,
    scale: int = 2,
) -> bytes:
    if not 0 <= zoom <= 21:
        raise ValueError("Zoom must be between 0 and 21")

    if size_pixels > 640:
        raise ValueError("Size must be at most 640 (GMaps API limitation)")

    if markers is None:
        markers = []

    params = {
        "center": center,
        "zoom": zoom,
        "size": f"{size_pixels}x{size_pixels}",
        "key": get_api_key(),
        "markers": "|" + "|".join(str(x) for x in markers),
        "scale": scale,
        "style": "feature:poi|visibility:off",
    }
    params_s = "&".join([f"{k}={v}" for k, v in params.items()])
    response = requests.get(
        f"https://maps.googleapis.com/maps/api/staticmap?{params_s}"
    )
    response.raise_for_status()

    return response.content


def get_distance_matrix_api_payload(
    origins: list[Location],
    destinations: list[Location],
    travel_mode: TravelMode = TravelMode.DRIVE,
    departure_time: str | None = None,

):
    payload = {
        "origins": [l.to_route_matrix_location() for l in origins],
        "destinations": [l.to_route_matrix_location() for l in destinations],
        "travelMode": str(travel_mode),
    }

    # If travel_mode is TRANSIT, we can specify a departure time.
    if travel_mode == TravelMode.TRANSIT and departure_time is not None:
        payload["departureTime"] = departure_time

    # routingPreference doesn't apply for travel_mode=TRANSIT.
    if travel_mode == TravelMode.DRIVE:
        # Note: TRAFFIC_AWARE and TRAFFIC_AWARE_OPTIMAL are more expensive.
        # TRAFFIC_UNAWARE is the default.
        payload["routingPreference"] = "TRAFFIC_UNAWARE"

    return payload


def confirm_if_expensive_from_n(n: int):
    # Note: 1000 elements = 5 dollars
    # https://developers.google.com/maps/documentation/routes/usage-and-billing#rm-basic
    DOLLARS_PER_ELEMENT = 0.005
    n_entries = n
    cost_dollars = n_entries * DOLLARS_PER_ELEMENT
    if cost_dollars >= 1:
        print(
            f"WARNING: You are asking for {n_entries} routes, "
            f"which will cost {cost_dollars}$.\n"
            "Do you want to continue? [y/N]"
        )
        if input().lower() != "y":
            raise RuntimeError("User is broke")


def confirm_if_expensive(origins: list[Location], destinations: list[Location]):
    return confirm_if_expensive_from_n(len(origins) * len(destinations))


def call_distance_matrix_api(
    origins: list[Location],
    destinations: list[Location],
    confirm: bool = True,
    travel_mode: TravelMode = TravelMode.DRIVE,
    departure_time: str | None = None,
):
    if confirm:
        confirm_if_expensive(origins, destinations)

    # Note that here we're not checking that the number of matrix elements
    # doesn't exceed the maximum allowed by the API.
    data = get_distance_matrix_api_payload(
        origins, destinations, travel_mode=travel_mode, departure_time=departure_time
    )

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
    origins: list[Location], destinations: list[Location], departure_time: str | None = None
) -> Iterable[dict]:
    confirm_if_expensive(origins, destinations)

    # This ROOT_MAX_ENTRIES assumes travel_mode=DRIVE. For TRANSIT, it's 10.
    ROOT_MAX_ENTRIES = 25
    MAX_ENTRIES = ROOT_MAX_ENTRIES * 2

    if len(origins) * len(destinations) > MAX_ENTRIES:
        for i in tqdm.trange(0, len(origins), ROOT_MAX_ENTRIES):
            for j in range(0, len(destinations), ROOT_MAX_ENTRIES):
                response = call_distance_matrix_api(
                    origins[i : i + ROOT_MAX_ENTRIES],
                    destinations[j : j + ROOT_MAX_ENTRIES],
                    confirm=False,  # Already confirmed above
                    departure_time=departure_time,
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
        response = call_distance_matrix_api(origins, destinations, departure_time=departure_time)
        yield from response.json()


def get_sparsified_distance_matrix(
    origins: list[Location],
    destinations: list[Location],
    should_include: Callable[[Location, Location], bool],
    filter_mirrored: bool = True,
    travel_mode: TravelMode = TravelMode.DRIVE,
    departure_time: str | None = None,
) -> Iterable[dict]:
    """Get a distance matrix, but only for a select subset of location pairs."""
    mask = [
        [should_include(origin, destination) for destination in destinations]
        for origin in origins
    ]

    if filter_mirrored and origins == destinations:
        # For a symmetrical matrix, we only need to compute one triangle.
        for i in range(len(origins)):
            for j in range(i):
                mask[i][j] = False

    n_elements = sum(sum(x) for x in mask)
    confirm_if_expensive_from_n(n_elements)

    if n_elements == 0:
        raise ValueError("No elements to include.")

    logger.info(
        f"Sparsified distance matrix has {n_elements} elements "
        f"down from {len(origins) * len(destinations)}."
    )

    for i_origin, (origin, cur_mask) in tqdm.tqdm(
        enumerate(zip(origins, mask)), total=len(origins), desc="Computing travel times"
    ):
        cur_destinations = [
            destination
            for destination, include in zip(destinations, cur_mask)
            if include
        ]

        if not cur_destinations:
            continue

        reindexing = {}
        for i, include in enumerate(cur_mask):
            if include:
                reindexing[len(reindexing)] = i

        # We're assuming that the number of destinations is small enough that we can
        # send them all in one request. This would break for large grids.
        response = call_distance_matrix_api(
            [origin], cur_destinations, confirm=False, travel_mode=travel_mode, departure_time=departure_time
        )

        matrix_entries = response.json()
        for entry in matrix_entries:
            if "originIndex" in entry:
                assert entry["originIndex"] == 0
                entry["originIndex"] = i_origin
            if "destinationIndex" in entry:
                entry["destinationIndex"] = reindexing[entry["destinationIndex"]]

        yield from matrix_entries


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
    # ones.
    # "street_address" sounds like what you'd want, but it leaves some markers in the lake
    # so give higher priority to "route".
    result_types = ["route", "street_address", "point_of_interest"]

    resolution = None

    for result_type in result_types:
        filtered_results = [x for x in data["results"] if result_type in x["types"]]
        if filtered_results:
            resolution = filtered_results[0]
            break

    if resolution is None:
        raise ValueError(f"No location found when resolving {location}. Got: {data}")

    return {
        "location": Location(
            lat=resolution["geometry"]["location"]["lat"],
            lng=resolution["geometry"]["location"]["lng"],
        ),
        "place_id": resolution["place_id"],
        "types": resolution["types"],
    }
