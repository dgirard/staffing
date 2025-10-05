#!/bin/bash

echo "🧪 Création des utilisateurs de test pour les 4 personas"
echo "========================================================="
echo ""

API_URL="http://localhost:8787"

# 1. Consultant
echo "1️⃣  Création Consultant"
curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "email": "consultant@test.com",
  "password": "Test1234!",
  "nom": "Consultant",
  "prenom": "Jean",
  "role": "consultant"
}
EOF
echo ""
echo ""

# 2. Project Owner
echo "2️⃣  Création Chef de Projet"
curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "email": "owner@test.com",
  "password": "Test1234!",
  "nom": "Dupont",
  "prenom": "Marie",
  "role": "project_owner"
}
EOF
echo ""
echo ""

# 3. Administrator
echo "3️⃣  Création Administrateur"
curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "email": "admin@test.com",
  "password": "Test1234!",
  "nom": "Martin",
  "prenom": "Pierre",
  "role": "administrator"
}
EOF
echo ""
echo ""

# 4. Directeur
echo "4️⃣  Création Directeur"
curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "email": "directeur@test.com",
  "password": "Test1234!",
  "nom": "Bernard",
  "prenom": "Sophie",
  "role": "directeur"
}
EOF
echo ""
echo ""

echo "✅ Utilisateurs de test créés !"
echo ""
echo "Pour vous connecter :"
echo "Consultant : consultant@test.com / Test1234!"
echo "Chef de Projet : owner@test.com / Test1234!"
echo "Administrateur : admin@test.com / Test1234!"
echo "Directeur : directeur@test.com / Test1234!"
