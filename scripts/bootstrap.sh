#!/bin/bash
# Bootstrap - Install all dependencies for the project

set -e

echo "🚀 Bootstrap Staffing ESN"
echo ""

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required. Current: $(node --version)"
  exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"
echo ""

# Install API dependencies
echo "📦 Installing API dependencies..."
cd api && npm install
cd ..

# Install Frontend dependencies
echo "📦 Installing Frontend dependencies..."
cd frontend && npm install
cd ..

echo ""
echo "✅ Bootstrap complete!"
echo ""
echo "Next steps:"
echo "  1. Configure secrets: cp api/.dev.vars.example api/.dev.vars"
echo "  2. Start dev: npm run dev"
echo ""
