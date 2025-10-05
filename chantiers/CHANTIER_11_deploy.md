# CHANTIER 11 : Tests E2E + Déploiement Production

> **Durée** : 3j | **Dépend de** : 08, 10 | **Suivant** : Production! | **Coverage** : 85%+

## 🎯 Objectifs

✅ Suite complète tests E2E (50+ scénarios)
✅ Tests performance + sécurité
✅ Déploiement production
✅ Monitoring + alertes

## ✅ Tests E2E Complets

### User Flows Critiques

```typescript
// tests/e2e/consultant-flow.spec.ts
test('Consultant complet flow', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.fill('[name="email"]', 'consultant@test.com');
  await page.fill('[name="password"]', 'Test1234!');
  await page.click('button[type="submit"]');

  // Dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('h1')).toContainText('Dashboard');

  // Saisie temps
  await page.click('text=Saisie Temps');
  await page.selectOption('[name="project"]', 'Alpha');
  await page.click('button:has-text("Journée")');
  await page.click('button:has-text("Soumettre")');

  // Vérifier toast success
  await expect(page.locator('.toast-success')).toContainText('1 jour saisi');

  // Vérifier dashboard mis à jour
  await page.click('text=Dashboard');
  await expect(page.locator('.stat-jours-mois')).toContainText('1');
});

// tests/e2e/owner-validation-flow.spec.ts
test('Owner validation flow', async ({ page }) => {
  // Login owner
  await loginAs(page, 'owner@test.com', 'Test1234!');

  // Voir timesheets pending
  await page.click('text=Validation');
  const pending = page.locator('.timesheet-pending');
  await expect(pending).toBeVisible();

  // Valider
  await page.click('.timesheet-pending >> button:has-text("Valider")');
  await expect(page.locator('.toast-success')).toContainText('Validé');

  // Vérifier timesheet validé
  await page.click('text=Historique');
  await expect(page.locator('.status-validated')).toBeVisible();
});

// tests/e2e/directeur-cjr-flow.spec.ts
test('Directeur CJR access', async ({ page }) => {
  await loginAs(page, 'directeur@test.com', 'Admin1234!');

  await page.click('text=Dashboard Directeur');

  // Activer CJR
  await page.check('input[type="checkbox"]');

  // Vérifier colonnes CJR visibles
  await expect(page.locator('th:has-text("CJR")')).toBeVisible();
  await expect(page.locator('th:has-text("CJN")')).toBeVisible();

  // Vérifier alerte audit
  await expect(page.locator('.alert-warning')).toContainText('Audit enregistré');
});

// tests/e2e/chat-flow.spec.ts
test('Chat conversationnel', async ({ page }) => {
  await loginAs(page, 'consultant@test.com', 'Test1234!');

  await page.click('text=Chat');

  // Saisie via chat
  await page.fill('[placeholder*="Saisis"]', 'Saisis 1 jour projet Alpha aujourd\'hui');
  await page.press('[placeholder*="Saisis"]', 'Enter');

  // Attendre réponse IA
  await page.waitForSelector('.message-assistant');
  await expect(page.locator('.message-assistant').last()).toContainText('saisi');

  // Vérifier donnée créée
  await page.click('text=Dashboard');
  await expect(page.locator('.stat-jours-mois')).toContainText('1');
});
```

### Tests Performance

```typescript
// tests/e2e/performance.spec.ts
test('Page load under 2s', async ({ page }) => {
  const start = Date.now();
  await page.goto('/dashboard');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(2000);
});

test('API response under 200ms', async ({ request }) => {
  const start = Date.now();
  await request.get('/api/consultants', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const responseTime = Date.now() - start;

  expect(responseTime).toBeLessThan(200);
});
```

### Tests Sécurité

```typescript
// tests/e2e/security.spec.ts
test('SQL injection protection', async ({ request }) => {
  const res = await request.get('/api/consultants?id=1\' OR \'1\'=\'1', {
    headers: { Authorization: `Bearer ${token}` }
  });

  expect(res.status()).not.toBe(200);
});

test('XSS protection', async ({ page }) => {
  await page.fill('[name="nom"]', '<script>alert("XSS")</script>');
  await page.click('button:has-text("Enregistrer")');

  // Le script ne doit pas s'exécuter
  page.on('dialog', () => fail('XSS executed!'));
  await page.waitForTimeout(1000);
});

test('CSRF protection', async ({ request }) => {
  const res = await request.post('/api/consultants', {
    data: { nom: 'Test' }
    // Sans token CSRF ni JWT
  });

  expect(res.status()).toBe(401);
});
```

## 🚀 Déploiement Production

### CI/CD GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm run bootstrap
      - run: npm run test:all
      - run: npm run test:e2e

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: api
          command: deploy --env production

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd frontend && npm install && npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy frontend/dist --project-name=staffing-frontend
```

### Monitoring

```typescript
// api/src/middleware/monitoring.ts
export async function monitoringMiddleware(c: Context, next: Next) {
  const start = Date.now();

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  // Log métriques
  console.log(JSON.stringify({
    method: c.req.method,
    path: c.req.path,
    status,
    duration,
    timestamp: new Date().toISOString()
  }));

  // Alertes si erreurs
  if (status >= 500) {
    await sendAlert({
      level: 'error',
      message: `API Error: ${c.req.method} ${c.req.path} - ${status}`,
      duration
    });
  }
}
```

### Health Checks

```typescript
app.get('/health', async (c) => {
  // Check DB
  try {
    await c.env.DB.prepare('SELECT 1').first();
  } catch (e) {
    return c.json({ status: 'unhealthy', db: 'down' }, 503);
  }

  // Check Gemini API
  try {
    await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro`, {
      headers: { 'x-goog-api-key': c.env.GEMINI_API_KEY }
    });
  } catch (e) {
    return c.json({ status: 'unhealthy', gemini: 'down' }, 503);
  }

  return c.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: Date.now()
  });
});
```

## 📤 Livrables

- 50+ tests E2E (tous les user flows)
- Tests performance + sécurité
- CI/CD GitHub Actions
- Monitoring + alertes
- Health checks
- Documentation déploiement

## ✅ Validation Finale

```bash
# Tests E2E
npm run test:e2e

# Performance
npm run test:perf

# Sécurité
npm run test:security

# Déploiement
git push origin main  # Déclenche CI/CD

# Vérifier production
curl https://staffing-api.xxx.workers.dev/health
curl https://staffing-frontend.pages.dev
```

### Checklist Go-Live

- [ ] Tous les tests passent (unit + integration + E2E)
- [ ] Coverage >= 85%
- [ ] Performance < 2s page load, < 200ms API
- [ ] Sécurité testée (SQL injection, XSS, CSRF)
- [ ] CI/CD configuré
- [ ] Monitoring + alertes actifs
- [ ] Health checks opérationnels
- [ ] Secrets production configurés
- [ ] Formation utilisateurs complétée
- [ ] Documentation à jour

---

## 🎉 Production Ready!

**Application déployée et opérationnelle** ✅

URLs Production :
- **API** : https://staffing-api.xxx.workers.dev
- **Frontend** : https://staffing-frontend.pages.dev

**Métriques** :
- Coverage : 85%+
- Tests : 200+ (unit + integration + E2E)
- Performance : <2s page load
- Coût hébergement : 7-12€/mois

**ROI** : 228% | **Payback** : 5.3 mois

---

_Chantier 11 : Deploy Production_
_Projet Staffing ESN : COMPLET_ 🚀
