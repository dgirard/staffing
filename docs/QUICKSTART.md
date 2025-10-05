# 🚀 Guide Démarrage Rapide - Développeur

## Setup Projet (Jour 1)

### 1. Prérequis

```bash
# Node.js 20+
node --version  # v20.x.x

# npm 10+
npm --version   # 10.x.x

# Git
git --version

# Compte Cloudflare (gratuit)
# → https://dash.cloudflare.com/sign-up
```

### 2. Création Projet

```bash
# Créer workspace
mkdir staffing-esn
cd staffing-esn

# Structure
mkdir -p {frontend,api,docs,scripts}

# Git init
git init
echo "node_modules/\n.env\n.dev.vars\ndist/" > .gitignore
```

### 3. Setup Cloudflare Workers (API)

```bash
cd api

# Créer projet Hono
npm create hono@latest . -- --template cloudflare-workers

# Installer dépendances
npm install hono @hono/zod-openapi zod
npm install -D wrangler @cloudflare/workers-types

# Configuration wrangler.toml
cat > wrangler.toml << 'EOF'
name = "staffing-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
workers_dev = false
routes = ["api.staffing.votredomaine.com/*"]

[[d1_databases]]
binding = "DB"
database_name = "staffing-db"
database_id = "votre-id-après-création"

[[kv_namespaces]]
binding = "CACHE"
id = "votre-kv-id"
EOF

# Créer DB D1
npx wrangler d1 create staffing-db

# Copier l'ID dans wrangler.toml
```

### 4. Schema Database

```bash
# Créer migrations/001_initial.sql
cat > migrations/001_initial.sql << 'EOF'
-- USERS
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('consultant', 'project_owner', 'administrator', 'directeur')),
  created_at INTEGER NOT NULL
);

-- CONSULTANTS
CREATE TABLE consultants (
  consultant_id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(user_id),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  profil_seniority TEXT CHECK(profil_seniority IN ('junior', 'consultant', 'senior', 'manager', 'directeur')),
  cjn REAL NOT NULL,
  cjr REAL NOT NULL,
  date_embauche TEXT,
  statut TEXT DEFAULT 'actif'
);
CREATE INDEX idx_consultants_statut ON consultants(statut);

-- PROJECTS
CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  code_projet TEXT UNIQUE NOT NULL,
  nom_projet TEXT NOT NULL,
  client TEXT,
  type_projet TEXT CHECK(type_projet IN ('regie', 'forfait')),
  montant_vendu REAL,
  jours_vendus INTEGER,
  date_debut TEXT,
  date_fin TEXT,
  statut TEXT DEFAULT 'actif',
  owner_id TEXT REFERENCES users(user_id)
);
CREATE INDEX idx_projects_owner ON projects(owner_id);

-- PERSONAS
CREATE TABLE personas (
  persona_id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  libelle TEXT NOT NULL,
  tj_reference REAL NOT NULL
);

-- INTERVENTIONS
CREATE TABLE interventions (
  intervention_id TEXT PRIMARY KEY,
  consultant_id TEXT REFERENCES consultants(consultant_id),
  project_id TEXT REFERENCES projects(project_id),
  persona_id TEXT REFERENCES personas(persona_id),
  tj_verrouille REAL NOT NULL,
  allocation_pct INTEGER CHECK(allocation_pct >= 0 AND allocation_pct <= 100),
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  statut TEXT DEFAULT 'active'
);
CREATE INDEX idx_interventions_consultant ON interventions(consultant_id, statut);

-- TIME_ENTRIES
CREATE TABLE time_entries (
  time_entry_id TEXT PRIMARY KEY,
  consultant_id TEXT REFERENCES consultants(consultant_id),
  intervention_id TEXT REFERENCES interventions(intervention_id),
  project_id TEXT REFERENCES projects(project_id),
  entry_date TEXT NOT NULL,
  periode TEXT CHECK(periode IN ('matin', 'apres_midi', 'journee')) NOT NULL,
  jours REAL CHECK(jours IN (0.5, 1.0)) NOT NULL,
  statut TEXT CHECK(statut IN ('draft', 'submitted', 'validated', 'rejected')) DEFAULT 'draft',
  validated_by TEXT REFERENCES users(user_id),
  validated_at INTEGER,
  commentaire TEXT,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_time_entries_unique ON time_entries(consultant_id, intervention_id, entry_date, periode);

-- AUDIT_LOGS
CREATE TABLE audit_logs (
  audit_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at INTEGER NOT NULL
);

-- CHAT_HISTORY
CREATE TABLE chat_history (
  chat_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  messages TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
EOF

# Appliquer migrations
npx wrangler d1 execute staffing-db --local --file=migrations/001_initial.sql
npx wrangler d1 execute staffing-db --remote --file=migrations/001_initial.sql
```

### 5. Structure API (Hono)

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  GEMINI_API_KEY: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

// Middlewares
app.use('*', cors());
app.use('/api/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});

// Routes
app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// Auth routes
app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  // TODO: Implémenter login
  return c.json({ token: 'jwt-token' });
});

// Consultants routes
app.get('/api/consultants', async (c) => {
  const results = await c.env.DB.prepare('SELECT * FROM consultants').all();
  return c.json(results);
});

// Timesheets routes
app.post('/api/timesheets', async (c) => {
  const data = await c.req.json();
  // TODO: Créer timesheet
  return c.json({ success: true });
});

// Chat route (using Google Gemini API)
app.post('/api/chat', async (c) => {
  const { message } = await c.req.json();

  // Call Google Gemini API directly
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${c.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `Tu es un assistant staffing ESN. Contexte système: aide à la saisie de temps, validation de timesheets, analyse de marges.\n\nUser: ${message}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    })
  });

  const data = await response.json();
  const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Désolé, je n\'ai pas pu traiter votre demande.';

  return c.json({ response: aiResponse });
});

export default app;
```

### 6. Setup Frontend (React PWA + Tailwind)

```bash
cd ../frontend

# Créer projet Vite
npm create vite@latest . -- --template react-ts

# Installer dépendances
npm install
npm install @tanstack/react-query zustand react-router-dom
npm install -D vite-plugin-pwa workbox-window

# Installer Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configuration Tailwind - tailwind.config.js
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

# Créer fichier CSS avec directives Tailwind
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Styles personnalisés */
@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md p-6;
  }
  
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500;
  }
}
EOF

# Configuration vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Staffing ESN',
        short_name: 'Staffing',
        theme_color: '#1890ff',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
EOF
```

### 7. Configuration des Secrets Cloudflare

```bash
# Configurer la clé API Gemini dans Cloudflare Secrets
cd api

# Créer le secret GEMINI_API_KEY
npx wrangler secret put GEMINI_API_KEY
# Entrer votre clé API Google Gemini (obtenue depuis https://makersuite.google.com/app/apikey)

# Créer le secret JWT_SECRET
npx wrangler secret put JWT_SECRET
# Entrer une chaîne aléatoire sécurisée (min 32 caractères)

# Vérifier les secrets configurés
npx wrangler secret list
```

**Note importante** : Les secrets Cloudflare sont stockés de manière sécurisée et chiffrée. Ils ne sont jamais exposés dans les logs ou le code source.

### 8. Déploiement Initial

```bash
# API
cd api
npx wrangler deploy

# Frontend
cd ../frontend
npm run build
npx wrangler pages deploy dist
```

---

## Développement avec Tailwind CSS

### Principes Tailwind

**Utility-First** : Classes CSS atomiques directement dans le JSX
```typescript
// ❌ Mauvaise pratique (CSS séparé)
<div className="timesheet-card">...</div>

// ✅ Bonne pratique (Tailwind utilities)
<div className="bg-white rounded-lg shadow-md p-6">...</div>
```

**Responsive Design** : Préfixes breakpoints
```typescript
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Full width mobile, 1/2 tablet, 1/3 desktop */}
</div>
```

**States** : Hover, focus, active, disabled
```typescript
<button className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50">
  Valider
</button>
```

### Composants Réutilisables

**Créer des composants avec Tailwind** :

```typescript
// components/ui/Button.tsx
type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export function Button({ variant = 'primary', children, className, ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Utilisation
<Button variant="primary" onClick={handleSubmit}>
  Soumettre
</Button>
```

**Card Component** :

```typescript
// components/ui/Card.tsx
interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
```

### Layout Patterns

**Page Container** :

```typescript
// layouts/MainLayout.tsx
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Staffing ESN</h1>
            <nav className="flex gap-4">
              <a className="text-gray-600 hover:text-gray-900">Dashboard</a>
              <a className="text-gray-600 hover:text-gray-900">Timesheet</a>
              <a className="text-gray-600 hover:text-gray-900">Projets</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

**Grid Responsive** :

```typescript
// Dashboard avec grid Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <DashboardCard title="Timesheets" value="12" />
  <DashboardCard title="Budget" value="68%" />
  <DashboardCard title="Jours" value="142j" />
  <DashboardCard title="Marge" value="42%" />
</div>
```

### Dark Mode (Optionnel)

```typescript
// tailwind.config.js
export default {
  darkMode: 'class', // ou 'media'
  theme: {
    extend: {
      // ...
    },
  },
}

// Utilisation
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

### Optimisation Production

**PurgeCSS Automatique** : Vite + Tailwind purge automatiquement les classes non utilisées

**Taille bundle** : ~10-20 KB en production (vs 200+ KB CSS traditionnel)

---

## Développement Quotidien

### Démarrer environnement local

```bash
# Terminal 1 - API
cd api
npx wrangler dev --local

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Workflow Git

```bash
# Feature branch
git checkout -b feature/timesheet-saisie

# Développement
# ... code ...

# Commit
git add .
git commit -m "feat: Saisie timesheet demi-journée"

# Push
git push origin feature/timesheet-saisie

# Merge (après review)
git checkout main
git merge feature/timesheet-saisie
git push origin main
```

### Déployer modifications

```bash
# API (auto sur push main via GitHub Actions)
cd api
npx wrangler deploy

# Frontend
cd frontend
npm run build
npx wrangler pages deploy dist
```

---

## Structure Code Recommandée

### API

```
api/
├── src/
│   ├── index.ts              # Entry point
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── consultants.ts
│   │   ├── projects.ts
│   │   ├── timesheets.ts
│   │   └── chat.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── rbac.ts
│   ├── services/
│   │   ├── database.ts
│   │   ├── chat.ts
│   │   └── validation.ts
│   └── types/
│       └── index.ts
├── migrations/
│   └── 001_initial.sql
├── wrangler.toml
└── package.json
```

### Frontend

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Timesheet.tsx
│   │   └── Projects.tsx
│   ├── components/
│   │   ├── TimeEntry.tsx
│   │   ├── Chat.tsx
│   │   └── Navigation.tsx
│   ├── stores/
│   │   ├── auth.ts
│   │   └── timesheet.ts
│   ├── api/
│   │   └── client.ts
│   └── types/
│       └── index.ts
├── public/
├── vite.config.ts
└── package.json
```

---

## Checklist Sprint 1 (Jour 1-10)

### Jour 1-2 : Infrastructure
- [x] Compte Cloudflare créé
- [x] Repos Git initialisé
- [x] Workers + D1 configurés
- [ ] CI/CD GitHub Actions
- [ ] Domaine configuré

### Jour 3-5 : Auth & DB
- [ ] Schema DB appliqué
- [ ] Seed data (users, personas)
- [ ] Login/Logout API
- [ ] JWT middleware
- [ ] RBAC middleware

### Jour 6-8 : Frontend Shell
- [ ] React PWA configuré
- [ ] Routing (React Router)
- [ ] Layout navigation
- [ ] Login page
- [ ] State management (Zustand)

### Jour 9-10 : Tests & Deploy
- [ ] Tests unitaires API
- [ ] Tests E2E basic
- [ ] Deploy staging
- [ ] Documentation API

---

## Commandes Utiles

### D1 Database

```bash
# Lister databases
npx wrangler d1 list

# Exécuter requête
npx wrangler d1 execute staffing-db --command="SELECT * FROM users"

# Export backup
npx wrangler d1 export staffing-db --output=backup.sql

# Migrations
npx wrangler d1 migrations list staffing-db
npx wrangler d1 migrations apply staffing-db
```

### Workers

```bash
# Logs en temps réel
npx wrangler tail

# Variables d'environnement
npx wrangler secret put JWT_SECRET

# Voir secrets
npx wrangler secret list
```

### KV

```bash
# Créer namespace
npx wrangler kv:namespace create CACHE

# Set valeur
npx wrangler kv:key put --binding=CACHE "config" '{"version":"1.0"}'

# Get valeur
npx wrangler kv:key get --binding=CACHE "config"
```

---

## Debug & Monitoring

### Logs

```bash
# Logs temps réel
npx wrangler tail --format=pretty

# Logs avec filtres
npx wrangler tail --status=error
```

### Cloudflare Dashboard

- **Analytics** : https://dash.cloudflare.com/[account]/workers/analytics
- **D1** : https://dash.cloudflare.com/[account]/d1
- **Secrets** : https://dash.cloudflare.com/[account]/workers/overview (via Settings de chaque Worker)

### Local Testing

```typescript
// api/src/test.ts
import { describe, it, expect } from 'vitest';

describe('Time Entry Validation', () => {
  it('accepte saisie 0.5 jour', () => {
    const entry = { jours: 0.5, periode: 'matin' };
    expect(validateEntry(entry)).toBe(true);
  });
  
  it('rejette saisie > 1 jour', () => {
    const entries = [
      { jours: 1.0, periode: 'journee' },
      { jours: 0.5, periode: 'matin' }
    ];
    expect(validateDayTotal(entries)).toBe(false);
  });
});
```

---

## Ressources

### Documentation Officielle
- **Cloudflare Workers** : https://developers.cloudflare.com/workers/
- **D1 Database** : https://developers.cloudflare.com/d1/
- **Cloudflare Secrets** : https://developers.cloudflare.com/workers/configuration/secrets/
- **Google Gemini API** : https://ai.google.dev/docs
- **Hono** : https://hono.dev/
- **React** : https://react.dev/

### Exemples Code
- **Hono + D1** : https://github.com/honojs/examples
- **React PWA** : https://vite-pwa-org.netlify.app/

### Support
- **Discord Cloudflare** : https://discord.gg/cloudflaredev
- **Discord Hono** : https://discord.gg/hono

---

## Troubleshooting

### "Error: Database not found"
```bash
# Vérifier ID database dans wrangler.toml
npx wrangler d1 list
# Copier le bon database_id
```

### "Error: GEMINI_API_KEY not found"
```bash
# Configurer le secret Gemini
npx wrangler secret put GEMINI_API_KEY
# Entrer votre clé API depuis https://makersuite.google.com/app/apikey
```

### "CORS error"
```typescript
// Ajouter dans src/index.ts
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://staffing.votredomaine.com'],
  credentials: true
}));
```

### "JWT invalid"
```bash
# Regénérer secret
npx wrangler secret put JWT_SECRET
# Entrer nouveau secret (32+ chars)
```

---

## Prochaines Étapes

1. ✅ Setup infrastructure (ce guide)
2. → Lire spec complète section par section
3. → Implémenter Sprint 1 (auth + CRUD consultants)
4. → Sprint 2 (timesheets)
5. → Sprint 3 (dashboards)
6. → Sprint 4 (chat + MCP)
7. → Sprint 5 (deploy production)

**Bon dev ! 🚀**
