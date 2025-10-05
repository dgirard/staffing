# Changelog - Staffing ESN

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### En cours
- CHANTIER_00 : Setup infrastructure Cloudflare

### Planifié
- CHANTIER_01-11 : Voir [STATUS.md](STATUS.md)

---

## [2.0.0-alpha] - 2025-10-05

### 📦 Phase de Préparation (Documentation & Configuration)

#### Added - Documentation

- **README.md** : Documentation principale du projet
- **STATUS.md** : Dashboard état du projet
- **CONTRIBUTING.md** : Guide de contribution complet (7.8K)
- **SECURITY.md** : Politique de sécurité détaillée
- **LICENSE** : Licence propriétaire
- **CHANGELOG.md** : Ce fichier
- **PROJET_COMPLET.md** : Résumé complet projet

**docs/**
- **ARCHITECTURE.md** : Architecture technique complète (~500 lignes)
- **API.md** : Documentation API REST (~1100 lignes)
- **TESTING_STRATEGY.md** : Stratégie tests complète
- **DEV_LOCAL.md** : Guide développement local
- **QUICKSTART.md** : Setup développeur (mise à jour Gemini API)
- **spec-staffing-esn-finale.md** : Spécification complète (mise à jour)

**chantiers/**
- **_GUIDE_CHANTIERS.md** : Guide IA séquentiel
- **_TEMPLATE_HANDOFF.md** : Template handoff
- **_ETAT_GLOBAL.json** : État machine projet
- **CHANTIER_00-11** : 12 chantiers spécifiés
- **handoffs/HANDOFF_00_EXAMPLE.md** : Exemple handoff complet

#### Added - Configuration

**Root**
- **package.json** : Scripts globaux (bootstrap, dev, test, build, deploy)
- **.gitignore** : Exclusions complètes (Cloudflare, secrets, tests)
- **.editorconfig** : Configuration éditeurs
- **.prettierrc.json** : Configuration formatage
- **.prettierignore** : Exclusions Prettier
- **.env.example** : Variables d'environnement exemple

**api/**
- **package.json** : Dependencies backend (Hono, Vitest, Wrangler)
- **tsconfig.json** : TypeScript config strict
- **vitest.config.ts** : Tests config (85% coverage minimum)
- **.dev.vars.example** : Secrets développement

**frontend/**
- **package.json** : Dependencies frontend (React, Vite, Playwright)
- **vitest.config.ts** : Tests frontend (80% coverage)
- **playwright.config.ts** : E2E tests config (5 browsers)

**scripts/**
- **bootstrap.sh** : Installation automatique
- **dev-local.sh** : Démarrage dev (API + Frontend)
- **dev-local-seed.sh** : Démarrage avec seed data

#### Added - GitHub

**.github/workflows/**
- **tests.yml** : CI tests automatisés
- **deploy-api.yml** : CD Cloudflare Workers
- **deploy-frontend.yml** : CD Cloudflare Pages
- **security.yml** : Scans sécurité (npm audit, CodeQL, Gitleaks)

**.github/ISSUE_TEMPLATE/**
- **bug_report.md** : Template bug report
- **feature_request.md** : Template feature request
- **chantier_completion.md** : Tracker chantier

**.github/**
- **PULL_REQUEST_TEMPLATE.md** : Template PR avec checklist

**VSCode**
- **.vscode/settings.json** : Settings VSCode (ESLint, Prettier)
- **.vscode/extensions.json** : Extensions recommandées

#### Changed

- **docs/README.md** : Mise à jour Gemini API (remplace Workers AI/Llama)
- **docs/QUICKSTART.md** : Configuration Cloudflare Secrets
- **docs/spec-staffing-esn-finale.md** : Stack technique Gemini

### 🔧 Configuration Technique

#### Stack Défini

**Frontend**
- React 18.2.0
- TypeScript 5.2.2
- Vite 5.0.8
- Tailwind CSS 3.4.0
- React Router 6.21.0
- React Query 5.17.0
- Zustand 4.4.7
- Playwright 1.40.0 (E2E)
- Vitest 1.2.0 (Unit/Integration)

**Backend**
- Hono (framework API)
- Cloudflare Workers
- TypeScript 5.2.2
- Zod (validation)
- jsonwebtoken (auth)
- bcryptjs (passwords)
- Vitest 1.2.0
- Wrangler (deployment)

**Database**
- Cloudflare D1 (SQLite)
- 8 tables + 2 views

**AI & Integration**
- Google Gemini API
- Model Context Protocol (MCP)

#### Standards Code

- **TypeScript** : Strict mode
- **Coverage minimum** : 85% API, 80% Frontend
- **Formatage** : Prettier
- **Linting** : ESLint
- **Commits** : Format `chantier-XX: description`

### 📊 Métriques

- **Fichiers créés** : 51+
- **Lignes documentation** : ~15,000
- **Chantiers spécifiés** : 12
- **Workflows CI/CD** : 4
- **Templates GitHub** : 4
- **Commits** : 12

### 🎯 Status

- **Phase** : Préparation ✅ (100% terminée)
- **Chantier actuel** : CHANTIER_00 (Ready to start)
- **Coverage** : 0% (pas de code)
- **Tests** : 0 (infrastructure seulement)

---

## [1.0.0-spec] - 2024-01-05

### Initial

- Spécification initiale du projet
- Architecture Cloudflare définie
- Choix technologiques validés
- Budget & ROI calculés

---

## Types de changements

- **Added** : Nouvelles fonctionnalités
- **Changed** : Modifications de fonctionnalités existantes
- **Deprecated** : Fonctionnalités bientôt supprimées
- **Removed** : Fonctionnalités supprimées
- **Fixed** : Corrections de bugs
- **Security** : Correctifs de sécurité

---

## Version Numbering

- **Major** (X.0.0) : Breaking changes
- **Minor** (0.X.0) : Nouvelles features (backward compatible)
- **Patch** (0.0.X) : Bug fixes

**Chantiers** → Version mapping :
- CHANTIER_00-02 → v0.1.0 (Foundation)
- CHANTIER_03-06 → v0.5.0 (Core features)
- CHANTIER_07-09 → v0.8.0 (Advanced features)
- CHANTIER_10-11 → v1.0.0 (Production ready)

---

*Maintained by the Staffing ESN team*
