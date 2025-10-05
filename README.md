# 🏢 Staffing ESN - Application de Gestion

> Application moderne de staffing pour ESN de 50 personnes, avec saisie temps demi-journée, chat IA, et architecture serverless Cloudflare

---

## 🚀 Quick Start (30 secondes)

```bash
# 1. Cloner
git clone <repo-url>
cd staff

# 2. Installer
npm run bootstrap

# 3. Configurer secrets
cp api/.dev.vars.example api/.dev.vars
# Éditer api/.dev.vars avec vos clés

# 4. Démarrer
npm run dev
```

✅ **Ouv rir** http://localhost:5173

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Documentation](#-documentation)
- [Développement](#-développement)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Chantiers](#-chantiers-développement-séquentiel)

---

## ✨ Fonctionnalités

### Core Features

- ⏱️ **Saisie temps demi-journée** - Matin / Après-midi / Journée (0.5j ou 1j)
- 💬 **Chat conversationnel** - Gemini API pour 80% des actions
- 👥 **4 rôles** - Consultant, Project Owner, Administrator, Directeur
- 💰 **Double coûts** - CJN (normé) + CJR (réel, Directeur only)
- 📊 **Dashboards** - Par rôle avec KPIs temps réel
- ✅ **Workflow validation** - Timesheets avec états
- 📱 **PWA mobile** - Offline-capable
- 🔐 **RBAC** - Permissions fines par rôle

### Innovations

- 🤖 **MCP Server** - Intégration LLM externes (Claude, ChatGPT)
- 🔒 **Confidentialité CJR** - Audit trail complet
- ⚡ **Serverless** - Cloudflare Workers (7-12€/mois)
- 🎯 **ROI 228%** - Payback 5 mois

---

## 🛠️ Stack Technique

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool ultra-rapide
- **PWA** - Progressive Web App

### Backend
- **Hono** - Framework API ultra-léger
- **Cloudflare Workers** - Serverless edge computing
- **TypeScript** - Type-safe

### Database
- **Cloudflare D1** - SQLite distribué
- **KV** - Cache
- **R2** - File storage

### AI & Automation
- **Google Gemini API** - Chat conversationnel
- **MCP** - Model Context Protocol
- **Cloudflare Queues** - Background jobs

### Tests
- **Vitest** - Tests unitaires + intégration
- **Playwright** - Tests E2E
- **Testing Library** - Tests composants React

---

## 📚 Documentation

### Pour démarrer

- 📖 **[START_HERE.md](docs/START_HERE.md)** - Point d'entrée unique
- 🚀 **[QUICKSTART.md](docs/QUICKSTART.md)** - Setup développeur (60min)
- 💻 **[DEV_LOCAL.md](docs/DEV_LOCAL.md)** - Guide dev local
- 🧪 **[TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)** - Stratégie tests
- 📊 **[STATUS.md](STATUS.md)** - État actuel du projet
- ❓ **[FAQ.md](docs/FAQ.md)** - Questions fréquentes
- 📚 **[GLOSSARY.md](docs/GLOSSARY.md)** - Termes et acronymes

### Spécifications & Architecture

- 📋 **[spec-staffing-esn-finale.md](docs/spec-staffing-esn-finale.md)** - Spec complète (1500 lignes)
- 🏗️ **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Architecture technique détaillée
- 🌐 **[API.md](docs/API.md)** - Documentation API REST complète
- 🎨 **[TAILWIND_GUIDE.md](docs/TAILWIND_GUIDE.md)** - Design system
- 📖 **[README.md](docs/README.md)** - Vue d'ensemble projet

### Chantiers & Contribution

- 🏗️ **[_GUIDE_CHANTIERS.md](chantiers/_GUIDE_CHANTIERS.md)** - Guide IA séquentiel
- 📊 **[_ETAT_GLOBAL.json](chantiers/_ETAT_GLOBAL.json)** - État machine du projet
- 📝 **[CHANTIER_XX_nom.md](chantiers/)** - 12 chantiers détaillés
- 🤝 **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide de contribution
- 📦 **[PROJET_COMPLET.md](PROJET_COMPLET.md)** - Résumé complet

---

## 💻 Développement

### Installation

```bash
# Installer toutes les dépendances
npm run bootstrap

# Créer .dev.vars avec secrets
cp api/.dev.vars.example api/.dev.vars
```

### Démarrage

```bash
# Environnement complet (API + Frontend + DB)
npm run dev

# Avec seed data
npm run dev:seed

# API seule
npm run dev:api

# Frontend seul
npm run dev:frontend
```

### URLs locales

- **Frontend** : http://localhost:5173
- **API** : http://localhost:8787
- **API Health** : http://localhost:8787/health

---

## 🧪 Tests

### Lancer les tests

```bash
# Tous les tests (unitaires + intégration + E2E)
npm run test:all

# Tests unitaires seulement
npm test

# Tests avec watch mode
npm run test:watch

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

### Coverage minimum requis

- **Services** : 90%+
- **Routes API** : 85%+
- **Composants** : 80%+
- **Global** : 85%+

---

## 🚢 Déploiement

### Production

```bash
# Déployer API (Workers)
cd api && npx wrangler deploy

# Déployer Frontend (Pages)
cd frontend && npm run build && npx wrangler pages deploy dist
```

### Secrets Cloudflare

```bash
# Configurer secrets en production
npx wrangler secret put JWT_SECRET
npx wrangler secret put GEMINI_API_KEY
```

### URLs Production

- **API** : https://staffing-api.xxx.workers.dev
- **Frontend** : https://staffing-frontend.pages.dev

---

## 🏗️ Chantiers (Développement Séquentiel)

Ce projet est découpé en **12 chantiers** pour développement par IA séquentiel.

### Progression

| # | Chantier | Durée | Statut | Description |
|---|----------|-------|--------|-------------|
| 00 | Setup | 2j | 🔄 En cours | Infrastructure Cloudflare |
| 01 | Auth | 2j | ⏳ Pending | JWT + RBAC |
| 02 | Database | 2j | ⏳ Pending | Schéma D1 + migrations |
| 03 | CRUD Base | 3j | ⏳ Pending | Consultants + Projets |
| 04 | Interventions | 2j | ⏳ Pending | Allocations |
| 05 | Timesheet | 4j | ⏳ Pending | Saisie demi-journée |
| 06 | Validation | 3j | ⏳ Pending | Workflow validation |
| 07 | Dashboards | 4j | ⏳ Pending | Dashboards standard |
| 08 | Directeur | 3j | ⏳ Pending | Dashboard CJR/CJN |
| 09 | Chat | 4j | ⏳ Pending | Gemini API + NLU |
| 10 | MCP | 3j | ⏳ Pending | MCP Server |
| 11 | Deploy | 3j | ⏳ Pending | Tests E2E + Production |

**Total** : 35 jours (budget 60j)

### Démarrer un chantier

```bash
# 1. Lire le guide
cat chantiers/_GUIDE_CHANTIERS.md

# 2. Vérifier l'état
cat chantiers/_ETAT_GLOBAL.json

# 3. Lire le handoff précédent
cat chantiers/handoffs/HANDOFF_XX_to_YY.md

# 4. Lire le chantier
cat chantiers/CHANTIER_XX_nom.md

# 5. Développer + tester
npm run dev
npm run test:all

# 6. Créer le handoff
cp chantiers/_TEMPLATE_HANDOFF.md chantiers/handoffs/HANDOFF_XX_to_YY.md
```

---

## 📊 Métriques Projet

### Budget

| Poste | Montant |
|-------|---------|
| Développement (60j × 600€) | 36 000€ |
| Hébergement année 1 | 180€ |
| Formation | 2 000€ |
| **TOTAL** | **38 200€** |

### ROI

- **Gains année 1** : 87 250€
- **ROI** : 228%
- **Payback** : 5.3 mois

### Hébergement

- **Cloudflare** : 7-12€/mois
- **vs AWS/Azure** : 500-2000€/mois
- **Économie** : 95%

---

## 🤝 Contribution

### Workflow Git

```bash
# Feature branch
git checkout -b chantier-XX/feature-name

# Commits
git commit -m "chantier-XX: Description"

# Push
git push origin chantier-XX/feature-name

# Pull Request (avec tests passing)
```

### Conventions

- **Commits** : `chantier-XX: Description` (minuscule)
- **Branches** : `chantier-XX/feature-name`
- **Tests** : Coverage ≥ 85% obligatoire

---

## 📞 Support

### Documentation

- **Questions fonctionnelles** → [spec-staffing-esn-finale.md](docs/spec-staffing-esn-finale.md)
- **Questions techniques** → [QUICKSTART.md](docs/QUICKSTART.md)
- **Questions tests** → [TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)
- **Questions chantiers** → [_GUIDE_CHANTIERS.md](chantiers/_GUIDE_CHANTIERS.md)

### Ressources externes

- **Cloudflare Workers** : https://developers.cloudflare.com/workers/
- **D1 Database** : https://developers.cloudflare.com/d1/
- **Hono** : https://hono.dev/
- **Gemini API** : https://ai.google.dev/docs

---

## 📄 Licence

Propriété de l'ESN cliente - Confidentiel

---

## ✨ Points Clés

✅ **Simple** - Saisie 30 secondes, chat intuitif
✅ **Économique** - 38K€ budget, 12€/mois hosting
✅ **Intelligent** - IA Gemini, MCP, automatisations
✅ **Rentable** - ROI 228%, payback 5 mois
✅ **Testé** - Coverage 85%+, CI/CD automatique
✅ **Moderne** - Serverless, TypeScript, React 18

**Prêt pour le développement ! 🚀**

---

_Projet : Staffing ESN_
_Version : 2.0_
_Date : Janvier 2025_
