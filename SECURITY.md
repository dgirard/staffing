# Security Policy - Staffing ESN

## 🔐 Vue d'ensemble

La sécurité est une priorité absolue pour cette application qui gère des données sensibles :
- Informations personnelles des consultants
- Coûts réels (CJR) confidentiels
- Marges commerciales
- Données financières

---

## 🚨 Reporting Security Vulnerabilities

### Process de signalement

Si vous découvrez une faille de sécurité, **NE PAS** :
- ❌ Créer une issue publique GitHub
- ❌ Partager l'information sur des forums publics
- ❌ Exploiter la vulnérabilité

**À FAIRE** :
- ✅ Envoyer un email à : [security@esn-client.com]
- ✅ Inclure une description détaillée
- ✅ Fournir des steps de reproduction
- ✅ Suggérer un fix si possible

### Délai de réponse

- **Acknowledgement** : 48h maximum
- **Évaluation** : 5 jours ouvrés
- **Fix** : Selon criticité (voir tableau ci-dessous)

| Criticité | SLA Fix |
|-----------|---------|
| Critical | 24-48h |
| High | 1 semaine |
| Medium | 2 semaines |
| Low | 1 mois |

---

## 🛡️ Security Measures Implemented

### 1. Authentication & Authorization

#### JWT Tokens
- **Algorithme** : HS256 (HMAC with SHA-256)
- **Expiration** : 24 heures
- **Refresh** : Non implémenté (v1), à venir (v2)
- **Secret** : Stocké dans Cloudflare Secrets (chiffré)

```typescript
// ✅ Bon
const token = jwt.sign({ userId, role }, c.env.JWT_SECRET, {
  expiresIn: '24h',
  algorithm: 'HS256'
});

// ❌ Mauvais - JAMAIS ça
const token = jwt.sign({ userId, role }, 'hardcoded-secret');
```

#### RBAC (Role-Based Access Control)

4 niveaux de permissions :

```
consultant < project_owner < administrator < directeur
```

Protection systématique :
```typescript
app.get('/projects/:id',
  authMiddleware,           // Valide JWT
  rbacMiddleware(['administrator', 'directeur']),  // Check rôle
  async (c) => {
    // Handler
  }
);
```

### 2. Data Protection

#### CJR (Coût Journalier Réel) - Confidentialité maximale

**Protection multi-niveaux** :

1. **Filtrage automatique** des réponses API
```typescript
if (user.role !== 'directeur') {
  delete project.cjr;
}
```

2. **Audit trail complet**
```sql
INSERT INTO audit_logs (user_id, action, resource, timestamp)
VALUES (?, 'access_cjr', 'project:123', CURRENT_TIMESTAMP);
```

3. **Base de données** : Colonne `cjr` séparée, indexée pour détection d'accès

#### Passwords

- **Hashing** : bcrypt (cost factor 10)
- **Minimum** : 8 caractères
- **Pas de stockage en clair** - JAMAIS

```typescript
// ✅ Hash avant stockage
const hash = await bcrypt.hash(password, 10);

// ✅ Vérification
const valid = await bcrypt.compare(password, hash);
```

#### Données personnelles (RGPD)

- Chiffrement en transit (HTTPS/TLS)
- Chiffrement au repos (Cloudflare D1)
- Soft delete (pas de suppression physique)
- Logs d'accès aux données sensibles

### 3. Input Validation

#### Zod Schemas (toutes les routes)

```typescript
const createProjectSchema = z.object({
  nom: z.string().min(3).max(100),
  client: z.string().min(2).max(100),
  type: z.enum(['regie', 'forfait', 'centre_de_service']),
  cjn: z.number().positive(),
  cjr: z.number().positive().optional(),
  date_debut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

app.post('/projects',
  zValidator('json', createProjectSchema),
  async (c) => {
    const data = c.req.valid('json'); // Typé et validé
  }
);
```

#### SQL Injection Prevention

**TOUJOURS** utiliser prepared statements :

```typescript
// ✅ CORRECT - Prepared statement
const user = await db
  .prepare('SELECT * FROM users WHERE email = ?')
  .bind(email)
  .first();

// ❌ DANGER - String interpolation
const user = await db
  .prepare(`SELECT * FROM users WHERE email = '${email}'`)
  .first();
```

#### XSS Prevention

- React échappe automatiquement le JSX
- Content-Security-Policy headers
- Sanitization des inputs utilisateur
- Pas de `dangerouslySetInnerHTML` sans sanitization

### 4. Secrets Management

#### Cloudflare Secrets (Production)

```bash
# Configuration sécurisée
wrangler secret put JWT_SECRET
# Entrer le secret interactivement (pas d'historique shell)

wrangler secret put GEMINI_API_KEY
```

#### Développement local (`.dev.vars`)

```bash
# api/.dev.vars (gitignored)
JWT_SECRET=dev-secret-minimum-32-chars-long
GEMINI_API_KEY=your-dev-key-here
```

**JAMAIS** :
- ❌ Commiter `.dev.vars` dans Git
- ❌ Hardcoder des secrets dans le code
- ❌ Logger des secrets
- ❌ Envoyer secrets par email/Slack

### 5. CORS (Cross-Origin Resource Sharing)

```typescript
app.use('/*', cors({
  origin: [
    'https://staffing-frontend.pages.dev',  // Production
    'http://localhost:5173'                 // Dev
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400  // 24h
}));
```

### 6. Rate Limiting

**Cloudflare Workers Rate Limiting** :

- **Public endpoints** : 100 req/min par IP
- **Authenticated** : 500 req/min par user
- **MCP endpoints** : 1000 req/min par API key

```typescript
// Via Cloudflare Dashboard ou wrangler.toml
rate_limiting = {
  requests_per_minute = 100
}
```

### 7. HTTPS / TLS

- **Obligatoire en production** (Cloudflare automatic)
- **Certificates** : Auto-renouvelés
- **Redirect HTTP → HTTPS** : Automatique
- **HSTS** : Activé (Strict-Transport-Security)

---

## 🔍 Security Audits

### Automated Scans

#### GitHub Actions (`.github/workflows/security.yml`)

- **npm audit** : Vulnérabilités dépendances (weekly)
- **CodeQL** : Analyse statique code (on push)
- **Gitleaks** : Scan secrets dans Git history
- **Dependency Review** : Review nouvelles deps (on PR)

#### Manual Review

- **Code review** : 2 approvals minimum pour merge
- **Security checklist** : Dans PR template
- **Penetration testing** : Annuel (recommandé)

### Security Headers

```typescript
app.use('/*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
});
```

---

## 🚨 Known Vulnerabilities

### Current (v2.0)

**Aucune vulnérabilité connue**

### Fixed

_Historique des vulnérabilités corrigées apparaîtra ici_

---

## 🔐 Security Checklist (Développeurs)

### Avant chaque commit

- [ ] Pas de secrets hardcodés
- [ ] Prepared statements pour SQL
- [ ] Validation Zod sur toutes les routes
- [ ] RBAC middleware sur routes sensibles
- [ ] Tests de sécurité passent

### Avant chaque PR

- [ ] Code review security-focused
- [ ] `npm audit` clean
- [ ] CodeQL scan passed
- [ ] Gitleaks scan passed
- [ ] Documentation sécurité à jour

### Avant chaque déploiement

- [ ] Secrets configurés (wrangler secret)
- [ ] CORS origins à jour
- [ ] Rate limiting configuré
- [ ] Monitoring actif
- [ ] Rollback plan documenté

---

## 📊 Security Monitoring

### Logs & Alerts

#### Cloudflare Analytics

- Traffic anomalies (spikes)
- Error rates (500, 401, 403)
- Geographic distribution (unusual origins)

#### Custom Logs

```typescript
// Accès CJR audité
await db.prepare(`
  INSERT INTO audit_logs (user_id, action, resource, ip, timestamp)
  VALUES (?, 'access_cjr', ?, ?, CURRENT_TIMESTAMP)
`).bind(userId, resourceId, clientIP).run();
```

#### Alerting (recommandé v2)

- Email si >10 failed login attempts / 5min
- Slack si accès CJR hors bureau (22h-6h)
- PagerDuty si >5% error rate

---

## 🛠️ Incident Response Plan

### 1. Detection

- User report
- Automated alert
- Security scan

### 2. Assessment (< 1h)

- Gravité (Critical/High/Medium/Low)
- Impact (combien d'users/data)
- Exploitabilité

### 3. Containment (< 4h)

- Rollback si possible
- Disable feature si nécessaire
- Rotate secrets si compromis

### 4. Remediation

- Fix code
- Deploy patch
- Verify fix

### 5. Post-Mortem

- Root cause analysis
- Documentation
- Prevention measures

---

## 🔒 Compliance

### RGPD (GDPR)

- ✅ Consentement explicite
- ✅ Droit à l'oubli (soft delete)
- ✅ Portabilité des données (export)
- ✅ Minimisation des données
- ✅ Chiffrement en transit et au repos
- ✅ Audit trail

### ISO 27001 (Recommandations)

- Gestion des accès (RBAC)
- Logs d'audit
- Chiffrement
- Incident response plan
- Regular security audits

---

## 📚 Resources

### Security Best Practices

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security](https://developers.cloudflare.com/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### Tools

- **npm audit** : `npm audit --audit-level=moderate`
- **CodeQL** : GitHub Security tab
- **Gitleaks** : `brew install gitleaks && gitleaks detect`

---

## 📞 Contact

**Security Team** : [security@esn-client.com]
**Response Time** : 48h maximum

---

*Last updated: 2025-10-05*
*Version: 2.0*
