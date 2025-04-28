from contextlib import contextmanager
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import argparse

from backend import gmaps
from gmaps import TravelTime
from backend.grid import Grid
from backend.location import Location

ASSETS_DIR = Path(__file__).parents[2] / "frontend" / "src" / "assets"


def is_qlmanage_available():
    try:
        subprocess.check_output(["which", "qlmanage"])
        return True
    except subprocess.CalledProcessError:
        return False


@contextmanager
def image_preview(path_to_image: str | Path):
    use_qlmanage = is_qlmanage_available()
    command = ["qlmanage", "-p"] if use_qlmanage else ["open"]

    process = subprocess.Popen(
        command + [str(path_to_image)],
        stderr=subprocess.DEVNULL if use_qlmanage else None,
        stdout=subprocess.DEVNULL if use_qlmanage else None,
    )
    try:
        yield process
    finally:
        process.terminate()
        process.wait()


def save_image_bytes(image: bytes):
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        f.write(image)
        return Path(f.name)


def main(
    output_name: str,
    center: Location,
    zoom: int,
    grid_size: int,
    max_normalized_distance: float,
    preview: bool,
    travel_mode: gmaps.TravelMode,
    departure_time: str | None = None,
):
    output_dir = ASSETS_DIR / output_name

    if output_dir.exists():
        print(f"{output_dir} already exists. Overwrite? [y/N]")
        if input() != "y":
            print("Aborting.")
            exit(1)

    size_pixels = 640

    unmarked_image = gmaps.get_static_map(
        center, zoom, markers=[], size_pixels=size_pixels
    )
    unmarked_image_path = save_image_bytes(unmarked_image)

    if preview:
        with image_preview(unmarked_image_path):
            print(
                "This is the area you selected. "
                "Press Enter to continue to marker placement."
            )
            input()

    grid = Grid(
        center,
        zoom=zoom,
        size=grid_size,
        snap_to_roads=True,
        size_pixels=size_pixels,
        travel_mode=travel_mode,
        departure_time=departure_time,
    )

    if preview:
        marked_image = gmaps.get_static_map(
            center,
            zoom,
            markers=grid.get_snapped_locations(),
            size_pixels=size_pixels,
        )
        marked_image_path = save_image_bytes(marked_image)

        with image_preview(marked_image_path):
            print(
                "This is where the markers will be placed. "
                "Press Enter to continue to route calculation."
            )
            input()

    grid.compute_sparsified_distance_matrix(
        max_normalized_distance=max_normalized_distance
    )

    output_dir.mkdir(exist_ok=True)

    with open(output_dir / "grid_data.json", "w") as f:
        json.dump(grid.to_json(), f)

    shutil.copy(unmarked_image_path, output_dir / "map.png")

    print(f"Exported to {output_dir}")


def float_with_trailing_comma_allowed(s: str) -> float:
    """
    This is useful because the coordinates you copy from Google Maps are like
    "52.520008, 13.404954", and argparse doesn't like the trailing comma.
    """
    if s.endswith(","):
        s = s[:-1]

    try:
        return float(s)
    except ValueError:
        raise argparse.ArgumentTypeError(f"{s} is not a float")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-name", type=str, required=True)
    parser.add_argument(
        "--center", nargs=2, type=float_with_trailing_comma_allowed, required=True
    )
    parser.add_argument("--zoom", type=int, default=14)
    parser.add_argument("--grid-size", type=int, default=19)
    parser.add_argument(
        "--max-normalized-distance",
        type=float,
        default=0.12,
        help="Only compute travel times between points that are "
        "within this distance of each other, if we view the map under a "
        "[0,1]x[0,1] coordinate system. "
        "The other travel times are approximated from the sparse ones "
        "using a all-pairs shortest path algorithm.",
    )
    parser.add_argument(
        "--no-preview",
        action="store_true",
        help="Do not show map preview before generating",
    )
    parser.add_argument(
        "--travel-mode",
        type=gmaps.TravelMode,
        choices=list(gmaps.TravelMode),
        default=gmaps.TravelMode.DRIVE,
    )
    parser.add_argument(
        "--departure-time",
        type=str,
        default="",
        help="The time of departure for the route calculation, fromatted as DAY HH(:MM) AM/PM"
        "e.g. 'Monday 9:00 AM' or 'Friday 3 pm'",
    )
    args = parser.parse_args()

    location = Location(lat=args.center[0], lng=args.center[1])
    travel_time = TravelTime.from_string(args.departure_time, location)

    # If the travel time is valid, build it to a string so 
    # we don't have to recompute it every time
    if travel_time is not None:
        travel_time = travel_time.to_string()

    main(
        output_name=args.output_name,
        center=location,
        zoom=args.zoom,
        grid_size=args.grid_size,
        max_normalized_distance=args.max_normalized_distance,
        preview=not args.no_preview,
        travel_mode=args.travel_mode,
        departure_time=travel_time,
    )
