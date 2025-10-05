#!/bin/bash
# Dev Local - Start API + Frontend in development mode

set -e

echo "🚀 Starting Staffing ESN Development Environment"
echo ""

# Check if .dev.vars exists
if [ ! -f "api/.dev.vars" ]; then
  echo "⚠️  Warning: api/.dev.vars not found"
  echo "Creating from example..."
  if [ -f "api/.dev.vars.example" ]; then
    cp api/.dev.vars.example api/.dev.vars
    echo "✅ Created api/.dev.vars - Please edit it with your secrets"
  else
    echo "❌ api/.dev.vars.example not found"
    echo "Create api/.dev.vars manually with JWT_SECRET and GEMINI_API_KEY"
  fi
  echo ""
fi

# Start API in background
echo "🔧 Starting API on http://localhost:8787..."
cd api
npx wrangler dev --local --port 8787 > ../logs/api.log 2>&1 &
API_PID=$!
cd ..

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
sleep 3

# Check if API is responding
if curl -s http://localhost:8787/health > /dev/null; then
  echo "✅ API ready"
else
  echo "❌ API failed to start. Check logs/api.log"
  kill $API_PID 2>/dev/null || true
  exit 1
fi

# Start Frontend
echo "🎨 Starting Frontend on http://localhost:5173..."
cd frontend
npm run dev

# Cleanup on exit
trap "kill $API_PID 2>/dev/null || true" EXIT
