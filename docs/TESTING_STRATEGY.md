# 🧪 Stratégie de Tests - Staffing ESN

> **Objectif** : Garantir la qualité du code et prévenir les régressions lors du développement par IA séquentiel

---

## 📊 Vue d'ensemble

### Pyramide de tests

```
         /\
        /  \  10% E2E (User Flows)
       /____\
      /      \  20% Integration (API + DB)
     /________\
    /          \  70% Unit (Services + Utils)
   /____________\
```

### Objectifs de coverage

| Type | Coverage Min | Coverage Cible | Critique |
|------|--------------|----------------|----------|
| **Services** | 85% | 90%+ | Auth, CJR/CJN, Validation |
| **Routes API** | 80% | 85% | Tous les endpoints |
| **Composants React** | 75% | 80% | Pages principales |
| **Global** | 80% | 85% | Projet complet |

---

## 🛠️ Technologies

### Backend (API)

**Vitest** - Framework de test rapide
```bash
npm install -D vitest @vitest/ui c8
npm install -D @cloudflare/vitest-pool-workers
```

**Avantages** :
- ⚡ Ultra rapide (Vite-powered)
- 🔄 Watch mode intelligent
- 📊 UI de coverage intégrée
- ✅ Compatible Cloudflare Workers

### Frontend

**Vitest + Testing Library** - Tests composants
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
```

**Playwright** - Tests E2E
```bash
npm install -D @playwright/test
npx playwright install
```

### Mocking

**MSW (Mock Service Worker)** - Mock API
```bash
npm install -D msw
```

---

## 📁 Organisation des Tests

### Structure API

```
api/
├── src/
│   ├── services/
│   │   └── auth.service.ts
│   └── routes/
│       └── auth.ts
└── tests/
    ├── unit/
    │   └── auth.service.test.ts      # Tests unitaires
    ├── integration/
    │   └── auth.api.test.ts          # Tests API
    └── fixtures/
        └── users.fixtures.ts          # Données de test
```

### Structure Frontend

```
frontend/
├── src/
│   ├── components/
│   │   └── TimeEntry.tsx
│   └── pages/
│       └── Dashboard.tsx
└── tests/
    ├── unit/
    │   └── TimeEntry.test.tsx         # Tests composants
    ├── e2e/
    │   └── timesheet-flow.spec.ts     # Tests E2E
    └── mocks/
        └── handlers.ts                # MSW handlers
```

---

## ✅ Tests par Couche

### 1. Tests Unitaires (70%)

**Services**

```typescript
// tests/unit/auth.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('should hash password correctly', async () => {
    const password = 'Test1234!';
    const hash = await authService.hashPassword(password);

    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
  });

  it('should verify correct password', async () => {
    const password = 'Test1234!';
    const hash = await authService.hashPassword(password);
    const isValid = await authService.verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it('should reject invalid password', async () => {
    const hash = await authService.hashPassword('Test1234!');
    const isValid = await authService.verifyPassword('WrongPass', hash);

    expect(isValid).toBe(false);
  });
});
```

**Validation & Utils**

```typescript
// tests/unit/timesheet.validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateTimeEntry } from '../src/utils/validation';

describe('Timesheet Validation', () => {
  it('should accept valid 0.5 day entry', () => {
    const entry = { jours: 0.5, periode: 'matin' };
    expect(validateTimeEntry(entry)).toBe(true);
  });

  it('should reject invalid day value', () => {
    const entry = { jours: 0.75, periode: 'matin' };
    expect(validateTimeEntry(entry)).toBe(false);
  });

  it('should reject more than 1 day per date', () => {
    const entries = [
      { jours: 0.5, periode: 'matin' },
      { jours: 0.5, periode: 'apres_midi' },
      { jours: 0.5, periode: 'journee' } // Invalid!
    ];
    expect(validateDayTotal(entries)).toBe(false);
  });
});
```

### 2. Tests d'Intégration (20%)

**API Endpoints**

```typescript
// tests/integration/consultants.api.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/index';

describe('Consultants API', () => {
  let adminToken: string;
  let directeurToken: string;

  beforeAll(async () => {
    // Setup test tokens
    adminToken = await getTestToken('administrator');
    directeurToken = await getTestToken('directeur');
  });

  it('GET /api/consultants should return consultants', async () => {
    const res = await app.request('/api/consultants', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('GET /api/consultants should hide CJR for administrator', async () => {
    const res = await app.request('/api/consultants/123', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const consultant = await res.json();
    expect(consultant.cjn).toBeDefined();
    expect(consultant.cjr).toBeUndefined(); // CJR hidden!
  });

  it('GET /api/consultants should show CJR for directeur', async () => {
    const res = await app.request('/api/consultants/123', {
      headers: { Authorization: `Bearer ${directeurToken}` }
    });

    const consultant = await res.json();
    expect(consultant.cjn).toBeDefined();
    expect(consultant.cjr).toBeDefined(); // CJR visible!
  });
});
```

**Database Queries**

```typescript
// tests/integration/database.test.ts
import { describe, it, expect } from 'vitest';
import { getDb } from '../src/db';

describe('Database Queries', () => {
  it('should create consultant with audit log', async () => {
    const db = getDb();
    const consultantId = await createConsultant(db, {
      nom: 'Test',
      cjn: 450,
      cjr: 380
    });

    // Vérifier que l'audit log est créé
    const auditLog = await db.prepare(
      'SELECT * FROM audit_logs WHERE entity_id = ?'
    ).bind(consultantId).first();

    expect(auditLog).toBeDefined();
    expect(auditLog.action).toBe('CREATE_CONSULTANT');
  });
});
```

### 3. Tests E2E (10%)

**User Flows Critiques**

```typescript
// tests/e2e/timesheet-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Timesheet Flow', () => {
  test('consultant can submit timesheet', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173');
    await page.fill('[name="email"]', 'consultant@test.com');
    await page.fill('[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');

    // Navigate to timesheet
    await page.click('text=Saisie Temps');
    await expect(page).toHaveURL(/.*timesheet/);

    // Select project
    await page.selectOption('[name="project"]', 'Alpha');

    // Select demi-journée
    await page.click('button:has-text("Matin")');

    // Submit
    await page.click('button:has-text("Soumettre")');

    // Verify success
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('0.5 jour saisi');
  });

  test('directeur can view CJR in dashboard', async ({ page }) => {
    // Login as directeur
    await page.goto('http://localhost:5173');
    await page.fill('[name="email"]', 'directeur@test.com');
    await page.fill('[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');

    // Navigate to dashboard
    await page.click('text=Dashboard Directeur');

    // Verify CJR column is visible
    await expect(page.locator('th:has-text("CJR")')).toBeVisible();
    await expect(page.locator('th:has-text("CJN")')).toBeVisible();
  });
});
```

---

## 🎯 Coverage par Chantier

### Objectifs minimums

| Chantier | Coverage Min | Tests Critiques |
|----------|--------------|-----------------|
| 00 - Setup | 0% | Infrastructure smoke tests |
| 01 - Auth | 90% | JWT, RBAC, Password hashing |
| 02 - Database | 85% | Migrations, Contraintes, Vues |
| 03 - CRUD Base | 85% | CJR/CJN separation, Audit |
| 04 - Interventions | 85% | Conflits dates, Allocation |
| 05 - Timesheet | 90% | Validation 0.5j/1j, Max 1j/jour |
| 06 - Validation | 90% | Workflow états, Permissions |
| 07 - Dashboards | 80% | Agrégations, Filtres |
| 08 - Directeur | 90% | CJR access control, Audit |
| 09 - Chat | 80% | Intentions, Rate limiting |
| 10 - MCP | 85% | Tools, Protocol |
| 11 - Deploy | 85% | E2E complets, Performance |

---

## 📝 Scripts Standardisés

### package.json (API)

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest tests/unit",
    "test:integration": "vitest tests/integration",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:coverage:ui": "vitest --coverage --ui"
  }
}
```

### package.json (Frontend)

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest tests/unit",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:coverage": "vitest --coverage",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### package.json (Racine)

```json
{
  "scripts": {
    "test:all": "npm run test:api && npm run test:frontend",
    "test:api": "cd api && npm test",
    "test:frontend": "cd frontend && npm run test:all",
    "test:coverage": "npm run test:api -- --coverage && npm run test:frontend -- --coverage"
  }
}
```

---

## 🔄 CI/CD - Tests Automatiques

### GitHub Actions

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd api && npm ci
      - run: cd api && npm test
      - run: cd api && npm run test:coverage

      # Fail si coverage < 85%
      - name: Check coverage
        run: |
          COVERAGE=$(jq '.total.lines.pct' api/coverage/coverage-summary.json)
          if (( $(echo "$COVERAGE < 85" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 85%"
            exit 1
          fi

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
      - run: cd frontend && npx playwright install
      - run: cd frontend && npm run test:e2e

  deploy:
    needs: [test-api, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: cloudflare/wrangler-action@v3
        # Deploy only if tests pass
```

---

## ✅ Checklist Validation par Chantier

Avant de créer le handoff :

### Tests

- [ ] **Tous les tests passent** : `npm run test:all` ✅ green
- [ ] **Coverage >= 85%** : `npm run test:coverage`
- [ ] **Aucune régression** : Tests chantiers précédents passent toujours
- [ ] **Tests E2E critiques** : Features principales testées E2E

### Qualité

- [ ] **Pas de console.log** : Code nettoyé
- [ ] **Pas de TODO** : Tâches complétées ou déplacées
- [ ] **Pas de code commenté** : Code mort supprimé
- [ ] **ESLint/Prettier** : Pas d'erreurs

### Documentation

- [ ] **Tests documentés** : Fichiers de test lisibles
- [ ] **Fixtures claires** : Données de test explicites
- [ ] **Edge cases couverts** : Cas limites testés

---

## 🆘 Troubleshooting Tests

### Test qui timeout

```typescript
// Augmenter le timeout pour ce test
it('should process large dataset', { timeout: 10000 }, async () => {
  // Test long
});
```

### Mock API Gemini

```typescript
// tests/mocks/gemini.mock.ts
import { vi } from 'vitest';

export const mockGeminiAPI = vi.fn().mockResolvedValue({
  candidates: [{
    content: {
      parts: [{ text: 'Mocked response' }]
    }
  }]
});
```

### Reset DB entre tests

```typescript
beforeEach(async () => {
  // Reset DB to seed state
  await resetDatabase();
});
```

---

## 📚 Ressources

- **Vitest** : https://vitest.dev/
- **Testing Library** : https://testing-library.com/
- **Playwright** : https://playwright.dev/
- **MSW** : https://mswjs.io/
- **Cloudflare Workers Testing** : https://developers.cloudflare.com/workers/testing/

---

## 🎉 Conclusion

Une stratégie de tests solide garantit :

✅ **Confiance** dans les modifications
✅ **Prévention** des régressions
✅ **Documentation** vivante du comportement attendu
✅ **Refactoring** en toute sécurité
✅ **Handoff** validé entre IA

**Tests = Assurance qualité du développement séquentiel par IA**

---

_Document créé : Janvier 2025_
_Version : 1.0_
_Projet : Staffing ESN_
