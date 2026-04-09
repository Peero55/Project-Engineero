"""
Generate a battle background image using Nova Canvas via the nova.amazon.com playground.

Uses Nova Act to automate the web-based image generation UI, enter a prompt,
generate the image, and download it to the project assets folder.

Usage:
  export NOVA_ACT_API_KEY="your_key"
  source nova-act/.venv/bin/activate
  python nova-act/workflows/generate_background.py
"""

import os
import time
import glob
import shutil
from pathlib import Path
from nova_act import NovaAct

# Load .env file from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
env_file = PROJECT_ROOT / ".env"
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and value and key not in os.environ:
                    os.environ[key] = value

# Map NOVA_API_KEY -> NOVA_ACT_API_KEY if needed
if "NOVA_ACT_API_KEY" not in os.environ and "NOVA_API_KEY" in os.environ:
    os.environ["NOVA_ACT_API_KEY"] = os.environ["NOVA_API_KEY"]
ASSETS_DIR = PROJECT_ROOT / "apps" / "web" / "public" / "assets"
ENV_DIR = ASSETS_DIR / "environment"

# Where browser downloads go (macOS default)
DOWNLOADS_DIR = Path.home() / "Downloads"

PROMPT = (
    "Dark fantasy forest battlefield scene, wide 16:9 landscape composition, "
    "ancient twisted trees with glowing blue-white runes carved into bark, "
    "misty ground fog with faint golden particles floating upward, "
    "deep navy and midnight blue sky with subtle aurora-like streaks, "
    "stone ruins overgrown with luminescent moss in the midground, "
    "dramatic volumetric lighting from a single moon source upper left, "
    "painterly digital art style, cinematic depth of field, "
    "no characters no text no UI elements, "
    "game environment concept art, high detail, atmospheric"
)

NEGATIVE_PROMPT = (
    "text, watermark, signature, UI elements, characters, people, "
    "blurry, low quality, cartoon, anime, bright daylight, modern buildings"
)


def find_latest_download(before_files: set[str], timeout: int = 120) -> str | None:
    """Poll Downloads folder for a new image file."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        current = set(glob.glob(str(DOWNLOADS_DIR / "*.png")))
        current |= set(glob.glob(str(DOWNLOADS_DIR / "*.jpg")))
        current |= set(glob.glob(str(DOWNLOADS_DIR / "*.webp")))
        new_files = current - before_files
        if new_files:
            return max(new_files, key=os.path.getmtime)
        time.sleep(2)
    return None


def main():
    # Snapshot current downloads to detect new files
    before = set(glob.glob(str(DOWNLOADS_DIR / "*.png")))
    before |= set(glob.glob(str(DOWNLOADS_DIR / "*.jpg")))
    before |= set(glob.glob(str(DOWNLOADS_DIR / "*.webp")))

    print("Starting Nova Act session...")
    print(f"Prompt: {PROMPT[:80]}...")
    print()
    print("NOTE: Close any open Chrome windows first — Nova Act needs exclusive access")
    print("      to your Chrome profile to reuse your login session.")
    print()

    chrome_user_data = str(Path.home() / "Library" / "Application Support" / "Google" / "Chrome")

    nova = NovaAct(
        starting_page="https://nova.amazon.com",
        headless=False,
        tty=False,
        user_data_dir=chrome_user_data,
    )
    nova.start()

    # Navigate to the Canvas / image generation section
    print("Navigating to image generation...")
    nova.act("Look for and click on 'Canvas' or 'Image generation' or any option to generate images")
    time.sleep(3)

    # Enter the prompt
    print("Entering prompt...")
    nova.act(
        f"Find the text input or prompt field for image generation. "
        f"Clear any existing text and type this prompt: {PROMPT}"
    )
    time.sleep(2)

    # Try to set negative prompt if the UI supports it
    print("Setting negative prompt...")
    nova.act(
        f"If there is a negative prompt field or an option to add a negative prompt, "
        f"click it and enter: {NEGATIVE_PROMPT}. "
        f"If there is no negative prompt option, skip this step."
    )
    time.sleep(1)

    # Try to set 16:9 aspect ratio
    print("Setting aspect ratio...")
    nova.act(
        "If there is an aspect ratio or size option, select 16:9 or landscape or widescreen. "
        "If there is a width/height option, set width to 1280 and height to 720. "
        "If no size options are visible, skip this step."
    )
    time.sleep(1)

    # Generate the image
    print("Generating image...")
    nova.act("Click the Generate button or Submit button to create the image")

    # Wait for generation
    print("Waiting for image generation (this may take 15-30 seconds)...")
    time.sleep(30)

    nova.act("Wait until the generated image appears on the page. If there is a loading indicator, wait for it to finish.")
    time.sleep(5)

    # Download the image
    print("Downloading image...")
    nova.act(
        "Download the generated image. Look for a download button, "
        "or right-click the image and select 'Save image as'. "
        "Save it with the default filename."
    )
    time.sleep(5)

    nova.stop()
    print("Nova Act session ended.")

    # Find and move the downloaded file
    print("Looking for downloaded image...")
    downloaded = find_latest_download(before, timeout=30)

    if downloaded:
        target_dir = ENV_DIR / "dark_forest"
        target_dir.mkdir(parents=True, exist_ok=True)
        ext = Path(downloaded).suffix or ".png"
        target_path = target_dir / f"dark_forest_night{ext}"
        shutil.move(downloaded, str(target_path))
        print(f"Image saved to: {target_path.relative_to(PROJECT_ROOT)}")
        print()
        print("Next steps:")
        print("  1. Run the manifest generator to register the new asset")
        print("  2. The asset key will be: environment:dark_forest:night")
    else:
        print("Could not detect a downloaded image.")
        print("Check your Downloads folder manually and move the image to:")
        print(f"  {ENV_DIR / 'dark_forest' / 'dark_forest_night.png'}")


if __name__ == "__main__":
    main()
