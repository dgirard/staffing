#!/bin/bash
# Dev Local with Seed Data

set -e

echo "🌱 Starting with seed data..."

# Create/Reset local DB
cd api
npx wrangler d1 execute staffing-db --local --file=migrations/001_initial.sql 2>/dev/null || echo "DB exists"
npx wrangler d1 execute staffing-db --local --file=migrations/002_seed.sql 2>/dev/null || echo "Seed data loaded"
cd ..

# Start dev environment
./scripts/dev-local.sh
