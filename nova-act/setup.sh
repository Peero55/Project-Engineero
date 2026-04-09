#!/usr/bin/env bash
# Nova Act SDK setup script
# Requires Python 3.10+ and pip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Nova Act SDK Setup ==="

# Check Python version
PYTHON_CMD=""
for cmd in python3.13 python3.12 python3.11 python3.10 python3; do
  if command -v "$cmd" &>/dev/null; then
    version=$("$cmd" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    major=$(echo "$version" | cut -d. -f1)
    minor=$(echo "$version" | cut -d. -f2)
    if [ "$major" -ge 3 ] && [ "$minor" -ge 10 ]; then
      PYTHON_CMD="$cmd"
      break
    fi
  fi
done

if [ -z "$PYTHON_CMD" ]; then
  echo "ERROR: Python 3.10+ is required but not found."
  echo ""
  echo "Install with Homebrew:"
  echo "  brew install python@3.12"
  echo ""
  echo "Then re-run this script."
  exit 1
fi

echo "Using $PYTHON_CMD ($($PYTHON_CMD --version))"

# Create virtual environment
if [ ! -d "$SCRIPT_DIR/.venv" ]; then
  echo "Creating virtual environment..."
  "$PYTHON_CMD" -m venv "$SCRIPT_DIR/.venv"
fi

# Activate and install
source "$SCRIPT_DIR/.venv/bin/activate"
echo "Installing Nova Act SDK..."
pip install --upgrade pip -q
pip install -r "$SCRIPT_DIR/requirements.txt" -q

# Install Playwright browsers (needed for Nova Act)
echo "Installing Playwright browsers..."
python -m playwright install chromium 2>/dev/null || echo "Note: Run 'playwright install chromium' manually if needed."

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Get your API key from https://nova.amazon.com/act"
echo "  2. Export it:  export NOVA_ACT_API_KEY=\"your_key\""
echo "  3. Run a workflow:  source nova-act/.venv/bin/activate && python nova-act/workflows/example.py"
echo ""
echo "Or use the Nova Act IDE extension (search 'Nova Act' in Extensions)."
