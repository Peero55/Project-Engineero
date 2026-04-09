"""
Example Nova Act workflow — smoke test for Legendary Hunts.

Navigates to the local dev server landing page and verifies
the title screen renders correctly.

Usage:
  export NOVA_ACT_API_KEY="your_key"
  source nova-act/.venv/bin/activate
  python nova-act/workflows/example.py
"""

import os
from nova_act import NovaAct

# Enable browser debugging for the IDE extension
os.environ["NOVA_ACT_BROWSER_ARGS"] = "--remote-debugging-port=9222"

APP_URL = os.environ.get("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

nova = NovaAct(
    starting_page=APP_URL,
    headless=True,
    tty=False,
)

nova.start()

# Verify the landing page loads and has the expected title
result = nova.act("Check if the page has loaded and contains the text 'Legendary Hunts'")
print(f"Landing page check: {result}")

# Navigate to hunts page
result = nova.act("Click the 'Begin Hunt' button or link")
print(f"Navigation result: {result}")

nova.stop()
print("Done — Nova Act smoke test complete.")
