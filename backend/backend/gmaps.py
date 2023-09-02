import os

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
