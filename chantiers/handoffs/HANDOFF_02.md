# HANDOFF 02: Database D1 - Schema + Migrations + Seed Data

**Date**: 2025-10-05
**Status**: ✅ COMPLÉTÉ
**Prochaine étape**: CHANTIER_03 (Routes Consultants & Projects)

---

## 🎯 Objectif du CHANTIER_02

Mettre en place la base de données D1 (Cloudflare) avec :
- Schéma complet (8 tables + 2 vues)
- Migrations SQL versionnées
- Seed data pour développement
- Helper functions pour requêtes sécurisées
- Migration de l'authentification vers D1

---

## ✅ Tâches accomplies

### 1. Création du schéma SQL - Migration 001
**Fichier**: `api/migrations/001_initial_schema.sql`

#### 8 Tables créées :
1. **users** - Utilisateurs avec rôles (consultant, project_owner, administrator, directeur)
2. **consultants** - Profils consultants (TJM, compétences JSON, disponibilité)
3. **projects** - Projets (type, dates, CJN, CJR)
4. **interventions** - Allocations consultant/projet (TJ facturé, % allocation)
5. **timesheets** - Saisie temps (demi-journée: 0.5 ou 1.0)
6. **validations** - Validation des timesheets
7. **chat_conversations** - Conversations utilisateur
8. **chat_messages** - Messages (user/assistant, intent NLU)

#### 2 Vues analytiques :
1. **v_consultant_utilization** - Taux utilisation par consultant (jours saisis / 20)
2. **v_project_margins** - Marges projet (CJN - CJR)

#### Contraintes implémentées :
- **Foreign keys** avec `ON DELETE CASCADE`
- **CHECK constraints** :
  - `role IN ('consultant', 'project_owner', 'administrator', 'directeur')`
  - `temps_saisi IN (0.5, 1.0)` (demi-journée)
  - `periode IN ('matin', 'apres-midi', 'journee')`
  - `pourcentage_allocation >= 0 AND <= 100`
- **UNIQUE INDEX** pour éviter doublons :
  - `timesheets(consultant_id, intervention_id, date, periode)`
  - `users(email)`
  - `consultants(user_id)`

#### Indexes de performance :
- `idx_users_email`, `idx_users_role`
- `idx_consultants_disponible`
- `idx_projects_owner`, `idx_projects_statut`, `idx_projects_client`
- `idx_interventions_consultant`, `idx_interventions_dates`
- `idx_timesheets_consultant_date`, `idx_timesheets_statut`

### 2. Seed data - Migration 002
**Fichier**: `api/migrations/002_seed_data.sql`

#### Données de test :
- **9 users** (1 directeur, 1 admin, 2 project owners, 5 consultants)
- **5 consultants** avec compétences variées (React, Angular, Vue, React Native, PHP)
- **3 projets actifs** (forfait + régie, avec CJR/CJN)
- **5 interventions** (allocations 50% et 100%)
- **13 timesheets** démontrant :
  - Demi-journées (0.5 matin + 0.5 après-midi = 1.0)
  - Statuts variés (draft, submitted, validated)
  - Split multi-projets
- **5 validations**
- **2 conversations** chat avec messages

#### Comptes de test :
```
directeur@esn.com (directeur) - Accès CJR
admin@esn.com (administrator)
po1@esn.com, po2@esn.com (project_owner)
consultant1@esn.com ... consultant5@esn.com
```
*Note: Password hashes sont placeholders - utiliser bcrypt.hash('password123', 10) en production*

### 3. Helper functions DB
**Fichier**: `api/src/db/queries.ts`

#### Fonctions par entité :

**Users** :
- `createUser(db, params)` - Insertion avec datetime('now')
- `getUserByEmail(db, email)` - Recherche par email
- `getUserById(db, id)` - Recherche par ID
- `deleteUser(db, id)` - Suppression

**Consultants** :
- `createConsultant(db, params)` - Compétences JSON stringifiées
- `getConsultantByUserId(db, userId)`
- `getAllConsultants(db)` - JOIN avec users
- `updateConsultantDisponibilite(db, id, disponible)`

**Projects** :
- `createProject(db, params)`
- `getProjectById(db, id)` - Avec CJR
- `getProjectByIdPublic(db, id)` - Sans CJR (SELECT explicite)
- `getProjectByIdWithCJR(db, id)` - Pour directeur
- `getProjectsByOwner(db, ownerId)`
- `getAllActiveProjects(db)`

**Interventions** :
- `createIntervention(db, params)`
- `getInterventionsByConsultant(db, consultantId)` - JOIN projects
- `getActiveInterventionsByConsultant(db, consultantId)`
- `getInterventionsByProject(db, projectId)` - JOIN consultants + users

**Timesheets** :
- `createTimesheet(db, params)` - Avec created_at + updated_at
- `getTimesheetsByConsultant(db, consultantId, month?)` - Filtrage optionnel par mois
- `getTimesheetsByProject(db, projectId, month?)`
- `updateTimesheetStatus(db, id, statut)` - Met à jour updated_at
- `deleteTimesheet(db, id)`

**Validations** :
- `createValidation(db, params)`
- `getValidationsByTimesheet(db, timesheetId)` - JOIN users (validator)

**Chat** :
- `createConversation(db, params)`
- `getConversationsByUser(db, userId)`
- `createMessage(db, params)`
- `getMessagesByConversation(db, conversationId)`

**Analytics (Vues)** :
- `getConsultantUtilization(db, consultantId?)` - Avec/sans filtre
- `getProjectMargins(db, projectId?)` - Avec CJR (directeur)
- `getProjectMarginsPublic(db)` - Sans CJR/marge (public)

#### Sécurité :
- **100% prepared statements** avec `.bind()` → SQL injection impossible
- **Types TypeScript** pour tous les paramètres
- **Interfaces** dédiées (CreateUserParams, CreateTimesheetParams, etc.)

### 4. Migration de l'authentification vers D1
**Fichier modifié**: `api/src/routes/auth.routes.ts`

#### Changements :
```typescript
// AVANT (CHANTIER_01)
const mockUsers = new Map<string, any>();
if (mockUsers.has(email)) { ... }

// APRÈS (CHANTIER_02)
import { createUser, getUserByEmail, getUserById } from '../db/queries';

const existingUser = await getUserByEmail(c.env.DB, email);
if (existingUser) { ... }

await createUser(c.env.DB, { id, email, password_hash, nom, prenom, role });
```

#### 3 routes migrées :
- `POST /auth/register` → createUser()
- `POST /auth/login` → getUserByEmail()
- `GET /auth/me` → getUserById()

### 5. Configuration D1
**Fichier modifié**: `api/wrangler.toml`

```toml
account_id = "7abb63759fda749d9c275e8f4bcdd57f"

[[d1_databases]]
binding = "DB"
database_name = "staffing-db"
database_id = "d05d8775-7871-4f91-8d26-b3a6641441dd"
```

### 6. Tests migrations
**Commandes exécutées** :
```bash
# Création DB
npx wrangler d1 create staffing-db

# Exécution migrations
npx wrangler d1 execute staffing-db --local --file=./migrations/001_initial_schema.sql
npx wrangler d1 execute staffing-db --local --file=./migrations/002_seed_data.sql

# Vérifications
npx wrangler d1 execute staffing-db --local --command "SELECT COUNT(*) FROM users"
# → 9 users

npx wrangler d1 execute staffing-db --local --command "SELECT * FROM v_consultant_utilization"
# → 5 consultants avec taux utilisation calculés (0%, 5%, 20%, 25%)
```

**Résultats** :
- ✅ 28 commandes schema exécutées (8 tables + indexes + vues)
- ✅ 13 commandes seed exécutées
- ✅ 9 users insérés
- ✅ Vue v_consultant_utilization fonctionnelle avec calculs corrects

---

## 📁 Fichiers créés/modifiés

### Créés :
- `api/migrations/001_initial_schema.sql` (192 lignes)
- `api/migrations/002_seed_data.sql` (112 lignes)
- `api/src/db/queries.ts` (403 lignes)

### Modifiés :
- `api/wrangler.toml` (ajout account_id + d1_databases)
- `api/src/routes/auth.routes.ts` (migration Map → D1)

---

## 🔧 Commandes utiles

### Gestion DB locale
```bash
# Exécuter migration
npx wrangler d1 execute staffing-db --local --file=./migrations/XXX.sql

# Query interactive
npx wrangler d1 execute staffing-db --local --command "SELECT * FROM users"

# Localisation DB locale
# .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
```

### Gestion DB production
```bash
# Exécuter migration en production
npx wrangler d1 execute staffing-db --remote --file=./migrations/XXX.sql

# Backup
npx wrangler d1 backup download staffing-db --output=backup.sqlite
```

---

## 🚨 Points d'attention

### 1. Système demi-journée
- **Contrainte stricte** : `temps_saisi IN (0.5, 1.0)`
- **Validation UI** : Matin (0.5) + Après-midi (0.5) = Journée (1.0)
- **Index unique** empêche 2 saisies matin/matin sur même date

### 2. Confidentialité CJR
- **CJR accessible uniquement par directeur**
- Routes publiques doivent utiliser `getProjectByIdPublic()` ou `getProjectMarginsPublic()`
- Routes protégées : Vérifier `role === 'directeur'` avant appel `getProjectByIdWithCJR()`

### 3. Compétences JSON
- Stockées en TEXT : `'["React", "TypeScript"]'`
- Parse côté application : `JSON.parse(consultant.competences)`
- Stringify à l'insert : `JSON.stringify(params.competences)`

### 4. Dates SQLite
- Format : `datetime('now')` → `2025-10-05 18:53:44`
- Filtrage par mois : `strftime('%Y-%m', date) = '2025-10'`
- Toujours utiliser fonctions SQLite pour dates (pas de new Date() en SQL)

### 5. Cascading deletes
- Suppression user → Suppression consultant, conversations, timesheets
- Suppression project → Suppression interventions → Suppression timesheets
- Vérifier logique métier avant DELETE

---

## 📋 TODO CHANTIER_03

### Routes à implémenter
**Fichier** : `api/src/routes/consultants.routes.ts`
- `GET /consultants` - Liste consultants (avec RBAC)
- `GET /consultants/:id` - Détail consultant
- `GET /consultants/:id/utilization` - Vue utilisation (v_consultant_utilization)
- `PATCH /consultants/:id/disponibilite` - Toggle disponibilité

**Fichier** : `api/src/routes/projects.routes.ts`
- `GET /projects` - Liste projets (filtrer CJR selon rôle)
- `POST /projects` - Créer projet (owner, admin, directeur)
- `GET /projects/:id` - Détail (filtrer CJR)
- `GET /projects/:id/margins` - Marges (directeur only)
- `GET /projects/:id/interventions` - Consultants du projet

### Middlewares RBAC
- Vérifier utilisation de `requireDirecteur` pour routes CJR
- `requireOwner` pour création/modification projets
- `requireAuth` pour lectures basiques

### Tests à prévoir
- Test CJR filtering (directeur vs autres)
- Test demi-journée validation
- Test cascading deletes

---

## ⚠️ Problèmes rencontrés et solutions

### Problème 1 : Account ID manquant
**Erreur** : `More than one account available but unable to select one in non-interactive mode`
**Solution** : Ajout `account_id = "7abb63759fda749d9c275e8f4bcdd57f"` dans wrangler.toml

### Problème 2 : Wrangler version obsolète
**Warning** : `wrangler 3.114.14 (update available 4.42.0)`
**Action** : Acceptable pour développement local, update recommandé pour production
**Commande** : `npm install --save-dev wrangler@4`

---

## 🔍 Vérification finale

### Checklist ✅
- [x] 8 tables créées avec contraintes
- [x] 2 vues fonctionnelles (utilization + margins)
- [x] Index de performance
- [x] Foreign keys + ON DELETE CASCADE
- [x] Seed data (9 users, 5 consultants, 3 projets)
- [x] Helper functions avec prepared statements
- [x] Migration auth.routes.ts vers D1
- [x] Configuration wrangler.toml
- [x] Tests migrations locales réussis
- [x] Vérification vues SQL (taux utilisation calculés)

### Tests de validation
```bash
# Test 1: Comptage users
SELECT COUNT(*) FROM users; -- Doit retourner 9

# Test 2: Vue utilization
SELECT consultant_id, taux_utilisation FROM v_consultant_utilization;
-- con_001: 25% (5 jours / 20)
-- con_002: 5% (1 jour / 20)
-- con_003: 20% (4 jours / 20)

# Test 3: Contrainte demi-journée
INSERT INTO timesheets (..., temps_saisi, ...) VALUES (..., 0.75, ...);
-- Doit échouer (0.75 non autorisé)
```

---

## 📚 Documentation utile

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [SQLite Date Functions](https://www.sqlite.org/lang_datefunc.html)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Prepared Statements](https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/#statement-methods)

---

**CHANTIER_02 TERMINÉ** ✅
**Prochaine étape** : CHANTIER_03 - Routes Consultants & Projects

---

*Handoff créé le 2025-10-05*
*Migrations testées et validées localement*
