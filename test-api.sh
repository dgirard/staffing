#!/bin/bash

echo "🧪 Test de l'API Staffing ESN en local"
echo "======================================"
echo ""

# Health check
echo "1️⃣  Health Check"
curl -s http://localhost:8787/health | jq .
echo ""
echo ""

# Version
echo "2️⃣  Version API"
curl -s http://localhost:8787/ | jq .
echo ""
echo ""

# Register
echo "3️⃣  Register utilisateur"
curl -s -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "email": "demo@example.com",
  "password": "Demo1234!",
  "nom": "Dupont",
  "prenom": "Jean",
  "role": "consultant"
}
EOF
echo ""
echo ""

# Login
echo "4️⃣  Login"
RESPONSE=$(curl -s -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "email": "demo@example.com",
  "password": "Demo1234!"
}
EOF
)

echo "$RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$RESPONSE" | jq -r '.data.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Login échoué, pas de token"
  exit 1
fi

echo ""
echo "✅ Token obtenu: ${TOKEN:0:50}..."
echo ""
echo ""

# Me
echo "5️⃣  Info utilisateur (/auth/me)"
curl -s http://localhost:8787/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""
echo ""

# MCP Tools
echo "6️⃣  Liste MCP Tools"
curl -s http://localhost:8787/mcp/tools \
  -H "Authorization: Bearer $TOKEN" | jq '.tools[] | {name, description}'
echo ""
echo ""

echo "✅ Tests terminés avec succès !"
