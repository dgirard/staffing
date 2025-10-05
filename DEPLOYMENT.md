# Deployment Guide - Staffing ESN

Guide de déploiement pour l'application Staffing ESN sur Cloudflare Workers et Pages.

---

## 📋 Prérequis

- Compte Cloudflare avec Workers et Pages activés
- Node.js 20+ installé
- Wrangler CLI installé : `npm install -g wrangler`
- Clé API Gemini (optionnel, pour le chat IA)

---

## 🔐 Configuration des Secrets

### 1. Cloudflare Account

Récupérer votre Account ID :
```bash
wrangler whoami
```

### 2. GitHub Secrets

Configurer dans **Settings > Secrets and variables > Actions** :

- `CLOUDFLARE_API_TOKEN` : Token d'API Cloudflare
  - Créer sur : https://dash.cloudflare.com/profile/api-tokens
  - Permissions : Account.Cloudflare Workers, Account.Cloudflare Pages

- `CLOUDFLARE_ACCOUNT_ID` : ID de compte Cloudflare

- `VITE_API_URL` : URL de l'API en production (après 1er déploiement)
  - Format : `https://staffing-esn-api.your-subdomain.workers.dev`

### 3. Secrets Wrangler (API)

```bash
cd api

# JWT Secret (générer une clé aléatoire forte)
wrangler secret put JWT_SECRET --env production

# Gemini API Key (optionnel)
wrangler secret put GEMINI_API_KEY --env production
```

---

## 🗄️ Configuration Base de Données

### 1. Créer la base D1

```bash
cd api

# Créer la DB en production
npx wrangler d1 create staffing-esn-db-prod

# Copier l'ID généré dans wrangler.toml sous [env.production]
```

### 2. Mettre à jour `wrangler.toml`

```toml
[env.production]
name = "staffing-esn-api-prod"

[[env.production.d1_databases]]
binding = "DB"
database_name = "staffing-esn-db-prod"
database_id = "your-production-database-id"  # ID de l'étape précédente
```

### 3. Appliquer les migrations

```bash
# Migration schema initial
npx wrangler d1 execute staffing-esn-db-prod --remote --file=./migrations/001_initial_schema.sql

# Migration seed data (optionnel en prod)
npx wrangler d1 execute staffing-esn-db-prod --remote --file=./migrations/002_seed_data.sql

# Migration audit logs
npx wrangler d1 execute staffing-esn-db-prod --remote --file=./migrations/003_audit_logs.sql
```

---

## 🚀 Déploiement

### Méthode 1 : CI/CD Automatique (Recommandé)

1. Push sur la branche `main` :
```bash
git push origin main
```

2. GitHub Actions se déclenche automatiquement :
   - Typecheck TypeScript
   - Deploy API → Cloudflare Workers
   - Deploy Frontend → Cloudflare Pages

3. Vérifier le déploiement :
   - Actions : https://github.com/dgirard/staffing/actions
   - Workers : https://dash.cloudflare.com/workers
   - Pages : https://dash.cloudflare.com/pages

### Méthode 2 : Déploiement Manuel

#### API (Workers)

```bash
cd api

# Déployer en production
npx wrangler deploy --env production

# URL générée : https://staffing-esn-api-prod.your-subdomain.workers.dev
```

#### Frontend (Pages)

```bash
cd frontend

# Build
npm run build

# Déployer
npx wrangler pages deploy dist --project-name=staffing-esn-frontend

# URL générée : https://staffing-esn-frontend.pages.dev
```

---

## 🔧 Configuration Frontend

### 1. Variables d'environnement

Créer `.env.production` dans `frontend/` :

```env
VITE_API_URL=https://staffing-esn-api-prod.your-subdomain.workers.dev
```

### 2. CORS

Vérifier que l'API autorise le domaine frontend dans `api/src/index.ts` :

```typescript
app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://staffing-esn-frontend.pages.dev',  // Ajouter en production
    'https://your-custom-domain.com'            // Si domaine personnalisé
  ],
  credentials: true,
}));
```

---

## ✅ Vérification Post-Déploiement

### 1. Health Check API

```bash
curl https://staffing-esn-api-prod.your-subdomain.workers.dev/health
```

Réponse attendue :
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "uptime": 123
}
```

### 2. Test Authentification

```bash
# Register
curl -X POST https://staffing-esn-api-prod.your-subdomain.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "nom": "Test",
    "prenom": "User",
    "role": "consultant"
  }'

# Login
curl -X POST https://staffing-esn-api-prod.your-subdomain.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

### 3. Test Frontend

Ouvrir : https://staffing-esn-frontend.pages.dev

- Page login visible
- Possibilité de se connecter
- Dashboard accessible après login

---

## 📊 Monitoring

### 1. Cloudflare Analytics

- **Workers Analytics** : https://dash.cloudflare.com/workers/analytics
  - Requêtes/s
  - Latence P50, P95, P99
  - Erreurs 4xx, 5xx

- **Pages Analytics** : https://dash.cloudflare.com/pages
  - Page views
  - Unique visitors
  - Build times

### 2. Logs en Temps Réel

```bash
# API Logs
cd api
npx wrangler tail --env production

# Filtrer par statut
npx wrangler tail --env production --status error
```

### 3. D1 Monitoring

```bash
# Taille de la DB
npx wrangler d1 info staffing-esn-db-prod

# Requêtes SQL directes (debug)
npx wrangler d1 execute staffing-esn-db-prod --remote --command "SELECT COUNT(*) FROM users"
```

---

## 🔄 Mises à Jour

### Déploiement de nouvelles versions

1. Développer et tester en local
2. Commit + Push sur `main`
3. CI/CD déploie automatiquement
4. Vérifier health checks

### Rollback en cas de problème

```bash
# API - Revenir à version précédente
cd api
npx wrangler rollback --env production

# Frontend - Redéployer version précédente
cd frontend
git checkout <previous-commit>
npm run build
npx wrangler pages deploy dist --project-name=staffing-esn-frontend
```

---

## 🛡️ Sécurité Production

### 1. Secrets

- **Jamais commiter** de secrets dans Git
- Utiliser `wrangler secret` pour tous les tokens
- Rotation régulière du JWT_SECRET (invalide tous les tokens)

### 2. CORS

- Limiter `origin` aux domaines autorisés uniquement
- Pas de wildcard `*` en production

### 3. Rate Limiting

Ajouter rate limiting dans `wrangler.toml` :

```toml
[env.production]
limits = { cpu_ms = 50 }
```

### 4. Audit Logs

- Tous les accès CJR sont loggés dans `audit_logs`
- Vérifier régulièrement : `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`

---

## 💰 Coûts Estimés

### Cloudflare Workers (API)

- **Free Tier** : 100,000 requêtes/jour
- **Paid** : $5/mois pour 10M requêtes
- **D1** : $0.50/GB stockage, $1/1M lignes lues

### Cloudflare Pages (Frontend)

- **Free Tier** : Illimité
- **Bandwidth** : Gratuit

### Gemini API (Chat IA)

- **Free Tier** : 60 requêtes/minute
- **Paid** : $0.00025/1K caractères input, $0.0005/1K output

**Total estimé** : **5-10€/mois** pour usage moyen (500 utilisateurs)

---

## 📞 Support

### En cas de problème

1. Vérifier les logs : `npx wrangler tail`
2. Vérifier health check : `/health`
3. Vérifier GitHub Actions : https://github.com/dgirard/staffing/actions
4. Consulter Cloudflare Status : https://www.cloudflarestatus.com/

### Ressources

- Cloudflare Workers : https://developers.cloudflare.com/workers/
- Cloudflare D1 : https://developers.cloudflare.com/d1/
- Cloudflare Pages : https://developers.cloudflare.com/pages/
- Wrangler CLI : https://developers.cloudflare.com/workers/wrangler/

---

## ✅ Checklist Go-Live

- [ ] Secrets configurés (JWT_SECRET, GEMINI_API_KEY)
- [ ] Base D1 créée et migrations appliquées
- [ ] wrangler.toml mis à jour (production database_id)
- [ ] GitHub Secrets configurés
- [ ] API déployée et health check OK
- [ ] Frontend déployé et accessible
- [ ] CORS configuré avec domaines production
- [ ] Authentification testée (register + login)
- [ ] MCP tools testés (si applicable)
- [ ] Monitoring configuré
- [ ] Documentation à jour

---

**Déploiement Production** : ✅ PRÊT
