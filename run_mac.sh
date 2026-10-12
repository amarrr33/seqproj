#!/usr/bin/env bash
# ==============================================================================
# LifeTrail - macOS Runner Script
# Launches both FastAPI Backend and Vite React Frontend concurrently.
# ==============================================================================

set -e

# Determine project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================================="
echo "  🚀 Starting LifeTrail: Human Mobility Intelligence Platform   "
echo "  Target OS: macOS (Apple Silicon / Intel)                      "
echo "================================================================="

# 1. Verify Prerequisites
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed or not in your PATH."
    echo "   On macOS, install via Homebrew:  brew install python"
    echo "   Or download from: https://www.python.org/downloads/"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in your PATH."
    echo "   On macOS, install via Homebrew:  brew install node"
    echo "   Or download from: https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed."
    exit 1
fi

echo "✓ Found $(python3 --version)"
echo "✓ Found Node $(node -v) & npm $(npm -v)"

# 2. Setup Python Virtual Environment (macOS PEP 668 compliance)
VENV_DIR="$SCRIPT_DIR/backend/venv"
if [ ! -d "$VENV_DIR" ]; then
    echo ""
    echo "==> Creating Python virtual environment in backend/venv..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# 3. Check and install backend dependencies
echo ""
echo "==> Verifying Python dependencies..."
pip install --upgrade pip --quiet
pip install -r "$SCRIPT_DIR/backend/requirements.txt" --quiet
echo "✓ Python dependencies ready."

# 4. Check database initialization
DB_PATH="$SCRIPT_DIR/backend/lifetrail.db"
if [ ! -f "$DB_PATH" ]; then
    echo ""
    echo "==> lifetrail.db not found. Initializing GeoLife ETL & Mining pipeline..."
    cd "$SCRIPT_DIR/backend"
    python3 seed_data.py
    echo "✓ Database seeded successfully."
fi

# 5. Check frontend dependencies
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo ""
    echo "==> Installing Node dependencies (npm install)..."
    npm install
fi
echo "✓ Frontend dependencies ready."

# 6. Trap signals for graceful shutdown of both servers
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    trap - SIGINT SIGTERM EXIT
    echo ""
    echo "================================================================="
    echo "🛑 Shutting down LifeTrail services..."
    if [ -n "$BACKEND_PID" ]; then
        pkill -P "$BACKEND_PID" 2>/dev/null || true
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        pkill -P "$FRONTEND_PID" 2>/dev/null || true
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo "✓ All processes terminated."
    echo "================================================================="
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 7. Start Backend
echo ""
echo "==> Starting FastAPI backend on http://127.0.0.1:8000..."
cd "$SCRIPT_DIR/backend"
python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Brief pause for backend startup
sleep 2

# 8. Start Frontend
echo "==> Starting Vite React frontend on http://localhost:3000..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================================================="
echo "  🎉 LifeTrail is running successfully!"
echo ""
echo "  📱 Web Application:   http://localhost:3000"
echo "  📚 API Documentation: http://127.0.0.1:8000/docs"
echo ""
echo "  Press Ctrl+C in this terminal to stop both servers."
echo "================================================================="
echo ""

# Keep running and wait for background processes
wait
