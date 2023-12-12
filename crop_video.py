import argparse
from pathlib import Path
import subprocess


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="path to input video", type=Path)
    parser.add_argument(
        "output",
        help="path to output video. By default, appends '_cropped' to the name.",
        nargs="?",
        type=Path,
    )
    parser.add_argument(
        "--align",
        help="How to align the crop",
        choices=["left", "center", "right"],
        default="right",
    )
    # parser.add_argument("loop", help="loop count")
    args = parser.parse_args()
    output_path = args.output or args.input.with_name(
        args.input.stem + "_cropped" + args.input.suffix
    )

    crop_x_offset = {
        "left": "0",
        "center": "(in_w-ow)/2",
        "right": "(in_w-ow)",
    }[args.align]

    subprocess.run(
        [
            "ffmpeg",
            "-i",
            args.input,
            "-vf",
            f"crop=(9/16)*in_h:in_h:{crop_x_offset}:0, scale=1080:1920",
            output_path,
        ]
    )
