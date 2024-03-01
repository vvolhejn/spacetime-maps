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
        default="center",
    )
    parser.add_argument(
        "--n-loops",
        help="How many times to loop the video (default: 1)",
        type=int,
        default=1,
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
        ["ffmpeg"]
        # stream_loop means "repeat this many times in addition to the original"
        # but our semantics are "repeat this many times total"
        + (["-stream_loop", f"{args.n_loops - 1}"] if args.n_loops > 1 else [])
        + [
            "-i",
            args.input,
            "-vf",
            f"crop=(9/16)*in_h:in_h:{crop_x_offset}:0, scale=1080:1920",
            output_path,
        ]
    )
