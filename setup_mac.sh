#!/usr/bin/env bash
# ==============================================================================
# LifeTrail - macOS Environment Setup Script
# Installs backend virtual environment & Python dependencies, seeds database,
# and installs frontend npm packages without launching the server.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================================="
echo "  🛠️ LifeTrail - macOS One-Time Setup Script                     "
echo "================================================================="

# Check python3 and node
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed. Run: brew install python"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Run: brew install node"
    exit 1
fi

echo "1. Creating Python virtual environment in backend/venv..."
python3 -m venv "$SCRIPT_DIR/backend/venv"
source "$SCRIPT_DIR/backend/venv/bin/activate"

echo "2. Installing Python requirements..."
pip install --upgrade pip
pip install -r "$SCRIPT_DIR/backend/requirements.txt"

echo "3. Seeding database & running initial spatiotemporal mining pipeline..."
cd "$SCRIPT_DIR/backend"
python3 seed_data.py

echo "4. Installing frontend Node dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install

echo ""
echo "================================================================="
echo "  ✅ Setup completed successfully!"
echo "  You can now start LifeTrail anytime on macOS by running:"
echo "     ./run_mac.sh"
echo "================================================================="
