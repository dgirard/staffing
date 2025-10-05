# CHANTIER 00 : Setup Infrastructure Cloudflare

> **Durée estimée** : 2 jours
> **Dépendances** : Aucune (chantier initial)
> **Chantier suivant** : CHANTIER_01_auth.md

---

## 📋 1. Contexte et objectifs

### Contexte

Ce chantier est le **point de départ du projet**. Il établit l'infrastructure technique complète sur Cloudflare, incluant Workers (API), D1 (base de données), Pages (frontend), et la configuration des secrets.

L'objectif est de créer une base technique solide et opérationnelle pour tous les chantiers suivants.

### Objectifs

✅ Créer et configurer un compte Cloudflare
✅ Initialiser le projet Workers pour l'API
✅ Créer la base de données D1
✅ Initialiser le projet Pages pour le frontend
✅ Configurer les secrets (JWT_SECRET, GEMINI_API_KEY)
✅ Déployer un "Hello World" fonctionnel sur Workers et Pages
✅ Valider que tout l'écosystème fonctionne

---

## 🔗 2. Dépendances

### Dépendances externes

- ✅ Compte Cloudflare (gratuit) → https://dash.cloudflare.com/sign-up
- ✅ Node.js 20+ installé → `node --version`
- ✅ npm 10+ installé → `npm --version`
- ✅ Git installé → `git --version`
- ✅ Clé API Google Gemini → https://makersuite.google.com/app/apikey

### Dépendances de chantiers

Aucune - C'est le premier chantier.

---

## 📦 3. État initial attendu

### Structure de fichiers

```
/Users/didiergirard/projects/staff/
├── docs/                       ✅ Existe (documentation)
│   ├── spec-staffing-esn-finale.md
│   ├── README.md
│   ├── QUICKSTART.md
│   └── TAILWIND_GUIDE.md
├── chantiers/                  ✅ Existe (ce fichier)
│   ├── _GUIDE_CHANTIERS.md
│   ├── _TEMPLATE_HANDOFF.md
│   ├── _ETAT_GLOBAL.json
│   └── CHANTIER_00_setup.md
├── api/                        ❌ À créer
├── frontend/                   ❌ À créer
└── .gitignore                  ❌ À créer
```

### Prérequis système

Vérifier les versions :

```bash
node --version  # doit être v20.x ou supérieur
npm --version   # doit être 10.x ou supérieur
git --version   # n'importe quelle version récente
```

### Compte Cloudflare

- ✅ Compte créé sur https://dash.cloudflare.com
- ✅ Clé API Cloudflare générée (Workers & Pages)
- ✅ Token wrangler configuré

---

## ✅ 4. Tâches détaillées

### Tâche 1 : Initialiser la structure du projet

```bash
cd /Users/didiergirard/projects/staff

# Créer structure de base
mkdir -p api frontend

# Créer .gitignore global
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
.pnpm-store/

# Build
dist/
build/
.cache/

# Environment
.env
.env.local
.dev.vars

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Cloudflare
wrangler.toml.local
.wrangler/

# Logs
*.log
logs/
EOF

# Init git si pas déjà fait
git init
git add .gitignore
git commit -m "chantier-00: Init project structure and gitignore"
```

### Tâche 2 : Setup API (Cloudflare Workers + Hono)

```bash
cd api

# Initialiser projet Node.js
npm init -y

# Installer Wrangler (CLI Cloudflare)
npm install -D wrangler

# Installer Hono et dépendances de base
npm install hono
npm install @hono/zod-openapi zod

# Installer types TypeScript
npm install -D @cloudflare/workers-types typescript

# Créer tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "types": ["@cloudflare/workers-types"],
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Créer structure src/
mkdir -p src/{routes,middleware,services,types}

# Créer src/index.ts (Hello World)
cat > src/index.ts << 'EOF'
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

// Middleware CORS
app.use('*', cors());

// Route de test
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Staffing ESN API - Chantier 00',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});

export default app;
EOF

# Créer wrangler.toml
cat > wrangler.toml << 'EOF'
name = "staffing-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[observability]
enabled = true

# Configuration de production
[env.production]
workers_dev = false
# routes = ["api.votre-domaine.com/*"]
EOF

echo "✅ API initialisée"
```

### Tâche 3 : Créer la base de données D1

```bash
cd api

# Créer la base de données D1
npx wrangler d1 create staffing-db

# La commande retourne quelque chose comme :
# [[d1_databases]]
# binding = "DB"
# database_name = "staffing-db"
# database_id = "abc123-def456-..."

# IMPORTANT : Copier le database_id et l'ajouter à wrangler.toml

# Ajouter le binding D1 à wrangler.toml (remplacer VOTRE_ID par l'ID réel)
cat >> wrangler.toml << 'EOF'

# Database D1
[[d1_databases]]
binding = "DB"
database_name = "staffing-db"
database_id = "REMPLACER_PAR_VOTRE_DATABASE_ID"
EOF

echo "⚠️  ATTENTION: Éditer wrangler.toml et remplacer REMPLACER_PAR_VOTRE_DATABASE_ID"
echo "✅ Base de données D1 créée"
```

### Tâche 4 : Configurer les secrets Cloudflare

```bash
cd api

# Créer le secret JWT_SECRET
echo "Création du secret JWT_SECRET..."
npx wrangler secret put JWT_SECRET
# Entrer une chaîne aléatoire de 32+ caractères
# Exemple: openssl rand -hex 32

# Créer le secret GEMINI_API_KEY
echo "Création du secret GEMINI_API_KEY..."
npx wrangler secret put GEMINI_API_KEY
# Entrer votre clé API Google Gemini
# Obtenue depuis: https://makersuite.google.com/app/apikey

# Vérifier que les secrets sont créés
npx wrangler secret list

# Devrait afficher:
# JWT_SECRET
# GEMINI_API_KEY

echo "✅ Secrets configurés"
```

### Tâche 5 : Tester et déployer l'API

```bash
cd api

# Test en local
npx wrangler dev --local

# Dans un autre terminal, tester:
curl http://localhost:8787/
# Devrait retourner {"status":"ok","message":"Staffing ESN API - Chantier 00",...}

curl http://localhost:8787/health
# Devrait retourner {"status":"healthy"}

# Si tout fonctionne, déployer sur Cloudflare
npx wrangler deploy

# Récupérer l'URL de déploiement (ex: staffing-api.xxx.workers.dev)
# Tester l'URL en production
curl https://staffing-api.xxx.workers.dev/

echo "✅ API déployée sur Cloudflare Workers"
```

### Tâche 6 : Setup Frontend (React + Vite + Tailwind)

```bash
cd ../frontend

# Créer projet Vite avec React + TypeScript
npm create vite@latest . -- --template react-ts

# Installer dépendances
npm install

# Installer Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configurer Tailwind (tailwind.config.js)
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
EOF

# Configurer Tailwind CSS (src/index.css)
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors;
  }

  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }

  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500;
  }
}
EOF

# Créer App.tsx simple
cat > src/App.tsx << 'EOF'
import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tester la connexion à l'API
    fetch('http://localhost:8787/')
      .then(res => res.json())
      .then(data => {
        setApiStatus(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('API Error:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Staffing ESN - Chantier 00
          </h1>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Status Frontend
              </h2>
              <p className="text-green-600 font-medium">✅ React + Vite + Tailwind</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Status API
              </h2>
              {loading && <p className="text-gray-500">Chargement...</p>}
              {!loading && apiStatus && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 font-medium">✅ API connectée</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Message: {apiStatus.message}
                  </p>
                  <p className="text-sm text-gray-600">
                    Version: {apiStatus.version}
                  </p>
                </div>
              )}
              {!loading && !apiStatus && (
                <p className="text-red-600">❌ API non accessible</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
EOF

# Tester en local
npm run dev

# Ouvrir http://localhost:5173 dans le navigateur
# Vérifier que la page s'affiche avec Tailwind et connexion API

echo "✅ Frontend initialisé"
```

### Tâche 7 : Déployer le frontend sur Cloudflare Pages

```bash
cd frontend

# Build du frontend
npm run build

# Déployer sur Cloudflare Pages
npx wrangler pages deploy dist --project-name=staffing-frontend

# La première fois, wrangler va créer le projet
# Suivre les instructions pour configurer le projet

# Récupérer l'URL de déploiement (ex: staffing-frontend.pages.dev)
# Tester l'URL en production

echo "✅ Frontend déployé sur Cloudflare Pages"
```

### Tâche 8 : Mettre à jour l'état global

```bash
cd /Users/didiergirard/projects/staff

# Éditer chantiers/_ETAT_GLOBAL.json
# Marquer le chantier 00 comme complété
# Mettre à jour les URLs Workers et Pages
# Ajouter les fichiers créés

# Cela sera fait manuellement ou via script
```

---

## 🛠️ 5. Technologies et patterns

### Stack Technique

- **API** : Hono (framework ultra-léger pour Cloudflare Workers)
- **Runtime** : Cloudflare Workers (V8 isolates, serverless)
- **Database** : Cloudflare D1 (SQLite distribué)
- **Frontend** : React 18 + TypeScript
- **Build** : Vite (bundler rapide)
- **Styling** : Tailwind CSS 3.4+
- **Déploiement** : Cloudflare Pages (frontend), Workers (API)

### Patterns

#### Pattern API (Hono)

```typescript
// Hono app avec types Cloudflare
import { Hono } from 'hono';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

// Middleware global
app.use('*', cors());

// Routes
app.get('/endpoint', (c) => {
  return c.json({ data: 'value' });
});

export default app;
```

#### Pattern Frontend (React + Tailwind)

```tsx
// Composant avec Tailwind
function Component() {
  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-gray-900">
        Titre
      </h1>
      <button className="btn-primary">
        Action
      </button>
    </div>
  );
}
```

---

## 📤 6. Livrables

### Fichiers créés

```
api/
├── src/
│   ├── index.ts              [CRÉÉ] Entry point API
│   ├── routes/               [CRÉÉ] Dossier routes (vide pour l'instant)
│   ├── middleware/           [CRÉÉ] Dossier middleware (vide)
│   ├── services/             [CRÉÉ] Dossier services (vide)
│   └── types/                [CRÉÉ] Dossier types (vide)
├── package.json              [CRÉÉ] Dependencies API
├── tsconfig.json             [CRÉÉ] Config TypeScript
└── wrangler.toml             [CRÉÉ] Config Cloudflare Workers

frontend/
├── src/
│   ├── App.tsx               [CRÉÉ] App principale
│   ├── index.css             [CRÉÉ] Styles Tailwind
│   └── main.tsx              [CRÉÉ] Entry point (généré par Vite)
├── package.json              [CRÉÉ] Dependencies frontend
├── tailwind.config.js        [CRÉÉ] Config Tailwind
├── vite.config.ts            [CRÉÉ] Config Vite
└── index.html                [CRÉÉ] HTML de base

.gitignore                    [CRÉÉ] Ignore files
```

### Infrastructure Cloudflare créée

- ✅ Worker "staffing-api" déployé → URL: `https://staffing-api.xxx.workers.dev`
- ✅ Database D1 "staffing-db" créée → ID dans wrangler.toml
- ✅ Pages "staffing-frontend" déployé → URL: `https://staffing-frontend.pages.dev`
- ✅ Secrets configurés : JWT_SECRET, GEMINI_API_KEY

### État attendu après ce chantier

```json
{
  "chantier_actuel": "CHANTIER_01_auth",
  "chantiers_completes": ["00"],
  "infrastructure": {
    "cloudflare": {
      "workers": {
        "deploye": true,
        "url": "https://staffing-api.xxx.workers.dev"
      },
      "d1_database": {
        "cree": true,
        "database_id": "abc123...",
        "database_name": "staffing-db",
        "tables_creees": []
      },
      "pages": {
        "deploye": true,
        "url": "https://staffing-frontend.pages.dev"
      },
      "secrets_configures": ["JWT_SECRET", "GEMINI_API_KEY"]
    }
  }
}
```

---

## 🧪 7. Tests de validation

### Test 1 : Vérifier la structure du projet

```bash
# Vérifier que tous les dossiers existent
ls -la api/src/
ls -la frontend/src/

# Vérifier les fichiers clés
test -f api/src/index.ts && echo "✅ api/src/index.ts existe"
test -f api/wrangler.toml && echo "✅ api/wrangler.toml existe"
test -f frontend/src/App.tsx && echo "✅ frontend/src/App.tsx existe"
test -f .gitignore && echo "✅ .gitignore existe"
```

### Test 2 : Vérifier l'API en local

```bash
cd api

# Démarrer l'API en local
npx wrangler dev --local &

# Attendre 3 secondes
sleep 3

# Tester le endpoint /
curl http://localhost:8787/
# Doit retourner JSON avec status: "ok"

# Tester le endpoint /health
curl http://localhost:8787/health
# Doit retourner {"status":"healthy"}

# Arrêter le serveur
kill %1
```

### Test 3 : Vérifier la base de données D1

```bash
cd api

# Vérifier que la DB est listée
npx wrangler d1 list | grep "staffing-db"
# Doit afficher la database

# Vérifier le binding dans wrangler.toml
grep "database_name" wrangler.toml | grep "staffing-db"
# Doit trouver le binding
```

### Test 4 : Vérifier les secrets

```bash
cd api

# Lister les secrets
npx wrangler secret list

# Doit afficher :
# JWT_SECRET
# GEMINI_API_KEY
```

### Test 5 : Vérifier le frontend en local

```bash
cd frontend

# Installer dépendances si pas déjà fait
npm install

# Démarrer le dev server
npm run dev &

# Attendre 3 secondes
sleep 3

# Vérifier que le serveur répond
curl http://localhost:5173/
# Doit retourner du HTML

# Arrêter le serveur
kill %1
```

### Test 6 : Vérifier le déploiement Workers

```bash
# Récupérer l'URL du Worker
cd api
WORKER_URL=$(npx wrangler deployments list --json | jq -r '.[0].url')

# Tester l'URL en production
curl "$WORKER_URL/"
# Doit retourner JSON avec status: "ok"

echo "✅ Worker déployé et accessible: $WORKER_URL"
```

### Test 7 : Vérifier le déploiement Pages

```bash
# Récupérer l'URL Pages
cd frontend
# (L'URL a été affichée lors du déploiement)

# Tester manuellement dans un navigateur
# Vérifier que la page s'affiche avec Tailwind

echo "✅ Pages déployé et accessible"
```

### Checklist de validation

Avant de passer au chantier suivant, vérifier :

- [ ] Structure de projet créée (api/, frontend/, .gitignore)
- [ ] API déployée sur Workers et accessible
- [ ] Base de données D1 créée avec binding configuré
- [ ] Secrets JWT_SECRET et GEMINI_API_KEY configurés
- [ ] Frontend déployé sur Pages et accessible
- [ ] API local fonctionne (npx wrangler dev --local)
- [ ] Frontend local fonctionne (npm run dev)
- [ ] Tests manuels passent (curl, navigateur)
- [ ] Aucun secret exposé dans le code
- [ ] Code commité avec messages clairs

---

## 🔄 8. Handoff vers CHANTIER_01

### Contexte pour le chantier suivant

Le chantier 01 (Auth) va implémenter l'authentification JWT et le middleware RBAC (Role-Based Access Control). Vous allez créer :
- Endpoint `/auth/login` qui retourne un JWT
- Endpoint `/auth/register` pour créer des users
- Middleware JWT pour protéger les routes `/api/*`
- Middleware RBAC pour vérifier les rôles (consultant, project_owner, administrator, directeur)

### Points d'attention

1. **JWT Secret** : Le secret JWT_SECRET est déjà configuré dans Cloudflare Secrets. Utilisez `c.env.JWT_SECRET` dans vos middlewares.

2. **RBAC 4 rôles** : Le système a 4 rôles :
   - `consultant` : Accès basique (ses données uniquement)
   - `project_owner` : Accès projets et validation timesheets
   - `administrator` : Accès global sauf CJR
   - `directeur` : Accès complet avec CJR

3. **Base de données** : La table `users` sera créée au chantier 02, mais vous pouvez préparer le middleware d'auth dès le chantier 01.

### Fichiers à créer au chantier suivant

- `api/src/routes/auth.ts` - Routes auth (login, register)
- `api/src/middleware/auth.ts` - Middleware JWT
- `api/src/middleware/rbac.ts` - Middleware RBAC
- `api/src/services/auth.service.ts` - Business logic auth
- `api/tests/auth.test.ts` - Tests unitaires

### Commandes pour démarrer le chantier 01

```bash
# Lire le guide général
cat chantiers/_GUIDE_CHANTIERS.md

# Lire l'état global
cat chantiers/_ETAT_GLOBAL.json

# Lire ce handoff
cat chantiers/handoffs/HANDOFF_00_to_01.md

# Lire le chantier 01
cat chantiers/CHANTIER_01_auth.md

# Vérifier l'API locale
cd api && npx wrangler dev --local
```

### État attendu pour démarrer le chantier 01

- ✅ API Workers déployée et accessible
- ✅ Database D1 créée (vide pour l'instant)
- ✅ Secrets configurés (JWT_SECRET, GEMINI_API_KEY)
- ✅ Frontend Pages déployé
- ✅ Structure src/ créée (routes/, middleware/, services/)

---

## 📝 Notes importantes

### Configuration CORS

L'API est configurée avec CORS ouvert (`*`). Au chantier 01, vous devrez restreindre les origines autorisées :

```typescript
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://staffing-frontend.pages.dev'],
  credentials: true
}));
```

### Database ID

Le `database_id` dans `wrangler.toml` doit être celui retourné par `npx wrangler d1 create`. Vérifiez qu'il est bien configuré.

### Secrets locaux

Pour tester en local avec secrets, créer un fichier `.dev.vars` (non commité) :

```bash
# api/.dev.vars
JWT_SECRET=votre-secret-local-32-chars
GEMINI_API_KEY=votre-cle-api-gemini-local
```

---

## 🎯 Critères de succès

✅ **Infrastructure opérationnelle** : Workers + D1 + Pages déployés
✅ **Secrets configurés** : JWT_SECRET + GEMINI_API_KEY
✅ **Hello World fonctionnel** : API retourne JSON, Frontend affiche page
✅ **Dev local fonctionnel** : `wrangler dev --local` + `npm run dev`
✅ **Documentation** : Handoff créé avec URLs et IDs

---

**Chantier 00 : Setup Infrastructure** ✅
**Prochain chantier** : CHANTIER_01_auth.md (Authentification JWT + RBAC)

---

_Chantier créé le : Janvier 2025_
_Durée estimée : 2 jours_
_Projet : Staffing ESN_
