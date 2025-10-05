# 💻 Guide Développement Local - Staffing ESN

> **Objectif** : Démarrer l'environnement de développement en 1 commande et tester localement sans déployer

---

## 🚀 Quick Start (30 secondes)

### Option 1 : Tout automatique (recommandé)

```bash
# Cloner le repo
git clone <repo-url>
cd staff

# Bootstrap (installe tout)
npm run bootstrap

# Démarrer l'environnement complet (API + Frontend + DB)
npm run dev
```

✅ **C'est tout !**
- API disponible sur http://localhost:8787
- Frontend disponible sur http://localhost:5173
- DB D1 locale créée automatiquement

### Option 2 : Avec données de test

```bash
npm run dev:seed
```

Démarre tout + charge des données de test (utilisateurs, projets, consultants).

---

## 📋 Prérequis

### Logiciels requis

```bash
# Node.js 20+
node --version  # v20.x.x

# npm 10+
npm --version   # 10.x.x

# Git
git --version
```

### Comptes requis

- ✅ Compte Cloudflare (pour déploiements)
- ✅ Clé API Google Gemini (pour le chat)

---

## 🛠️ Installation Détaillée

### Étape 1 : Cloner et installer

```bash
git clone <repo-url>
cd staff

# Installer les dépendances (API + Frontend)
npm run bootstrap
```

Ce script exécute :
```bash
cd api && npm install
cd frontend && npm install
```

### Étape 2 : Configuration des secrets locaux

```bash
# Créer fichier de secrets locaux
cp api/.dev.vars.example api/.dev.vars

# Éditer le fichier
nano api/.dev.vars
```

**api/.dev.vars** :
```env
JWT_SECRET=dev-local-secret-32-chars-minimum-for-jwt
GEMINI_API_KEY=your-gemini-api-key-here
```

⚠️ **Important** : Ne jamais commiter `.dev.vars` (déjà dans `.gitignore`)

### Étape 3 : Créer la base de données locale

```bash
cd api

# Créer la DB D1 locale
npx wrangler d1 create staffing-db --local

# Appliquer les migrations
npx wrangler d1 execute staffing-db --local --file=migrations/001_initial.sql

# (Optionnel) Charger les seed data
npx wrangler d1 execute staffing-db --local --file=migrations/002_seed.sql
```

---

## 💻 Développement Quotidien

### Démarrage

```bash
# Démarrer tout (API + Frontend + DB)
npm run dev
```

Ou manuellement dans 2 terminaux :

**Terminal 1 - API** :
```bash
cd api
npx wrangler dev --local --port 8787
```

**Terminal 2 - Frontend** :
```bash
cd frontend
npm run dev
```

### URLs locales

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Interface React |
| **API** | http://localhost:8787 | API Hono |
| **API Health** | http://localhost:8787/health | Health check |
| **API OpenAPI** | http://localhost:8787/openapi.json | Documentation API |

### Arrêter

```bash
# Ctrl+C dans chaque terminal
# ou
npm run dev:stop  # Si script de gestion des processus
```

---

## 🧪 Tests en Local

### Tests unitaires

```bash
# API
cd api && npm test

# Frontend
cd frontend && npm test

# Tout
npm run test:all
```

### Tests avec watch mode

```bash
# API - Re-run automatique sur changement
cd api && npm run test:watch

# Frontend
cd frontend && npm run test:watch
```

### Tests E2E

```bash
# Démarrer l'environnement d'abord
npm run dev

# Dans un autre terminal, lancer les tests E2E
cd frontend && npm run test:e2e
```

### Coverage

```bash
# Voir le coverage
npm run test:coverage

# Ouvrir le rapport HTML
open api/coverage/index.html
open frontend/coverage/index.html
```

---

## 🗄️ Base de Données Locale

### Requêtes SQL

```bash
cd api

# Exécuter une requête
npx wrangler d1 execute staffing-db --local \
  --command="SELECT * FROM users"

# Exécuter un fichier SQL
npx wrangler d1 execute staffing-db --local \
  --file=migrations/custom-query.sql
```

### Voir les données

```bash
# Lister les tables
npx wrangler d1 execute staffing-db --local \
  --command="SELECT name FROM sqlite_master WHERE type='table'"

# Compter les enregistrements
npx wrangler d1 execute staffing-db --local \
  --command="SELECT
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM consultants) as consultants,
    (SELECT COUNT(*) FROM projects) as projects"
```

### Reset DB

```bash
cd api

# Supprimer la DB locale
rm -rf .wrangler/state

# Recréer
npx wrangler d1 execute staffing-db --local --file=migrations/001_initial.sql
npx wrangler d1 execute staffing-db --local --file=migrations/002_seed.sql
```

---

## 🎭 Seed Data - Données de Test

### Utilisateurs de test

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| consultant@test.com | Test1234! | consultant | Consultant basique |
| owner@test.com | Test1234! | project_owner | Project Owner |
| admin@test.com | Test1234! | administrator | Administrateur |
| directeur@test.com | Admin1234! | directeur | Directeur (accès CJR) |

### Projets de test

- **Alpha** - Projet régie client Acme Corp
- **Beta** - Projet forfait client TechStart
- **Gamma** - Projet interne

### Consultants de test

- **Jean Dupont** - Senior Developer (CJN: 450€, CJR: 380€)
- **Marie Martin** - Consultant (CJN: 400€, CJR: 340€)
- **Pierre Durand** - Junior (CJN: 300€, CJR: 280€)

### Charger les seed data

```bash
cd api
npx wrangler d1 execute staffing-db --local --file=migrations/002_seed.sql
```

---

## 🔧 Outils de Développement

### Vite Dev Tools (Frontend)

Le dev server Vite inclut :
- ⚡ Hot Module Replacement (HMR)
- 🔍 Error overlay
- 🎨 Tailwind CSS JIT

### Wrangler Dev Tools (API)

```bash
# Logs en temps réel
npx wrangler tail --local

# Avec filtres
npx wrangler tail --local --format=pretty
```

### Vitest UI (Tests)

```bash
# Ouvrir l'interface de tests
cd api && npm run test:ui

# Ou
cd frontend && npm run test:ui
```

Interface web interactive pour :
- Voir tous les tests
- Filtrer par nom/fichier
- Voir le coverage
- Debug interactif

### Playwright UI (E2E)

```bash
cd frontend
npm run test:e2e:ui
```

Interface pour :
- Voir les tests E2E
- Debug pas à pas
- Voir les screenshots
- Time travel debugging

---

## 🐛 Debugging

### API (Workers)

```typescript
// Dans votre code API
console.log('Debug:', { variable, data });

// Les logs apparaissent dans le terminal wrangler dev
```

### Frontend (React)

```typescript
// React DevTools
// Installer l'extension Chrome/Firefox

// Console browser
console.log('Debug component:', { props, state });
```

### VSCode Launch Config

Créer `.vscode/launch.json` :

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/api",
      "console": "integratedTerminal"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

---

## 📦 Variables d'Environnement

### API (.dev.vars)

```env
# Secrets
JWT_SECRET=your-jwt-secret-32-chars-min
GEMINI_API_KEY=your-gemini-key

# Config
NODE_ENV=development
LOG_LEVEL=debug
```

### Frontend (.env.local)

```env
# API URL
VITE_API_URL=http://localhost:8787

# Features flags
VITE_ENABLE_CHAT=true
VITE_ENABLE_MCP=true
```

---

## 🔄 Workflow Développement

### Cycle typique

```bash
# 1. Démarrer l'environnement
npm run dev

# 2. Faire des modifications
# Éditer api/src/routes/consultants.ts

# 3. Tester automatiquement (watch mode)
cd api && npm run test:watch

# 4. Vérifier en local
curl http://localhost:8787/api/consultants

# 5. Tester dans le navigateur
# Ouvrir http://localhost:5173

# 6. Commit quand tout est OK
git add .
git commit -m "feat: Add consultants endpoint"
```

### Hot Reload

- ✅ **API** : wrangler dev recharge automatiquement
- ✅ **Frontend** : Vite HMR ultra rapide
- ✅ **Tests** : Vitest watch mode re-run automatique

---

## 📱 Tester PWA en Local

### Mode PWA local

```bash
cd frontend

# Build PWA
npm run build

# Servir le build avec PWA
npx vite preview
```

Ouvrir http://localhost:4173 et installer la PWA :
- Chrome : Icône "Install" dans la barre d'adresse
- Tester mode offline dans DevTools

---

## 🎯 Commandes Utiles

### Installation

```bash
npm run bootstrap           # Installer tout
npm run clean              # Nettoyer node_modules
npm run clean:install      # Clean + réinstaller
```

### Développement

```bash
npm run dev                # Démarrer tout
npm run dev:api            # API seule
npm run dev:frontend       # Frontend seul
npm run dev:seed           # Avec seed data
```

### Tests

```bash
npm run test:all           # Tous les tests
npm run test:api           # Tests API
npm run test:frontend      # Tests frontend
npm run test:coverage      # Coverage
npm run test:e2e           # E2E
```

### Base de données

```bash
npm run db:create          # Créer DB locale
npm run db:migrate         # Appliquer migrations
npm run db:seed            # Charger seed data
npm run db:reset           # Reset complet
npm run db:query           # Requête interactive
```

### Build

```bash
npm run build:all          # Build API + Frontend
npm run build:api          # Build API
npm run build:frontend     # Build Frontend
```

---

## ❓ Troubleshooting

### Port déjà utilisé

```bash
# API sur port 8787
lsof -ti:8787 | xargs kill -9

# Frontend sur port 5173
lsof -ti:5173 | xargs kill -9
```

### DB non trouvée

```bash
# Recréer la DB
cd api
rm -rf .wrangler
npx wrangler d1 execute staffing-db --local --file=migrations/001_initial.sql
```

### Secrets non chargés

```bash
# Vérifier que .dev.vars existe
ls -la api/.dev.vars

# Vérifier le contenu
cat api/.dev.vars
```

### Tests qui échouent

```bash
# Réinstaller dépendances
npm run clean:install

# Vérifier les versions
node --version  # 20+
npm --version   # 10+

# Relancer tests en verbose
cd api && npm test -- --reporter=verbose
```

### HMR ne fonctionne pas

```bash
# Redémarrer Vite
cd frontend
pkill -f vite
npm run dev
```

---

## 🎓 Best Practices

### 1. Toujours tester en local avant de commiter

```bash
npm run test:all && git commit
```

### 2. Utiliser watch mode pendant le dev

```bash
npm run test:watch
```

### 3. Reset DB régulièrement

```bash
npm run db:reset
```

### 4. Vérifier coverage

```bash
npm run test:coverage
# Coverage doit être >= 85%
```

### 5. Tester en mode production localement

```bash
npm run build:all
npm run preview:all
```

---

## 🚀 Conclusion

Développement local simplifié :

✅ **1 commande** pour tout démarrer
✅ **Hot reload** sur tous les changements
✅ **Tests rapides** avec watch mode
✅ **DB locale** SQLite (pas besoin de Docker)
✅ **Seed data** pour tester rapidement
✅ **Debug facile** avec DevTools

**Prêt à coder ! 🎉**

---

_Document créé : Janvier 2025_
_Version : 1.0_
_Projet : Staffing ESN_
