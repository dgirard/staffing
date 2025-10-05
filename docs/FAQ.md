# FAQ - Staffing ESN

Questions fréquemment posées sur le projet Staffing ESN.

---

## 📋 Table des matières

- [Général](#général)
- [Technique](#technique)
- [Développement](#développement)
- [Chantiers & IA](#chantiers--ia)
- [Déploiement](#déploiement)
- [Sécurité](#sécurité)
- [Business](#business)

---

## 🎯 Général

### Qu'est-ce que Staffing ESN ?

Une application web/mobile (PWA) de gestion de staffing pour ESN de 50 personnes, permettant :
- Saisie de temps en demi-journée (innovation)
- Chat conversationnel IA (80% des actions)
- Dashboards temps réel par rôle
- Double système de coûts (CJN public / CJR confidentiel)

### Pourquoi "demi-journée" ?

Plus précis que la journée complète, plus simple que les heures :
- **Matin** : 0.5j
- **Après-midi** : 0.5j
- **Journée** : 1.0j

Maximum 1 jour par date (0.5 + 0.5 = 1.0).

### Quelle est la différence entre CJN et CJR ?

| CJN (Normé) | CJR (Réel) |
|-------------|------------|
| Coût facturé au client | Coût réel du consultant |
| Visible par tous | Visible uniquement directeur |
| Utilisé pour devis | Utilisé pour calcul marges |
| Public dans l'UI | Protégé avec audit trail |

**Exemple** :
- CJN = 600€ (ce qu'on facture)
- CJR = 450€ (ce que coûte le consultant)
- **Marge = 150€/jour**

### Combien coûte l'hébergement ?

**7-12€/mois** sur Cloudflare :
- Workers : ~5€/mois (10M requêtes incluses)
- D1 Database : ~1€/mois (5GB inclus)
- Pages : Gratuit
- KV/R2 : ~1-6€/mois selon usage

**vs AWS/Azure** : 500-2000€/mois → **Économie 95%**

---

## 🛠️ Technique

### Pourquoi Cloudflare et pas AWS/Azure ?

| Critère | Cloudflare | AWS/Azure |
|---------|------------|-----------|
| **Prix** | 7-12€/mois | 500-2000€/mois |
| **Performance** | <50ms global | 100-500ms |
| **Complexité** | Faible (Workers) | Élevée (Lambda, RDS, etc.) |
| **Scaling** | Automatique | Configuration manuelle |
| **Global** | 300+ datacenters | Régions limitées |

### Pourquoi Hono et pas Express ?

**Hono** est conçu pour edge computing :
- Ultra-léger (~13KB vs ~200KB Express)
- Supporte Cloudflare Workers nativement
- Middleware moderne (async/await)
- Type-safe avec TypeScript
- Validation Zod intégrée

### Pourquoi D1 (SQLite) et pas PostgreSQL ?

**D1** est SQLite distribué sur Cloudflare :
- Serverless (pas de serveur à gérer)
- Globalement répliqué (lecture rapide)
- Pas de cold start
- Gratuit jusqu'à 5GB
- SQL standard (facile migration si besoin)

Pour 50 personnes × 20 jours/mois × 12 mois = **12,000 lignes/an** → SQLite suffit largement.

### Le chat IA fonctionne comment ?

**Architecture en 5 étapes** :

```
User: "Quel est mon taux d'utilisation ?"
  ↓
1. NLU detect intent → "consulter_utilisation"
  ↓
2. Query DB → taux = 85%
  ↓
3. Format context pour Gemini
  ↓
4. Call Gemini API
  ↓
5. Response: "Votre taux est de 85%, excellent travail !"
```

**10 intents supportés** : saisie temps, utilisation, projets, validation, marges, export, etc.

### MCP c'est quoi ?

**Model Context Protocol** : Standard pour connecter des LLMs (Claude, ChatGPT) à des outils externes.

Notre API expose **5 outils MCP** :
- `create_timesheet` - Créer saisie temps
- `get_utilization` - Taux d'utilisation
- `get_project_margins` - Marges (directeur only)
- `list_consultants` - Liste consultants
- `validate_timesheet` - Validation

**Usage** : Configurer Claude Desktop pour utiliser notre MCP Server → Claude peut créer des timesheets, valider, etc. via conversation naturelle.

---

## 💻 Développement

### Comment démarrer en local ?

```bash
# 1. Clone
git clone <repo-url>
cd staff

# 2. Install
npm run bootstrap

# 3. Configure secrets
cp api/.dev.vars.example api/.dev.vars
# Éditer api/.dev.vars avec JWT_SECRET et GEMINI_API_KEY

# 4. Start
npm run dev
```

✅ Ouvrir http://localhost:5173

### Où trouver les secrets pour dev local ?

**JWT_SECRET** : Générer un random 32+ chars
```bash
openssl rand -base64 32
```

**GEMINI_API_KEY** : Obtenir sur https://ai.google.dev/
1. Créer un compte Google AI Studio
2. Créer une API key
3. Copier dans `api/.dev.vars`

### Les tests ne passent pas, que faire ?

**Checklist** :

1. **Dépendances installées ?**
   ```bash
   cd api && npm install
   cd frontend && npm install
   ```

2. **TypeScript compile ?**
   ```bash
   npm run typecheck
   ```

3. **Tests unitaires seuls ?**
   ```bash
   npm run test -- --reporter=verbose
   ```

4. **Nettoyer cache ?**
   ```bash
   rm -rf node_modules coverage .cache
   npm install
   ```

5. **Vérifier .dev.vars ?**
   Doit contenir JWT_SECRET et GEMINI_API_KEY

### Comment ajouter une nouvelle route API ?

```typescript
// 1. Créer le schema (api/src/schemas/thing.ts)
import { z } from 'zod';

export const createThingSchema = z.object({
  name: z.string().min(3),
  value: z.number().positive()
});

// 2. Créer la route (api/src/routes/things.ts)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, rbacMiddleware } from '@/middlewares';
import { createThingSchema } from '@/schemas/thing';

const app = new Hono();

app.post('/',
  authMiddleware,
  rbacMiddleware(['administrator']),
  zValidator('json', createThingSchema),
  async (c) => {
    const data = c.req.valid('json');
    // ... logique
    return c.json({ id: 'thing_123', ...data }, 201);
  }
);

export default app;

// 3. Enregistrer dans api/src/index.ts
import things from './routes/things';
app.route('/things', things);

// 4. Écrire tests (api/src/routes/things.test.ts)
import { describe, it, expect } from 'vitest';
// ... tests
```

---

## 🏗️ Chantiers & IA

### C'est quoi un "chantier" ?

Une **unité de travail autonome** développable par une IA ou un humain, contenant :
- Objectif clair
- Tâches détaillées
- Critères d'acceptation
- Tests requis
- Durée estimée

**12 chantiers** : 00 (setup) → 11 (deploy)

### Pourquoi développer par chantiers ?

**Avantages** :
- ✅ Contexte limité (IA peut tout tenir en mémoire)
- ✅ Testable isolément
- ✅ Parallélisable (plusieurs IAs)
- ✅ Handoffs clairs entre IAs
- ✅ Rollback facile si problème

### Comment une IA prend le relai ?

**Process handoff** :

```bash
# 1. IA précédente crée handoff
cp chantiers/_TEMPLATE_HANDOFF.md chantiers/handoffs/HANDOFF_01.md
# Rempli toutes les sections

# 2. IA suivante lit handoff
cat chantiers/handoffs/HANDOFF_01.md

# 3. IA suivante lit spec chantier suivant
cat chantiers/CHANTIER_02_database.md

# 4. IA développe selon spec
# 5. IA crée HANDOFF_02.md
```

### Peut-on changer d'IA entre chantiers ?

**Oui, c'est le but !**

Exemples :
- Claude Code fait CHANTIER_00
- ChatGPT fait CHANTIER_01
- Retour à Claude pour CHANTIER_02
- etc.

Le **handoff** assure la continuité.

### Que contient un handoff ?

8 sections obligatoires :

1. **Résumé** : Ce qui a été fait
2. **Tâches** : Liste complète avec ✅
3. **Fichiers** : Créés/modifiés
4. **Dépendances** : npm packages ajoutés
5. **Configuration** : Secrets, env vars
6. **Tests** : Coverage, commandes
7. **Problèmes** : Rencontrés et résolus
8. **Instructions** : Pour prochain chantier

Voir `chantiers/handoffs/HANDOFF_00_EXAMPLE.md`

---

## 🚀 Déploiement

### Comment déployer en production ?

**Prérequis** :
- Compte Cloudflare
- wrangler CLI installé
- Secrets configurés

**Steps** :

```bash
# 1. Déployer D1 database
wrangler d1 create staffing-db
# Note le database_id

# 2. Configurer secrets
wrangler secret put JWT_SECRET
wrangler secret put GEMINI_API_KEY

# 3. Deploy API
cd api
npx wrangler deploy

# 4. Build frontend
cd frontend
npm run build

# 5. Deploy frontend
npx wrangler pages deploy dist --project-name=staffing-esn

# 6. Configurer domaine custom (optionnel)
```

### Comment configurer un domaine custom ?

**Cloudflare Dashboard** :

1. **Workers** :
   - Workers & Pages → staffing-api
   - Settings → Domains & Routes
   - Add custom domain : `api.votre-esn.com`

2. **Pages** :
   - Workers & Pages → staffing-esn
   - Custom domains → Add
   - `app.votre-esn.com`

3. **DNS** :
   - Automatiquement configuré par Cloudflare

### Les migrations DB comment ça marche ?

```bash
# Local (dev)
wrangler d1 execute staffing-db --local --file=migrations/001_initial.sql
wrangler d1 execute staffing-db --local --file=migrations/002_seed.sql

# Production
wrangler d1 execute staffing-db --remote --file=migrations/001_initial.sql

# Vérifier
wrangler d1 execute staffing-db --remote --command="SELECT * FROM users LIMIT 5"
```

### Comment rollback en cas de problème ?

**API (Workers)** :

```bash
# Lister versions
wrangler deployments list

# Rollback
wrangler rollback [DEPLOYMENT_ID]
```

**Frontend (Pages)** :

Cloudflare Dashboard → Pages → Deployments → Rollback to previous

**Database** :

Pas de rollback auto → Utiliser migrations down (à créer).

---

## 🔐 Sécurité

### Comment sont protégés les secrets ?

**3 niveaux** :

1. **Local dev** : `.dev.vars` (gitignored)
2. **Production** : Cloudflare Secrets (chiffrés)
3. **Code** : Jamais hardcodé

```bash
# Production - Jamais visible
wrangler secret put JWT_SECRET
# Enter secret: [masqué]

# Utilisation
c.env.JWT_SECRET  // Accessible uniquement en runtime
```

### Comment le CJR est protégé ?

**5 couches de protection** :

1. **RBAC** : Uniquement rôle `directeur`
2. **Filtrage** : Auto-supprimé des réponses API si pas directeur
3. **Audit trail** : Chaque accès CJR logué
4. **Database** : Colonne séparée, index pour monitoring
5. **Tests** : 20+ tests de sécurité CJR

```typescript
// Exemple protection
if (user.role !== 'directeur') {
  delete project.cjr;  // Masqué

  // Si tentative accès direct → audit
  await logSecurityEvent('unauthorized_cjr_access', userId);
}
```

### Que faire si un secret fuite ?

**Incident response** :

1. **Immediate** (< 1h) :
   ```bash
   # Rotate JWT_SECRET
   wrangler secret put JWT_SECRET
   # → Tous les tokens existants invalidés

   # Rotate GEMINI_API_KEY
   # 1. Créer nouvelle clé sur Google AI Studio
   # 2. wrangler secret put GEMINI_API_KEY
   # 3. Révoquer ancienne clé
   ```

2. **Investigation** :
   - Vérifier logs Cloudflare
   - Identifier source de fuite
   - Documenter incident

3. **Prevention** :
   - Code review des PRs récentes
   - Scan Gitleaks sur tout l'historique
   - Mettre à jour SECURITY.md si nécessaire

### Les mots de passe sont chiffrés comment ?

**bcrypt** avec cost factor 10 :

```typescript
// Hash (création compte)
const hash = await bcrypt.hash(password, 10);
// → $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

// Verify (login)
const valid = await bcrypt.compare(password, hash);
```

**Jamais** de mots de passe en clair dans la DB.

---

## 💼 Business

### Quel est le ROI du projet ?

**Investissement** : 38,200€
- Dev (60j × 600€) : 36,000€
- Hébergement an 1 : 180€
- Formation : 2,000€

**Gains année 1** : 87,250€
- Gain productivité : 15,000€
- Réduction erreurs : 12,000€
- Réduction outils : 12,000€
- Optimisation staffing : 25,000€
- Amélioration marges : 18,000€
- Réduction admin : 5,250€

**ROI = 228%**
**Payback = 5.3 mois**

### Pourquoi pas un outil SaaS existant ?

**SaaS (type Silae, Lucca)** :
- Coût : 15-40€/user/mois → **9,000-24,000€/an**
- Pas de CJR/CJN
- Pas de chat IA personnalisé
- Pas de MCP
- Dépendance externe

**Notre solution** :
- **180€/an** hébergement
- Features sur-mesure (demi-journée, CJR, chat)
- Propriété du code
- Évolution libre

### Combien de temps pour développer ?

**Estimations par chantier** :

| Chantier | Durée | Cumul |
|----------|-------|-------|
| 00-02 | 6j | 6j |
| 03-06 | 12j | 18j |
| 07-09 | 11j | 29j |
| 10-11 | 6j | 35j |

**Total : 35 jours** (budget 60j avec marge)

**Timeline** :
- 1 dev full-time : 7 semaines
- 2 devs parallèle : 4 semaines
- IA autonome : 2-3 semaines

### L'application scale jusqu'à combien d'users ?

**Cloudflare Workers** scale automatiquement :

| Users | Requêtes/mois | Coût |
|-------|---------------|------|
| 50 | 500K | 7€ |
| 200 | 2M | 8€ |
| 500 | 5M | 9€ |
| 1000 | 10M | 12€ |

**Limite théorique** : Plusieurs millions d'users (Cloudflare gère des milliards de requêtes/jour).

Pour 50 personnes → Largement sous-utilisé.

---

## 📚 Ressources

### Où trouver plus d'infos ?

**Documentation projet** :
- [README.md](../README.md) - Vue d'ensemble
- [QUICKSTART.md](QUICKSTART.md) - Setup développeur
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture technique
- [API.md](API.md) - Documentation API
- [STATUS.md](../STATUS.md) - État actuel

**Externe** :
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Hono](https://hono.dev/)
- [Gemini API](https://ai.google.dev/docs)
- [React Query](https://tanstack.com/query/latest)

### Qui contacter pour questions ?

- **Fonctionnel** : Product Owner
- **Technique** : Lead Dev
- **Sécurité** : security@esn-client.com
- **Infrastructure** : Cloudflare support

---

*FAQ v2.0 - Dernière mise à jour : 2025-10-05*
