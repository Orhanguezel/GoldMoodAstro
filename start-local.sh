#!/bin/bash

# GoldMoodAstro — Local Startup Script

echo "🚀 Starting GoldMoodAstro Local Development Environment..."

# Function to stop all background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT

# 1. Start Backend
echo "📡 Starting Backend (Port 8094)..."
bun run dev:backend &

# 2. Start Admin Panel
echo "🖥️ Starting Admin Panel (Port 3094)..."
bun run dev:admin &

# 3. Inform about Mobile
echo "📱 To start Mobile App:"
echo "   cd mobile/app"
echo "   bun run start"
echo ""
echo "✅ All services are starting. Press Ctrl+C to stop everything."

# Wait for background processes
wait
