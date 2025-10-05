# Glossaire - Staffing ESN

Définitions des termes et acronymes utilisés dans le projet.

---

## 📋 Table des matières

- [Métier ESN](#métier-esn)
- [Technique](#technique)
- [Architecture](#architecture)
- [Sécurité](#sécurité)
- [Tests](#tests)
- [DevOps](#devops)

---

## 💼 Métier ESN

### Allocation
Synonyme d'**Intervention**. Affectation d'un consultant à un projet pour une période donnée.

### Chantier
Unité de travail autonome dans le développement du projet. 12 chantiers au total (00-11).

### CJN (Coût Journalier Normé)
Coût **facturé au client** pour une journée de consultant. Visible par tous les utilisateurs.

**Exemple** : CJN = 600€ → Le client paie 600€/jour

### CJR (Coût Journalier Réel)
Coût **réel interne** d'une journée de consultant (salaire + charges). **Confidentiel**, visible uniquement par le rôle `directeur`.

**Exemple** : CJR = 450€ → Coût réel pour l'ESN

**Marge = CJN - CJR** = 600 - 450 = 150€/jour

### Consultant
Personne (employé ou freelance) qui réalise des missions pour les clients de l'ESN.

**Rôle système** : `consultant` (niveau d'accès le plus bas)

### Demi-journée
Unité de temps de saisie. **Innovation du projet**.

- **0.5j** = Matin OU Après-midi
- **1.0j** = Journée complète

Maximum **1 jour par date** (0.5 + 0.5).

### ESN (Entreprise de Services du Numérique)
Anciennement SSII. Entreprise qui fournit des consultants IT aux clients.

**Taille cible** : 50 personnes

### Handoff
Document de passation entre deux chantiers (ou deux IAs). Contient tout ce qui a été fait et les instructions pour le suivant.

**Template** : `chantiers/_TEMPLATE_HANDOFF.md`

### Intervention
Allocation d'un consultant à un projet avec :
- Date début / fin
- TJ (Tarif Journalier) figé
- Pourcentage d'allocation (50%, 100%, etc.)

### Marge
Différence entre ce qui est facturé (CJN) et ce qui coûte (CJR).

**Formule** : `Marge = CJN - CJR`

**Taux de marge** : `(Marge / CJN) × 100`

### Project Owner
Responsable d'un projet. Gère les consultants, valide les timesheets.

**Rôle système** : `project_owner`

### Régie
Type de projet facturé **au temps passé** (jour/homme).

Autres types : `forfait`, `centre_de_service`

### Staffing
Action d'allouer les consultants aux projets. But : maximiser le **taux d'utilisation**.

### Taux d'utilisation
Pourcentage de temps facturable d'un consultant.

**Formule** : `(Jours saisis / Jours ouvrés) × 100`

**Exemple** : 18j saisis / 20j ouvrés = 90%

**Bon taux** : >80%

### Timesheet
Saisie de temps. Document où le consultant indique le temps passé sur chaque projet.

**Statuts** : `draft`, `submitted`, `validated`, `rejected`

### TJ (Tarif Journalier)
Synonyme de CJN. Tarif facturé au client pour une journée.

**Figé à l'intervention** : Le TJ ne change pas même si le CJN du projet change.

---

## 🛠️ Technique

### API
Application Programming Interface. Ensemble d'endpoints HTTP pour communiquer avec le backend.

**Framework** : Hono

**Base URL** : `https://api.staffing-esn.workers.dev`

### bcrypt
Algorithme de hashing de mots de passe. **Lent par design** pour résister aux attaques brute-force.

**Cost factor** : 10 (2^10 = 1024 rounds)

### D1
Base de données SQLite serverless de Cloudflare. Répliquée globalement.

**Limite gratuite** : 5GB

### Edge computing
Exécution du code au plus proche de l'utilisateur (300+ datacenters Cloudflare).

**Avantage** : Latence ultra-faible (<50ms)

### Gemini API
API d'IA conversationnelle de Google. Remplace Workers AI/Llama.

**Modèle utilisé** : `gemini-pro`

**Usage** : Chat conversationnel + NLU

### Hono
Framework web ultra-léger pour edge computing.

**Taille** : ~13KB (vs ~200KB Express)

**Supporte** : Cloudflare Workers, Deno, Bun, Node.js

### JWT (JSON Web Token)
Token d'authentification encodé en base64, signé avec un secret.

**Format** : `header.payload.signature`

**Expiration** : 24h

### KV (Key-Value)
Namespace de stockage clé-valeur de Cloudflare. Ultra-rapide (<1ms).

**Usage** : Cache, sessions

### MCP (Model Context Protocol)
Protocole standard pour connecter des LLMs à des outils externes.

**Notre implémentation** : 5 outils (create_timesheet, get_utilization, etc.)

### PWA (Progressive Web App)
Application web installable sur mobile/desktop, fonctionnant offline.

**Service Worker** : Gère le cache et les requêtes offline

### R2
Stockage d'objets (fichiers) de Cloudflare. Compatible S3.

**Usage futur** : Export Excel, documents

### RBAC (Role-Based Access Control)
Contrôle d'accès basé sur les rôles.

**4 rôles** : `consultant`, `project_owner`, `administrator`, `directeur`

### Serverless
Architecture sans serveur à gérer. Le code s'exécute à la demande.

**Avantages** : Scaling auto, pas de maintenance, paiement à l'usage

### SQLite
Base de données relationnelle embarquée. Fichier unique.

**Cloudflare D1** : SQLite distribué globalement

### TypeScript
Superset de JavaScript avec typage statique.

**Version** : 5.2.2

**Mode** : Strict

### Vite
Build tool ultra-rapide pour frontend. Remplace Webpack/CRA.

**HMR** : Hot Module Replacement (rafraîchissement instantané)

### Zod
Librairie de validation runtime avec inférence de types TypeScript.

```typescript
const schema = z.object({
  email: z.string().email()
});
type User = z.infer<typeof schema>; // { email: string }
```

---

## 🏗️ Architecture

### Backend
Partie serveur de l'application. Gère la logique métier, les données, l'authentification.

**Stack** : Cloudflare Workers + Hono + D1

### CDN (Content Delivery Network)
Réseau de serveurs distribués. Cloudflare = CDN global.

**Avantage** : Cache statique au plus proche des users

### Frontend
Partie client de l'application. Interface utilisateur.

**Stack** : React 18 + Vite + Tailwind CSS

### Middleware
Fonction qui s'exécute avant le handler de route.

**Exemples** : `authMiddleware`, `rbacMiddleware`, `cors`

### ORM (Object-Relational Mapping)
Abstraction de la base de données. **Non utilisé ici** (requêtes SQL directes).

### REST API
Architecture API basée sur HTTP avec verbes standards (GET, POST, PUT, DELETE).

**Alternative** : GraphQL (non utilisé)

### Service Worker
Script JavaScript qui tourne en arrière-plan dans le navigateur.

**Usage** : Cache offline, notifications push

### SSR (Server-Side Rendering)
Rendu HTML côté serveur. **Non utilisé** (CSR avec React).

**Alternative** : Next.js, Remix

### State Management
Gestion de l'état de l'application.

**Client state** : Zustand (user, UI)
**Server state** : React Query (cache API)

---

## 🔐 Sécurité

### Audit Trail
Historique des actions sensibles (accès CJR, modifications, etc.).

**Table** : `audit_logs`

### CORS (Cross-Origin Resource Sharing)
Mécanisme autorisant les requêtes cross-origin.

**Configuré** : `https://staffing-frontend.pages.dev`

### CSRF (Cross-Site Request Forgery)
Attaque forçant un user authentifié à exécuter une action non désirée.

**Protection** : SameSite cookies, tokens

### HTTPS / TLS
Protocole sécurisé pour communications web.

**Cloudflare** : TLS 1.3 automatique

### HSTS (HTTP Strict Transport Security)
Header forçant le navigateur à utiliser HTTPS.

**Activé** : Cloudflare automatic

### Rate Limiting
Limitation du nombre de requêtes par période.

**Limites** : 100 req/min (public), 500 req/min (authentifié)

### RGPD / GDPR
Règlement Général sur la Protection des Données.

**Compliance** : Droit à l'oubli, portabilité, consentement

### Salt
Données aléatoires ajoutées au password avant hashing.

**bcrypt** : Génère automatiquement un salt unique par password

### SQL Injection
Attaque injectant du SQL malveillant dans une requête.

**Protection** : Prepared statements (JAMAIS de string interpolation)

### XSS (Cross-Site Scripting)
Attaque injectant du JavaScript malveillant.

**Protection** : Échappement React, CSP headers

---

## 🧪 Tests

### Coverage
Pourcentage de code testé.

**Objectifs** : 85% API, 80% Frontend

### E2E (End-to-End)
Tests simulant un user réel dans le navigateur.

**Outil** : Playwright

### Fixture
Données de test réutilisables.

**Exemple** : User de test, projet de test

### Integration Test
Test vérifiant que plusieurs modules fonctionnent ensemble.

**Exemple** : Route API + Service + Database

### Mock
Fausse implémentation d'une dépendance pour tester isolément.

```typescript
const mockDb = {
  query: vi.fn().mockResolvedValue([{ id: 1 }])
};
```

### Regression Test
Test vérifiant qu'un bug corrigé ne réapparaît pas.

### Snapshot Test
Test comparant l'output à une "photo" de référence.

**Usage** : Components React

### Unit Test
Test d'une seule fonction/classe isolée.

**Exemple** : `hashPassword()`, `validateEmail()`

### Vitest
Framework de test moderne, compatible Vite.

**Similaire à** : Jest (mais plus rapide)

---

## 🚀 DevOps

### CI (Continuous Integration)
Intégration continue. Tests automatiques sur chaque commit.

**Outil** : GitHub Actions

### CD (Continuous Deployment)
Déploiement continu. Auto-deploy en production après tests.

**Workflows** : `deploy-api.yml`, `deploy-frontend.yml`

### Cold Start
Délai au premier démarrage d'une fonction serverless.

**Cloudflare Workers** : Pas de cold start (isolates)

### Environment
Environnement d'exécution.

**Types** : `development`, `staging`, `production`

### Isolates
Technologie Cloudflare pour exécuter du code de manière isolée sans VM/containers.

**Avantage** : Démarrage instantané (<1ms)

### Migration
Script SQL pour modifier le schéma de la base de données.

**Fichiers** : `001_initial.sql`, `002_seed.sql`

### Rollback
Retour à une version précédente après un déploiement problématique.

```bash
wrangler rollback [DEPLOYMENT_ID]
```

### Secret
Variable d'environnement sensible (JWT_SECRET, API keys).

**Stockage** : Cloudflare Secrets (chiffré)

### Wrangler
CLI Cloudflare pour gérer Workers, D1, Pages.

**Installation** : `npm install -g wrangler`

---

## 📚 Acronymes

| Acronyme | Signification |
|----------|---------------|
| API | Application Programming Interface |
| CD | Continuous Deployment |
| CDN | Content Delivery Network |
| CI | Continuous Integration |
| CJN | Coût Journalier Normé |
| CJR | Coût Journalier Réel |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| CSRF | Cross-Site Request Forgery |
| CSR | Client-Side Rendering |
| D1 | Cloudflare Database (SQLite) |
| E2E | End-to-End |
| ESN | Entreprise de Services du Numérique |
| GDPR | General Data Protection Regulation |
| HMR | Hot Module Replacement |
| HSTS | HTTP Strict Transport Security |
| HTTPS | HTTP Secure |
| JWT | JSON Web Token |
| KV | Key-Value |
| MCP | Model Context Protocol |
| NLU | Natural Language Understanding |
| ORM | Object-Relational Mapping |
| PWA | Progressive Web App |
| RBAC | Role-Based Access Control |
| RGPD | Règlement Général sur la Protection des Données |
| ROI | Return On Investment |
| SaaS | Software as a Service |
| SLA | Service Level Agreement |
| SQL | Structured Query Language |
| SSR | Server-Side Rendering |
| TJ | Tarif Journalier |
| TLS | Transport Layer Security |
| UI | User Interface |
| UX | User Experience |
| XSS | Cross-Site Scripting |

---

*Glossaire v2.0 - Dernière mise à jour : 2025-10-05*
