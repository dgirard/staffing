# Guide de Contribution - Staffing ESN

Merci de votre intérêt pour contribuer au projet Staffing ESN ! Ce guide vous aidera à comprendre notre workflow de développement basé sur les **chantiers**.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Prérequis](#prérequis)
- [Workflow de développement](#workflow-de-développement)
- [Structure des chantiers](#structure-des-chantiers)
- [Standards de code](#standards-de-code)
- [Tests](#tests)
- [Pull Requests](#pull-requests)
- [Handoffs](#handoffs)

## 🎯 Vue d'ensemble

Ce projet est organisé en **12 chantiers séquentiels**. Chaque chantier :
- Est une unité de travail autonome
- Peut être développé par une IA ou un humain
- Nécessite un handoff à la fin
- Débloque le chantier suivant

## 🔧 Prérequis

### Outils requis
- Node.js ≥18.0.0
- npm ou pnpm
- Git
- Compte Cloudflare (pour déploiement)

### Installation

```bash
# Cloner le repo
git clone <repo-url>
cd staff

# Bootstrap (installe toutes les dépendances)
npm run bootstrap

# Lancer l'app en local avec seed data
npm run dev:seed
```

## 🚀 Workflow de développement

### 1. Choisir un chantier

Consultez `chantiers/_ETAT_GLOBAL.json` pour voir les chantiers disponibles :

```bash
cat chantiers/_ETAT_GLOBAL.json | jq '.chantier_actuel'
```

### 2. Lire la spec du chantier

```bash
# Exemple pour CHANTIER_00
cat chantiers/CHANTIER_00_setup.md
```

### 3. Créer une branche

```bash
git checkout -b chantier-XX-nom-descriptif
```

### 4. Développer selon la spec

- Suivre **exactement** les tâches listées dans le chantier
- Créer les fichiers demandés
- Implémenter les fonctionnalités
- **Respecter les contraintes** (RBAC, validation, etc.)

### 5. Écrire les tests

#### Tests requis (minimum)

- **API** : 85% coverage (unit + intégration)
- **Frontend** : 80% coverage (unit + intégration)
- **E2E** : Flows critiques

```bash
# Lancer les tests
cd api && npm run test:coverage
cd frontend && npm run test:coverage
cd frontend && npm run test:e2e
```

### 6. Vérifier la qualité

```bash
# TypeCheck
cd api && npm run typecheck
cd frontend && npm run typecheck

# Lint
cd frontend && npm run lint

# Build
npm run build
```

### 7. Créer le handoff

Utilisez le template :

```bash
cp chantiers/_TEMPLATE_HANDOFF.md chantiers/handoffs/HANDOFF_XX.md
```

Remplissez **toutes les sections** :
- Tâches accomplies
- Fichiers créés/modifiés
- Problèmes rencontrés
- Instructions pour le prochain chantier

### 8. Mettre à jour l'état global

```json
// chantiers/_ETAT_GLOBAL.json
{
  "chantier_actuel": {
    "numero": "XX",
    "statut": "completed"
  },
  "chantiers_completes": [..., "XX"],
  // ...
}
```

### 9. Créer une Pull Request

```bash
git add .
git commit -m "chantier-XX: Description succincte"
git push origin chantier-XX-nom-descriptif
```

Utilisez le template de PR (généré automatiquement).

## 📁 Structure des chantiers

```
chantiers/
├── _GUIDE_CHANTIERS.md          # Guide complet
├── _TEMPLATE_HANDOFF.md         # Template handoff
├── _ETAT_GLOBAL.json           # État machine du projet
├── CHANTIER_00_setup.md        # Setup infra
├── CHANTIER_01_auth.md         # Auth JWT + RBAC
├── ...
├── CHANTIER_11_deploy.md       # Deploy production
└── handoffs/
    ├── HANDOFF_00_EXAMPLE.md   # Exemple
    └── HANDOFF_XX.md           # Vos handoffs
```

## 🎨 Standards de code

### TypeScript

- **Strict mode** activé
- Typer explicitement les paramètres et retours de fonction
- Pas de `any` (sauf cas exceptionnels justifiés)
- Utiliser Zod pour validation runtime

### Naming conventions

```typescript
// Fichiers
my-component.tsx        // kebab-case
MyService.ts           // PascalCase pour services
auth.service.test.ts   // Tests

// Variables & fonctions
const userName = "..."           // camelCase
function getUserById() {}        // camelCase

// Interfaces & Types
interface User {}                // PascalCase
type UserRole = "..."           // PascalCase

// Constantes
const MAX_RETRIES = 3           // UPPER_SNAKE_CASE
```

### Structure API (Hono)

```typescript
// api/src/routes/users.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, rbacMiddleware } from '@/middlewares';
import { userSchema } from '@/schemas';

const app = new Hono();

app.get(
  '/users/:id',
  authMiddleware,
  rbacMiddleware(['administrator', 'project_owner']),
  async (c) => {
    // Implementation
  }
);

export default app;
```

### Structure Frontend (React)

```typescript
// frontend/src/components/UserCard.tsx
import { FC } from 'react';

interface UserCardProps {
  userId: string;
  displayRole?: boolean;
}

export const UserCard: FC<UserCardProps> = ({
  userId,
  displayRole = false
}) => {
  // Implementation
  return (
    <div className="rounded-lg border p-4">
      {/* Tailwind CSS */}
    </div>
  );
};
```

## 🧪 Tests

### Tests unitaires (Vitest)

```typescript
// api/src/services/auth.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should hash password correctly', async () => {
    const password = 'test123';
    const hashed = await authService.hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(20);
  });

  // ... plus de tests
});
```

### Tests E2E (Playwright)

```typescript
// frontend/tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[name="email"]', 'admin@esn.com');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## 📝 Pull Requests

### Checklist avant PR

- [ ] Tous les tests passent localement
- [ ] Coverage minimum atteint
- [ ] TypeCheck sans erreurs
- [ ] Lint sans erreurs
- [ ] Handoff créé et complet
- [ ] `_ETAT_GLOBAL.json` mis à jour
- [ ] Commit message descriptif

### Format du commit message

```
<type>(chantier-XX): <description>

<body optionnel>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

Types : `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `chantier`

### Review process

1. CI/CD doit passer (GitHub Actions)
2. Au moins 1 reviewer approuve
3. Handoff validé
4. Merge vers `main`

## 🔄 Handoffs

Un handoff de qualité contient :

### 1. Résumé exécutif
- Chantier complété
- Objectifs atteints
- Durée réelle vs estimée

### 2. Tâches accomplies
- Liste complète avec ✅
- Référence vers commits

### 3. Fichiers créés/modifiés
- Chemins complets
- Raison de chaque modification

### 4. Dépendances
- Packages npm installés
- Nouvelles deps ajoutées

### 5. Configuration
- Secrets Cloudflare ajoutés
- Variables d'env modifiées

### 6. Tests
- Résultats coverage
- Tests E2E ajoutés
- Commandes pour reproduire

### 7. Problèmes rencontrés
- Blockers résolus
- Décisions techniques
- Workarounds

### 8. Instructions pour prochain chantier
- Checklist pour CHANTIER suivant
- Fichiers à créer
- Points d'attention

### Exemple

Voir `chantiers/handoffs/HANDOFF_00_EXAMPLE.md` pour un exemple complet.

## 🆘 Besoin d'aide ?

- **Documentation** : Consultez `docs/`
- **Specs complètes** : `docs/spec-staffing-esn-finale.md`
- **Guide chantiers** : `chantiers/_GUIDE_CHANTIERS.md`
- **Dev local** : `docs/DEV_LOCAL.md`
- **Testing** : `docs/TESTING_STRATEGY.md`

## 📊 État du projet

Vérifiez toujours l'état actuel :

```bash
cat chantiers/_ETAT_GLOBAL.json | jq '.metriques'
```

---

**Bonne contribution ! 🚀**
