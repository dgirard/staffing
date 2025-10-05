# Guide de Test Frontend - Staffing ESN

Guide pour tester l'interface utilisateur React du projet Staffing ESN.

---

## 🚀 Démarrage Rapide

### 1. Prérequis

Assurez-vous que l'API backend est démarrée :

```bash
# Dans un terminal
cd api
npm run dev
# API accessible sur http://localhost:8787
```

### 2. Démarrer le Frontend

```bash
# Dans un autre terminal
cd frontend
npm run dev
# Frontend accessible sur http://localhost:5173
```

### 3. Ouvrir dans le navigateur

Ouvrez votre navigateur sur : **http://localhost:5173**

---

## 🖥️ Interface Actuelle

### Page d'Accueil (Demo)

L'application affiche actuellement une page de démonstration qui vérifie la connexion avec l'API backend.

**Ce que vous devriez voir :**

```
🏢 Staffing ESN
CHANTIER_00 - Setup Infrastructure

✅ Status

Frontend
✅ running
React 18 + Vite + Tailwind CSS

API
✅ connected
Staffing ESN API - Production Ready

✅ Infrastructure fonctionnelle !
Version API: 0.11.1

Prêt pour CHANTIER_01 : Auth JWT + RBAC
```

**Si la connexion API échoue :**
- Statut API : ❌ disconnected
- Vérifier que l'API tourne sur http://localhost:8787
- Vérifier le fichier `frontend/.env` contient `VITE_API_URL=http://localhost:8787`

---

## 📁 Structure du Frontend

```
frontend/
├── src/
│   ├── App.tsx              # Composant principal
│   ├── main.tsx             # Point d'entrée
│   ├── components/          # Composants réutilisables (à implémenter)
│   ├── pages/               # Pages de l'application (à implémenter)
│   ├── services/            # Services API (à implémenter)
│   ├── stores/              # State management Zustand (à implémenter)
│   ├── hooks/               # Custom hooks React (à implémenter)
│   ├── types/               # Types TypeScript (à implémenter)
│   ├── utils/               # Utilitaires (à implémenter)
│   └── styles/
│       └── index.css        # Styles globaux Tailwind
├── .env                     # Variables d'environnement
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔧 Configuration

### Variables d'Environnement

Fichier `frontend/.env` :

```env
# Development environment
VITE_API_URL=http://localhost:8787
```

**Note** : Toutes les variables d'environnement pour Vite doivent commencer par `VITE_`

### Accès dans le code

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 🧪 Tests

### Tests Unitaires (Vitest)

```bash
# Lancer les tests une fois
npm run test

# Mode watch (relance automatique)
npm run test:watch

# Interface UI pour les tests
npm run test:ui

# Coverage
npm run test:coverage
```

### Tests E2E (Playwright)

```bash
# Lancer les tests E2E
npm run test:e2e

# Avec interface UI
npm run test:e2e:ui

# Mode headed (voir le navigateur)
npm run test:e2e:headed
```

### Tous les tests

```bash
npm run test:all
```

---

## 🛠️ Outils de Développement

### TypeScript Type Check

```bash
npm run typecheck
```

### Build de Production

```bash
npm run build
```

Le build génère les fichiers dans `frontend/dist/`

### Preview du Build

```bash
npm run preview
```

Teste le build de production localement sur http://localhost:4173

---

## 🎨 Stack Technique

### Frontend Framework
- **React 18** - Library UI
- **TypeScript** - Type safety
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Utility-first CSS

### State Management
- **Zustand** - State management léger
- **TanStack Query (React Query)** - Data fetching et cache

### Routing
- **React Router v6** - Navigation SPA

### Testing
- **Vitest** - Tests unitaires (compatible Vite)
- **Playwright** - Tests E2E
- **Testing Library** - Tests composants React

### PWA
- **Vite PWA Plugin** - Progressive Web App
- **Workbox** - Service workers

### Utilitaires
- **date-fns** - Manipulation de dates

---

## 📋 Fonctionnalités à Implémenter

Le frontend est actuellement en phase CHANTIER_00 (infrastructure). Les fonctionnalités suivantes sont à développer :

### CHANTIER_01 : Authentification
- [ ] Page de login
- [ ] Page de register
- [ ] Gestion du token JWT
- [ ] Route protégée avec AuthGuard
- [ ] Store Zustand pour l'auth

### CHANTIER_02 : Dashboard
- [ ] Dashboard consultant
- [ ] Dashboard chef de projet
- [ ] Dashboard administrateur
- [ ] Dashboard directeur (avec CJR)

### CHANTIER_03 : Gestion Consultants
- [ ] Liste des consultants
- [ ] Formulaire création consultant
- [ ] Édition consultant
- [ ] Détails consultant

### CHANTIER_04 : Gestion Projets
- [ ] Liste des projets
- [ ] Formulaire création projet
- [ ] Édition projet
- [ ] Détails projet avec interventions

### CHANTIER_05 : Timesheets
- [ ] Calendrier de saisie
- [ ] Formulaire timesheet
- [ ] Vue hebdomadaire
- [ ] Vue mensuelle
- [ ] Statuts (brouillon, soumis, validé, rejeté)

### CHANTIER_06 : Validations
- [ ] Liste des validations en attente
- [ ] Actions bulk (tout valider/tout rejeter)
- [ ] Historique validations

### CHANTIER_07 : Marges & Analytics
- [ ] Graphiques de marges (CJN/CJR)
- [ ] KPIs par projet
- [ ] Taux d'utilisation consultants
- [ ] Charts avec Recharts ou Chart.js

### CHANTIER_08 : Chat IA
- [ ] Interface chat avec Gemini
- [ ] Historique conversations
- [ ] Suggestions d'actions
- [ ] NLU pour commandes vocales

### CHANTIER_09 : Audit & Logs
- [ ] Vue des logs d'accès CJR
- [ ] Filtres par utilisateur/date
- [ ] Export CSV

### CHANTIER_10 : PWA & Offline
- [ ] Service worker
- [ ] Cache API
- [ ] Mode offline
- [ ] Notifications push

---

## 🎯 Exemples de Composants à Créer

### Service API (`src/services/api.ts`)

```typescript
const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  // Protected requests
  fetchWithAuth: async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.json();
  },
};
```

### Auth Store (`src/stores/authStore.ts`)

```typescript
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email, password) => {
    const response = await api.login(email, password);
    if (response.success) {
      localStorage.setItem('token', response.data.token);
      set({
        token: response.data.token,
        user: response.data.user,
        isAuthenticated: true
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
```

### Page Login (`src/pages/Login.tsx`)

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Connexion</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
```

---

## 🔍 Debugging

### React DevTools

Installer l'extension React DevTools pour Chrome/Firefox :
- https://react.dev/learn/react-developer-tools

### Vite DevTools

Les erreurs de build apparaissent directement dans le terminal et dans le navigateur avec overlay.

### Console du Navigateur

Ouvrir les DevTools (F12) pour voir :
- Logs console
- Network requests
- React component tree

### Inspecter les Requêtes API

Dans l'onglet Network des DevTools :
- Filtrer par "Fetch/XHR"
- Vérifier les headers (Authorization: Bearer ...)
- Vérifier les payloads
- Vérifier les status codes (200, 401, 500...)

---

## 🚨 Troubleshooting

### Port 5173 déjà utilisé

```bash
# Trouver et tuer le processus
lsof -ti:5173 | xargs kill -9
```

### Erreur CORS

Si vous voyez des erreurs CORS dans la console :
1. Vérifier que l'API autorise `http://localhost:5173` dans ses origins CORS
2. Fichier `api/src/index.ts` ligne ~20 :
```typescript
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
```

### API non accessible

Vérifier :
1. L'API est démarrée (`npm run dev` dans `api/`)
2. L'URL dans `.env` est correcte : `VITE_API_URL=http://localhost:8787`
3. Tester l'API directement : `curl http://localhost:8787/health`

### Hot Reload ne fonctionne pas

```bash
# Redémarrer Vite
# Ctrl+C puis
npm run dev
```

### Build échoue

```bash
# Vérifier les erreurs TypeScript
npm run typecheck

# Nettoyer et rebuild
rm -rf dist node_modules
npm install
npm run build
```

---

## 📚 Ressources Utiles

### Documentation
- **React** : https://react.dev
- **Vite** : https://vitejs.dev
- **Tailwind CSS** : https://tailwindcss.com
- **React Router** : https://reactrouter.com
- **Zustand** : https://zustand-demo.pmnd.rs
- **TanStack Query** : https://tanstack.com/query
- **Vitest** : https://vitest.dev
- **Playwright** : https://playwright.dev

### Tailwind UI Components
- **Headless UI** : https://headlessui.com (accessible components)
- **Heroicons** : https://heroicons.com (icônes SVG)
- **Tailwind UI** : https://tailwindui.com (payant mais excellent)

### Charts & Visualizations
- **Recharts** : https://recharts.org
- **Chart.js** : https://www.chartjs.org
- **Apache ECharts** : https://echarts.apache.org

---

## ✅ Checklist de Test Frontend

Avant de considérer une fonctionnalité complète :

- [ ] Page s'affiche correctement
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states (spinners, skeletons)
- [ ] Error states (messages d'erreur clairs)
- [ ] Success feedback (toasts, messages)
- [ ] Validation formulaires
- [ ] TypeScript sans erreur (`npm run typecheck`)
- [ ] Tests unitaires passent (`npm run test`)
- [ ] Tests E2E passent (`npm run test:e2e`)
- [ ] Build de production réussit (`npm run build`)
- [ ] Pas d'erreurs console
- [ ] Accessibilité (ARIA, keyboard navigation)
- [ ] Performance (Lighthouse score > 90)

---

## 🎨 Design System Recommandé

### Couleurs

```css
/* Palette Staffing ESN */
primary: #3B82F6 (blue-500)
secondary: #6366F1 (indigo-500)
success: #10B981 (green-500)
warning: #F59E0B (amber-500)
danger: #EF4444 (red-500)
gray: #6B7280 (gray-500)
```

### Spacing

Utiliser les classes Tailwind standard :
- `p-4`, `m-4` (1rem = 16px)
- `space-y-4`, `gap-4`

### Typography

```css
h1: text-4xl font-bold
h2: text-3xl font-semibold
h3: text-2xl font-semibold
body: text-base
small: text-sm
```

---

## 🚀 Prochaines Étapes

1. **Implémenter l'authentification**
   - Pages login/register
   - Auth store avec Zustand
   - Protected routes

2. **Créer les composants de base**
   - Button, Input, Card, Modal
   - Layout avec Sidebar + Navbar
   - Loader, Toast notifications

3. **Développer le Dashboard**
   - Role-based dashboards
   - KPI cards
   - Charts avec Recharts

4. **Intégrer l'API**
   - Service API avec fetch
   - React Query pour le cache
   - Error handling global

---

**Frontend prêt pour le développement !** ✅

Pour accéder : **http://localhost:5173**

API connectée sur : **http://localhost:8787**
