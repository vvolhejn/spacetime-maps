import argparse
import json
from pathlib import Path

from backend.export import ASSETS_DIR
from backend.grid import get_dense_travel_times


def main(input_file: Path):
    if "/" not in str(input_file):
        input_file = ASSETS_DIR / input_file

    with input_file.open() as f:
        json_data = json.load(f)

    if "dense_travel_times" in json_data:
        print(f"{input_file} already has dense travel times. Overwrite? [y/N]")
        if input() != "y":
            print("Aborting.")
            exit(1)

    travel_times = get_dense_travel_times(json_data["route_matrix"])
    json_data["dense_travel_times"] = travel_times

    with input_file.open("w") as f:
        json.dump(json_data, f)

    print(f"OK, written to {input_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "input_file",
        type=Path,
        help="The input file. If it's a relative path, "
        "it's treated as relative to the frontend assets dir.",
    )
    args = parser.parse_args()
    main(args.input_file)
