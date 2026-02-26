#!/bin/bash
echo "==================================="
echo "  Volunteer Hub - Starting..."
echo "==================================="

# Navigate to project directory
cd "$(dirname "$0")"

# Check if frontend build exists
if [ ! -d "frontend/build" ]; then
    echo "Building React frontend..."
    cd frontend
    npm install
    DISABLE_ESLINT_PLUGIN=true npm run build
    cd ..
fi

# Start the backend (serves both API and frontend)
echo ""
echo "Starting server..."
echo "Open http://localhost:5000 in your browser"
echo "Press Ctrl+C to stop"
echo ""

cd backend
python3 app.py
