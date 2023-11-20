from contextlib import contextmanager
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import argparse

from backend import gmaps
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
    preview: bool = True,
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
        center, zoom=zoom, size=grid_size, snap_to_roads=True, size_pixels=size_pixels
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


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-name", type=str, required=True)
    parser.add_argument("--center", nargs=2, type=float, required=True)
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
    args = parser.parse_args()

    main(
        output_name=args.output_name,
        center=Location(lat=args.center[0], lng=args.center[1]),
        zoom=args.zoom,
        grid_size=args.grid_size,
        max_normalized_distance=args.max_normalized_distance,
        preview=not args.no_preview,
    )
