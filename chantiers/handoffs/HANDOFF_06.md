# HANDOFF 06: Workflow Validation Timesheets

**Date**: 2025-10-05
**Status**: ✅ COMPLÉTÉ
**Prochaine étape**: CHANTIER_07 (Dashboards)

---

## 🎯 Objectif du CHANTIER_06

Implémenter le workflow complet de validation des timesheets :
- Machine à états (draft → submitted → validated/rejected)
- RBAC validation (project_owner limité à ses projets)
- Validation en masse (bulk operations)
- Re-soumission après rejet
- Statistiques de validation

---

## ✅ Tâches accomplies

### 1. Service Validations
**Fichier**: `api/src/services/validations.service.ts`

#### Méthodes implémentées :

**validate(db, data, validatorRole)**
- Valide ou rejete un timesheet
- Vérifie statut : DOIT être "submitted"
- **Ownership PO** : project_owner ne peut valider que ses projets
- **Commentaire obligatoire** si rejected
- Crée entrée dans table `validations`
- Met à jour `timesheets.statut`
- Retourne validation_id

**validateBulk(db, data, validatorId, validatorRole)**
- Validation en masse de plusieurs timesheets
- Appelle `validate()` pour chaque timesheet
- Collecte succès/échecs
- Retourne : `{succeeded: [], failed: [{timesheet_id, error}]}`
- Continue même si certains échouent (pas de rollback global)

**getPendingTimesheets(db, validatorId, validatorRole)**
- Liste timesheets avec `statut = 'submitted'`
- **Filtre automatique pour PO** : `WHERE p.owner_id = validatorId`
- Admin/directeur voient TOUS les pending
- JOIN complet : timesheet + projet + consultant

**getValidationHistory(db, timesheetId)**
- Historique complet des validations d'un timesheet
- Retourne liste chronologique (validé → rejeté → re-validé...)

**getById(db, validationId)**
- Détail d'une validation
- JOIN avec users pour nom/prenom/role du validateur

**resubmit(db, timesheetId, consultantId)**
- Re-soumission après rejet : `rejected` → `submitted`
- Vérifie statut : DOIT être "rejected"
- **Ownership** : Consultant ne peut re-soumettre que ses timesheets

**getProjectStats(db, projectId, month?)**
- Statistiques validation par projet
- Compte par statut (draft/submitted/validated/rejected)
- Total jours validés
- Filtre optionnel par mois

**getConsultantStats(db, consultantId, month?)**
- Statistiques validation par consultant
- Même structure que project stats
- Filtre optionnel par mois

#### Machine à états

```
draft ────────────────────────┐
  │                            │
  │ (submit)                   │ (delete)
  ↓                            ↓
submitted ─────────────> [supprimé]
  │         (validate)
  │
  ├─────> validated ✅
  │
  └─────> rejected ❌
            │
            │ (resubmit)
            ↓
          submitted
```

**Transitions valides** :
- `draft` → `submitted` (CHANTIER_05 - POST /timesheets/:id/submit)
- `draft` → supprimé (CHANTIER_05 - DELETE /timesheets/:id)
- `submitted` → `validated` (CHANTIER_06 - POST /validations)
- `submitted` → `rejected` (CHANTIER_06 - POST /validations)
- `rejected` → `submitted` (CHANTIER_06 - POST /validations/timesheet/:id/resubmit)

**Transitions invalides** :
- ❌ `validated` → autre (immuable)
- ❌ `rejected` → `validated` (doit re-soumettre d'abord)
- ❌ `draft` → `validated` (doit soumettre d'abord)

### 2. Routes Validations
**Fichier**: `api/src/routes/validations.routes.ts`

#### Endpoints créés :

**POST /validations** (requireOwner)
- Valider ou rejeter un timesheet
- Schéma Zod : `ValidateTimesheetSchema`
- **Ownership PO** : Vérifié dans service
- Erreur 403 si PO essaie de valider projet d'un autre
- Erreur 400 si statut != "submitted" ou commentaire manquant (reject)

**POST /validations/bulk** (requireOwner)
- Validation en masse
- Schéma Zod : `BulkValidateSchema` (array min 1 timesheet)
- Retourne détail succès/échecs :
  ```json
  {
    "succeeded": ["ts_001", "ts_002"],
    "failed": [{"timesheet_id": "ts_003", "error": "..."}],
    "total": 5,
    "success_count": 2,
    "failure_count": 3
  }
  ```

**GET /validations/:id** (requireAuth)
- Détail d'une validation
- Retourne : validation + validator_nom/prenom/role

**GET /validations/timesheet/:timesheetId** (requireAuth)
- Historique validations d'un timesheet
- Liste chronologique

**GET /validations/pending** (requireOwner)
- Liste timesheets en attente (submitted)
- **Auto-filtre PO** : Uniquement ses projets
- Admin/directeur : Tous les pending

**POST /validations/timesheet/:timesheetId/resubmit** (requireAuth - consultant only)
- Re-soumettre après rejet
- Vérifie role = consultant
- Vérifie ownership (consultant ne peut re-soumettre que ses timesheets)
- Vérifie statut = rejected

**GET /validations/project/:projectId/stats** (requireOwner)
- Statistiques projet
- **Ownership PO** : Vérifié explicitement
- Query param `?month=YYYY-MM` optionnel

**GET /validations/consultant/:consultantId/stats** (requireAuth)
- Statistiques consultant
- **Ownership consultant** : Ne voit que ses stats
- Query param `?month=YYYY-MM` optionnel

#### Schémas Zod

```typescript
ValidateTimesheetSchema = {
  timesheet_id: string,
  statut: enum(['validated', 'rejected']),
  commentaire: optional nullable string
}

BulkValidateSchema = {
  timesheet_ids: array(string).min(1),  // Au moins 1 requis
  statut: enum(['validated', 'rejected']),
  commentaire: optional nullable string
}
```

#### Ownership validation (project_owner)

**Pattern dans service** :
```typescript
if (validatorRole === 'project_owner') {
  // Get project via timesheet → intervention → project
  const timesheet = await db.prepare(`
    SELECT p.owner_id
    FROM timesheets t
    INNER JOIN interventions i ON t.intervention_id = i.id
    INNER JOIN projects p ON i.project_id = p.id
    WHERE t.id = ?
  `).bind(timesheetId).first();

  if (timesheet.owner_id !== validatorId) {
    throw Error('Vous ne pouvez valider que vos projets');
  }
}
```

**Pattern dans routes** :
```typescript
// GET /validations/project/:id/stats
if (payload.role === 'project_owner') {
  const project = await db.prepare('SELECT owner_id FROM projects WHERE id = ?')
    .bind(projectId).first();

  if (project.owner_id !== payload.userId) {
    return 403 Forbidden;
  }
}
```

### 3. Intégration dans API
**Fichier modifié**: `api/src/index.ts`

- Import `validationsRoutes`
- Version API → `0.6.0`
- Message → `"CHANTIER_06 Validations"`
- Intégration avec JWT via `basePath()` + `use('*')`

```typescript
const validationsApp = app.basePath('/validations');
validationsApp.use('*', jwtMiddleware);
validationsApp.route('/', validationsRoutes);
```

---

## 📁 Fichiers créés/modifiés

### Créés :
- `api/src/services/validations.service.ts` (241 lignes)
- `api/src/routes/validations.routes.ts` (382 lignes)

### Modifiés :
- `api/src/index.ts` (ajout routes validations, version 0.6.0)

---

## 🔧 Tests effectués

### TypeScript
```bash
npm run typecheck
# ✅ Aucune erreur
```

---

## 📋 Routes disponibles

### Validations (JWT required)
```
POST   /validations                           (requireOwner + ownership check)
POST   /validations/bulk                      (requireOwner + ownership check)
GET    /validations/:id                       (requireAuth)
GET    /validations/timesheet/:id             (requireAuth)
GET    /validations/pending                   (requireOwner - auto filtered)
POST   /validations/timesheet/:id/resubmit    (requireAuth - consultant only)
GET    /validations/project/:id/stats         (requireOwner + ownership check)
GET    /validations/consultant/:id/stats      (requireAuth + ownership check)
```

---

## 🔍 Logique métier

### 1. Workflow de validation

**Étapes** :
1. Consultant crée timesheet → `statut = 'draft'`
2. Consultant soumet → `statut = 'submitted'`
3. PO/Admin/Directeur valide/rejete :
   - Validé → `statut = 'validated'` (FINAL)
   - Rejeté → `statut = 'rejected'`
4. Si rejeté, consultant peut re-soumettre → `statut = 'submitted'`

**Règles** :
- ✅ Peut valider/rejeter si `statut = 'submitted'`
- ❌ Ne peut pas valider si `statut IN ('draft', 'validated', 'rejected')`
- ✅ Peut re-soumettre si `statut = 'rejected'`
- ❌ Ne peut pas re-soumettre si `statut != 'rejected'`

### 2. Permissions de validation

| Rôle | Peut valider | Restrictions |
|------|--------------|--------------|
| consultant | ❌ | N/A |
| project_owner | ✅ | Uniquement timesheets de ses projets |
| administrator | ✅ | Tous timesheets |
| directeur | ✅ | Tous timesheets |

**Vérification ownership PO** :
```sql
SELECT p.owner_id
FROM timesheets t
INNER JOIN interventions i ON t.intervention_id = i.id
INNER JOIN projects p ON i.project_id = p.id
WHERE t.id = ?
```

Si `p.owner_id != validatorId` → 403 Forbidden

### 3. Commentaire obligatoire (rejet)

```typescript
if (statut === 'rejected' && !commentaire) {
  throw Error('Un commentaire est obligatoire pour rejeter');
}
```

**Pourquoi** :
- Transparence pour le consultant
- Justification du rejet
- Aide à la correction

**Exemple** :
```json
{
  "timesheet_id": "ts_001",
  "statut": "rejected",
  "commentaire": "Date incorrecte - merci de corriger"
}
```

### 4. Validation en masse

**Use case** : PO valide tous les timesheets du mois d'un coup

**Requête** :
```json
{
  "timesheet_ids": ["ts_001", "ts_002", "ts_003", "ts_004"],
  "statut": "validated"
}
```

**Réponse** :
```json
{
  "succeeded": ["ts_001", "ts_002", "ts_004"],
  "failed": [
    {
      "timesheet_id": "ts_003",
      "error": "Impossible de valider: statut actuel \"draft\" (doit être \"submitted\")"
    }
  ],
  "total": 4,
  "success_count": 3,
  "failure_count": 1
}
```

**Comportement** :
- Continue même si certains échouent
- Pas de transaction globale (pas de rollback)
- Chaque timesheet traité indépendamment

### 5. Historique de validation

Un timesheet peut avoir **plusieurs validations** :

**Scénario** :
1. Validation 1 : `rejected` par PO (commentaire: "Date incorrecte")
2. Consultant corrige et re-soumet
3. Validation 2 : `validated` par PO

**Historique** :
```json
[
  {
    "id": "val_001",
    "statut": "rejected",
    "commentaire": "Date incorrecte",
    "validator_nom": "Dupont",
    "created_at": "2025-10-01T10:00:00Z"
  },
  {
    "id": "val_002",
    "statut": "validated",
    "commentaire": null,
    "validator_nom": "Dupont",
    "created_at": "2025-10-02T14:30:00Z"
  }
]
```

### 6. Statistiques de validation

**Par projet** :
```json
{
  "total": 50,
  "draft_count": 5,
  "submitted_count": 10,
  "validated_count": 30,
  "rejected_count": 5,
  "validated_jours": 28.5
}
```

**Par consultant** :
```json
{
  "total": 20,
  "draft_count": 2,
  "submitted_count": 3,
  "validated_count": 14,
  "rejected_count": 1,
  "validated_jours": 13.0
}
```

**Utilité** :
- Taux de validation : `validated / total`
- Taux de rejet : `rejected / total`
- Progression validation : `validated + rejected / total`
- Jours validés pour facturation

---

## 🚨 Points d'attention

### 1. Routes ordering (IMPORTANT)

Routes spécifiques AVANT routes paramétrées :

```typescript
// ✅ CORRECT
POST /validations/bulk                         (très spécifique)
GET  /validations/pending                      (spécifique)
GET  /validations/timesheet/:id                (spécifique)
POST /validations/timesheet/:id/resubmit       (très spécifique)
GET  /validations/project/:id/stats            (spécifique)
GET  /validations/consultant/:id/stats         (spécifique)
GET  /validations/:id                          (paramétré général)

// ❌ INCORRECT - :id attrape "bulk", "pending", "timesheet"
GET /validations/:id
POST /validations/bulk
```

### 2. Commentaire obligatoire (reject)

Validation côté service :
```typescript
if (data.statut === 'rejected' && !data.commentaire) {
  throw new Error('Commentaire obligatoire');
}
```

**Pas de validation Zod** car le champ est `optional` (pas toujours requis)

### 3. Ownership filtering (GET /pending)

**Automatique dans service** :
```typescript
if (validatorRole === 'project_owner') {
  query += ' AND p.owner_id = ?';
  bindings.push(validatorId);
}
```

**PO ne voit QUE ses timesheets** → Pas besoin de filtrage en routes

### 4. Bulk validation - pas de rollback

```typescript
for (const timesheetId of data.timesheet_ids) {
  try {
    await validate(...);
    succeeded.push(timesheetId);
  } catch (error) {
    failed.push({ timesheet_id: timesheetId, error: ... });
  }
  // Continue même si erreur
}
```

**Pas de `Promise.all()`** car on veut continuer même si certains échouent

### 5. Re-soumission (consultant only)

```typescript
if (payload.role !== 'consultant') {
  return 403 Forbidden;
}
```

**Pourquoi** :
- Seul le consultant peut décider de re-soumettre
- Pas de re-soumission automatique par PO/Admin
- Respect du workflow

---

## ⚠️ Problèmes potentiels et solutions

### Problème potentiel 1 : Validation d'un timesheet déjà validé

**Scénario** : PO essaie de valider un timesheet déjà `validated`

**Protection** :
```typescript
if (timesheet.statut !== 'submitted') {
  throw Error(`Impossible de valider: statut "${timesheet.statut}"`);
}
```

**Retour** : 400 Bad Request

### Problème potentiel 2 : Bulk validation timeout

**Scénario** : Validation de 1000 timesheets → timeout

**Solution actuelle** : Séquentiel (for loop)

**Amélioration possible** :
- Batch processing (chunks de 50)
- Background job pour gros volumes
- API asynchrone avec webhook

### Problème potentiel 3 : Race condition (2 PO valident en même temps)

**Scénario** :
1. PO1 lit timesheet (statut = submitted)
2. PO2 lit timesheet (statut = submitted)
3. PO1 valide (statut → validated)
4. PO2 valide (statut → validated) → ÉCHEC car statut != submitted

**Protection actuelle** : Check statut dans transaction

**Pas de problème** car :
- Étape 4 échoue avec erreur "statut doit être submitted"
- Une seule validation enregistrée

---

## 📋 TODO CHANTIER_07

### Dashboards & Analytics
**Fichiers** : `api/src/routes/dashboards.routes.ts`

#### Fonctionnalités à implémenter :
- **Dashboard consultant** :
  - Mes timesheets du mois (draft/submitted/validated/rejected)
  - Mon taux d'utilisation
  - Mes interventions actives
  - Alertes : timesheets en attente de soumission

- **Dashboard project owner** :
  - Timesheets en attente de validation
  - Statistiques par projet (validation rate)
  - Consultants de mes projets (utilization)
  - Alertes : timesheets submitted depuis >3 jours

- **Dashboard directeur** :
  - Vue globale ESN (CA, marges, utilisation)
  - Top consultants par CA généré
  - Top projets par marge
  - Alertes : faible utilisation (<50%)

#### Vues à créer :
- Utilisation déjà existante : `v_consultant_utilization`
- Marges déjà existantes : `v_project_margins`
- Nouvelle vue possible : `v_monthly_metrics` (agrégation mensuelle)

---

## 🔍 Vérification finale

### Checklist ✅
- [x] ValidationsService avec 8 méthodes
- [x] Machine à états complète (draft → submitted → validated/rejected)
- [x] Ownership validation (PO limité à ses projets)
- [x] Commentaire obligatoire si rejected
- [x] Validation en masse (bulk operations)
- [x] Re-soumission après rejet (rejected → submitted)
- [x] Historique validations par timesheet
- [x] Statistiques projet et consultant
- [x] ValidationsRoutes avec 8 endpoints + RBAC
- [x] Auto-filtering pending pour PO
- [x] Schémas Zod (ValidateTimesheet, BulkValidate)
- [x] Intégration dans index.ts avec JWT
- [x] TypeScript strict mode (0 erreur)

### Code metrics
- **Service** : 241 lignes (8 méthodes)
- **Routes** : 382 lignes (8 endpoints)
- **Total** : 623 lignes ajoutées

---

## 📚 Documentation utile

- [State Machine Patterns](https://en.wikipedia.org/wiki/Finite-state_machine)
- [Bulk Operations Best Practices](https://www.restapitutorial.com/lessons/restquicktips.html)
- [Zod Array Validation](https://zod.dev/?id=arrays)

---

**CHANTIER_06 TERMINÉ** ✅
**Prochaine étape** : CHANTIER_07 - Dashboards & Analytics

---

*Handoff créé le 2025-10-05*
*Workflow validation complet avec machine à états*
*RBAC strict avec ownership filtering pour project_owner*
