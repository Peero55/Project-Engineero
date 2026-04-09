"""
Generate terrain/environment art using Amazon Nova Canvas via Bedrock.

Usage:
  python scripts/generate-terrain.py --preset dark_forest
  python scripts/generate-terrain.py --prompt "dark enchanted forest" --output apps/web/public/assets/environment/dark_forest/dark_forest_day.webp
  python scripts/generate-terrain.py --list-presets
  python scripts/generate-terrain.py --all-presets

Requires: pip install boto3 Pillow
AWS Profile: ppryor14 (or set AWS_PROFILE env var)
"""

import argparse
import base64
import io
import json
import os
import sys

import boto3
from botocore.config import Config
from PIL import Image

MODEL_ID = "amazon.nova-canvas-v1:0"
AWS_PROFILE = os.environ.get("AWS_PROFILE", "ppryor14")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

TERRAIN_PRESETS = {
    "dark_forest": {
        "prompt": (
            "Dark enchanted forest at twilight, ancient gnarled trees with "
            "glowing runes, misty atmosphere, fantasy game environment, "
            "wide panoramic view, 16:9 aspect ratio, painterly digital art "
            "style, moody purple and green lighting"
        ),
        "negative": "text, watermark, UI elements, characters, modern objects, blurry",
    },
    "crystal_cavern": {
        "prompt": (
            "Underground crystal cavern with luminescent crystals, stalactites "
            "dripping with magical energy, deep blue and cyan glow, fantasy "
            "game environment, wide panoramic, 16:9, painterly digital art"
        ),
        "negative": "text, watermark, UI elements, characters, modern objects, blurry",
    },
    "volcanic_forge": {
        "prompt": (
            "Volcanic forge interior with rivers of lava, ancient stone pillars, "
            "embers floating in air, dramatic red and orange lighting, fantasy "
            "game environment, wide panoramic, 16:9, painterly digital art"
        ),
        "negative": "text, watermark, UI elements, characters, modern objects, blurry",
    },
    "frozen_citadel": {
        "prompt": (
            "Frozen ice citadel exterior, massive ice walls with frost patterns, "
            "aurora borealis in sky, cold blue and white palette, fantasy game "
            "environment, wide panoramic, 16:9, painterly digital art"
        ),
        "negative": "text, watermark, UI elements, characters, modern objects, blurry",
    },
    "arcane_library": {
        "prompt": (
            "Ancient arcane library with floating books, magical glowing shelves, "
            "mystical symbols on walls, warm amber and gold lighting, fantasy "
            "game environment, wide panoramic, 16:9, painterly digital art"
        ),
        "negative": "text, watermark, UI elements, characters, modern objects, blurry",
    },
    "shadow_realm": {
        "prompt": (
            "Dark shadow realm with floating obsidian platforms, swirling void "
            "energy, distant purple lightning, ominous atmosphere, fantasy game "
            "environment, wide panoramic, 16:9, painterly digital art"
        ),
        "negative": "text, watermark, UI elements, characters, modern objects, blurry",
    },
}


def generate_image(prompt: str, negative: str = "", width: int = 1280, height: int = 720) -> bytes:
    session = boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)
    bedrock = session.client("bedrock-runtime", config=Config(read_timeout=300))

    body = json.dumps({
        "taskType": "TEXT_IMAGE",
        "textToImageParams": {
            "text": prompt,
            **({"negativeText": negative} if negative else {}),
        },
        "imageGenerationConfig": {
            "numberOfImages": 1,
            "width": width,
            "height": height,
            "quality": "premium",
        },
    })

    print(f"Generating image ({width}x{height})...")
    print(f"Prompt: {prompt[:100]}...")

    response = bedrock.invoke_model(
        body=body, modelId=MODEL_ID, accept="application/json", contentType="application/json"
    )

    result = json.loads(response["body"].read())
    if result.get("error"):
        raise RuntimeError(f"Nova Canvas error: {result['error']}")

    return base64.b64decode(result["images"][0])


def save_image(image_bytes: bytes, output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img = Image.open(io.BytesIO(image_bytes))
    if output_path.endswith(".webp"):
        img.save(output_path, "WEBP", quality=90)
    elif output_path.endswith(".png"):
        img.save(output_path, "PNG")
    else:
        img.save(output_path)
    print(f"Saved: {output_path} ({img.width}x{img.height})")


def main():
    parser = argparse.ArgumentParser(description="Generate terrain art via Nova Canvas")
    parser.add_argument("--prompt", type=str, help="Custom text prompt")
    parser.add_argument("--negative", type=str, default="", help="Negative prompt")
    parser.add_argument("--preset", type=str, choices=list(TERRAIN_PRESETS.keys()))
    parser.add_argument("--output", type=str, help="Output file path")
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--height", type=int, default=720)
    parser.add_argument("--list-presets", action="store_true")
    parser.add_argument("--all-presets", action="store_true")
    args = parser.parse_args()

    if args.list_presets:
        print("Available terrain presets:")
        for name, p in TERRAIN_PRESETS.items():
            print(f"  {name}: {p['prompt'][:80]}...")
        return

    if args.all_presets:
        for name, p in TERRAIN_PRESETS.items():
            out = f"apps/web/public/assets/environment/{name}/{name}_day.webp"
            img = generate_image(p["prompt"], p["negative"], args.width, args.height)
            save_image(img, out)
        print("All presets generated.")
        return

    if args.preset:
        p = TERRAIN_PRESETS[args.preset]
        prompt, negative = p["prompt"], p["negative"]
        output = args.output or f"apps/web/public/assets/environment/{args.preset}/{args.preset}_day.webp"
    elif args.prompt:
        prompt, negative = args.prompt, args.negative
        output = args.output or "apps/web/public/assets/environment/custom/custom_day.webp"
    else:
        parser.print_help()
        sys.exit(1)

    image_bytes = generate_image(prompt, negative, args.width, args.height)
    save_image(image_bytes, output)


if __name__ == "__main__":
    main()
