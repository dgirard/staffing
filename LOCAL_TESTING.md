# Guide de Test en Local - Staffing ESN

Guide complet pour tester l'application Staffing ESN en environnement local.

---

## 🚀 Démarrage Rapide

### 1. Démarrer l'API

```bash
cd api
npm run dev
```

L'API démarre sur `http://localhost:8787`

### 2. Tester avec le script automatisé

```bash
bash test-api.sh
```

Ce script teste automatiquement :
- ✅ Health check
- ✅ Version API
- ✅ Register utilisateur
- ✅ Login
- ✅ Info utilisateur (/auth/me)
- ✅ Liste des MCP tools

---

## 📝 Tests Manuels avec cURL

### Health Check

```bash
curl -s http://localhost:8787/health | jq .
```

**Réponse attendue** :
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T20:00:00.000Z",
  "uptime": 123
}
```

### Version API

```bash
curl -s http://localhost:8787/ | jq .
```

**Réponse attendue** :
```json
{
  "status": "ok",
  "message": "Staffing ESN API - Production Ready",
  "version": "0.11.1",
  "timestamp": "2025-10-05T20:00:00.000Z",
  "environment": "development"
}
```

---

## 🔐 Authentification

### Register (Créer un compte)

```bash
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "email": "test@example.com",
  "password": "Test1234!",
  "nom": "Doe",
  "prenom": "John",
  "role": "consultant"
}
EOF
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_xxx",
      "email": "test@example.com",
      "nom": "Doe",
      "prenom": "John",
      "role": "consultant"
    }
  },
  "message": "Compte créé avec succès"
}
```

**Rôles disponibles** :
- `consultant` : Consultant
- `project_owner` : Chef de projet
- `administrator` : Administrateur
- `directeur` : Directeur (accès CJR)

### Login

```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "email": "test@example.com",
  "password": "Test1234!"
}
EOF
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_xxx",
      "email": "test@example.com",
      "nom": "Doe",
      "prenom": "John",
      "role": "consultant"
    }
  },
  "message": "Connexion réussie"
}
```

### Obtenir les infos utilisateur (/auth/me)

```bash
# 1. Login et récupérer le token
TOKEN=$(curl -s -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq -r '.data.token'
{
  "email": "test@example.com",
  "password": "Test1234!"
}
EOF
)

# 2. Utiliser le token pour accéder à /auth/me
curl -s http://localhost:8787/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Réponse attendue** :
```json
{
  "success": true,
  "data": {
    "id": "user_xxx",
    "email": "test@example.com",
    "nom": "Doe",
    "prenom": "John",
    "role": "consultant"
  }
}
```

---

## 📊 Routes Protégées (Nécessitent JWT)

Toutes les routes ci-dessous nécessitent le header `Authorization: Bearer <token>`.

### Consultants

```bash
# Liste des consultants
curl -s http://localhost:8787/consultants \
  -H "Authorization: Bearer $TOKEN" | jq .

# Créer un consultant
curl -X POST http://localhost:8787/consultants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "nom": "Martin",
  "prenom": "Sophie",
  "tjm_cjn": 450,
  "tjm_cjr": 420,
  "niveau": "Senior",
  "competences": "React, TypeScript, Node.js"
}
EOF
```

### Projets

```bash
# Liste des projets
curl -s http://localhost:8787/projects \
  -H "Authorization: Bearer $TOKEN" | jq .

# Créer un projet
curl -X POST http://localhost:8787/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "nom": "Refonte Site Web",
  "client": "ACME Corp",
  "budget_jours": 100,
  "date_debut": "2025-10-01",
  "date_fin": "2025-12-31",
  "statut": "active"
}
EOF
```

### Timesheets

```bash
# Mes timesheets
curl -s "http://localhost:8787/timesheets?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Créer un timesheet
curl -X POST http://localhost:8787/timesheets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "consultant_id": "cons_xxx",
  "intervention_id": "int_xxx",
  "date": "2025-10-05",
  "periode": "journee",
  "temps_saisi": 1.0,
  "commentaire": "Développement feature X"
}
EOF
```

**Périodes disponibles** :
- `matin` : 0.5 jour
- `apres_midi` : 0.5 jour
- `journee` : 1.0 jour

### Dashboards

```bash
# Mon dashboard (consultant)
curl -s http://localhost:8787/dashboards/me \
  -H "Authorization: Bearer $TOKEN" | jq .

# Dashboard administrateur
curl -s http://localhost:8787/dashboards/admin \
  -H "Authorization: Bearer $TOKEN" | jq .

# Dashboard directeur (avec CJR)
curl -s http://localhost:8787/dashboards/directeur \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Margins (Marges projets)

⚠️ **Attention** : Les routes avec `use_real_cost=true` nécessitent le rôle `directeur` et génèrent des logs d'audit.

```bash
# Marges d'un projet (CJN - accessible à tous)
curl -s "http://localhost:8787/margins/project/proj_xxx" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Marges d'un projet (CJR - directeur uniquement)
curl -s "http://localhost:8787/margins/project/proj_xxx?use_real_cost=true" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Toutes les marges (CJR - directeur uniquement)
curl -s "http://localhost:8787/margins/all?use_real_cost=true" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Chat Gemini (Assistant IA)

```bash
# Envoyer un message au chat
curl -X POST http://localhost:8787/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "message": "Combien de jours ai-je saisis ce mois-ci ?"
}
EOF
```

**Exemples de messages** :
- "Saisis 0.5 jour sur le projet X aujourd'hui"
- "Combien de jours ai-je saisis cette semaine ?"
- "Quels sont mes projets en cours ?"
- "Affiche mes validations en attente"
- "Quel est mon taux d'utilisation ?"

### MCP (Model Context Protocol)

```bash
# Liste des outils MCP
curl -s http://localhost:8787/mcp/tools \
  -H "Authorization: Bearer $TOKEN" | jq .

# Appeler un outil MCP
curl -X POST http://localhost:8787/mcp/call \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF' | jq .
{
  "name": "get_my_timesheets",
  "arguments": {
    "period": "week"
  }
}
EOF
```

**Outils MCP disponibles** :
1. `create_timesheet` - Créer une saisie de temps
2. `get_consultant_utilization` - Taux d'utilisation consultant
3. `get_project_margins` - Marges projet
4. `list_consultants` - Liste des consultants
5. `validate_timesheet` - Valider/rejeter un timesheet
6. `list_pending_validations` - Validations en attente
7. `get_my_timesheets` - Mes timesheets
8. `get_my_projects` - Mes projets actifs

### Audit Logs (Directeur uniquement)

```bash
# Liste des logs d'audit
curl -s http://localhost:8787/audit/logs \
  -H "Authorization: Bearer $TOKEN" | jq .

# Stats d'audit
curl -s http://localhost:8787/audit/stats \
  -H "Authorization: Bearer $TOKEN" | jq .

# Logs pour un utilisateur spécifique
curl -s "http://localhost:8787/audit/user/user_xxx" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 🗄️ Base de Données (Développement)

La base de données D1 locale est située dans `.wrangler/state/v3/d1/miniflare-D1DatabaseObject`.

### Accéder à la base de données

```bash
# Via wrangler
npx wrangler d1 execute staffing-db --local --command "SELECT * FROM users"

# Lister les tables
npx wrangler d1 execute staffing-db --local --command "SELECT name FROM sqlite_master WHERE type='table'"

# Compter les utilisateurs
npx wrangler d1 execute staffing-db --local --command "SELECT COUNT(*) as total FROM users"
```

### Tables disponibles

- `users` - Utilisateurs
- `consultants` - Consultants ESN
- `projects` - Projets clients
- `interventions` - Affectations consultant/projet
- `timesheets` - Saisies de temps
- `validations` - Historique validations
- `chat_conversations` - Conversations chat IA
- `chat_messages` - Messages chat
- `audit_logs` - Logs d'audit CJR

---

## 🔍 Debugging

### Voir les logs en temps réel

Les logs wrangler s'affichent automatiquement dans le terminal où vous avez lancé `npm run dev`.

### Vérifier les bindings (DB, secrets)

```bash
curl -s http://localhost:8787/test/bindings | jq .
```

**Réponse attendue** :
```json
{
  "hasDB": true,
  "hasJwtSecret": true,
  "hasGeminiKey": true,
  "message": "Bindings check"
}
```

### Variables d'environnement (.dev.vars)

Le fichier `api/.dev.vars` contient les secrets pour le développement local :

```bash
JWT_SECRET=dev-secret-minimum-32-characters-long-for-local-testing-only
GEMINI_API_KEY=your-gemini-api-key-here-replace-me
NODE_ENV=development
LOG_LEVEL=debug
```

⚠️ **Important** : Ne jamais commiter ce fichier dans Git (déjà dans `.gitignore`).

---

## 🧪 Tests Automatisés

Le script `test-api.sh` exécute une suite de tests complète :

```bash
bash test-api.sh
```

**Tests inclus** :
1. Health check
2. Version API
3. Register utilisateur
4. Login
5. /auth/me (route protégée)
6. Liste MCP tools

**Output attendu** :
```
🧪 Test de l'API Staffing ESN en local
======================================

1️⃣  Health Check
✅ {"status":"healthy",...}

2️⃣  Version API
✅ {"status":"ok","version":"0.11.1",...}

3️⃣  Register utilisateur
⚠️  {"success":false,"message":"Un utilisateur avec cet email existe déjà"}

4️⃣  Login
✅ {"success":true,"data":{"token":"..."}}

5️⃣  Info utilisateur (/auth/me)
✅ {"success":true,"data":{"id":"...","email":"..."}}

6️⃣  Liste MCP Tools
✅ [8 tools found]

✅ Tests terminés avec succès !
```

---

## 📚 Ressources

### Documentation

- **API Docs** : `/api/src/routes/*.routes.ts` - Définitions des routes
- **Schemas** : `/api/src/schemas/*.schema.ts` - Validation Zod
- **Services** : `/api/src/services/*.service.ts` - Logique métier
- **DEPLOYMENT.md** : Guide de déploiement production

### Endpoints disponibles

| Route | Méthode | Auth | Description |
|-------|---------|------|-------------|
| `/` | GET | ❌ | Version API |
| `/health` | GET | ❌ | Health check |
| `/auth/register` | POST | ❌ | Créer un compte |
| `/auth/login` | POST | ❌ | Se connecter |
| `/auth/me` | GET | ✅ | Info utilisateur |
| `/consultants` | GET/POST | ✅ | Gestion consultants |
| `/projects` | GET/POST | ✅ | Gestion projets |
| `/interventions` | GET/POST | ✅ | Affectations |
| `/timesheets` | GET/POST | ✅ | Saisies de temps |
| `/validations` | GET/POST | ✅ | Validations |
| `/dashboards/*` | GET | ✅ | Tableaux de bord |
| `/margins/*` | GET | ✅ | Marges projets |
| `/audit/*` | GET | ✅ | Logs d'audit |
| `/chat` | POST | ✅ | Assistant IA |
| `/mcp/tools` | GET | ✅ | Outils MCP |

---

## ❓ Troubleshooting

### Port 8787 déjà utilisé

```bash
# Trouver le processus utilisant le port
lsof -ti:8787

# Tuer le processus
lsof -ti:8787 | xargs kill -9
```

### Erreur "Malformed JSON"

Utiliser un heredoc pour les requêtes curl complexes :

```bash
curl -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "email": "test@example.com",
  "password": "Test1234!"
}
EOF
```

### Token JWT invalide

Vérifier que le `JWT_SECRET` dans `.dev.vars` est bien configuré (minimum 32 caractères).

### Base de données vide

Réappliquer les migrations :

```bash
npm run db:migrate
npm run db:seed
```

---

## ✅ Checklist de Test

Avant de déployer en production, vérifier :

- [ ] Health check répond correctement
- [ ] Register + Login fonctionnent
- [ ] JWT tokens sont générés et validés
- [ ] Routes protégées nécessitent un token
- [ ] RBAC fonctionne (consultant vs directeur)
- [ ] Accès CJR génère des audit logs
- [ ] Chat Gemini répond (si API key configurée)
- [ ] MCP tools retournent des résultats
- [ ] TypeScript compile sans erreur (`npm run typecheck`)
- [ ] Base de données contient les données de seed

---

**Local testing guide complet** ✅

Pour déployer en production, consulter **DEPLOYMENT.md**.
