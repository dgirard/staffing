# HANDOFF 05: Timesheets (Saisie demi-journée)

**Date**: 2025-10-05
**Status**: ✅ COMPLÉTÉ
**Prochaine étape**: CHANTIER_06 (Validation timesheets)

---

## 🎯 Objectif du CHANTIER_05

Implémenter la saisie de temps avec système demi-journée :
- Validation stricte 0.5j/1.0j
- Max 1 jour par date
- Contrainte unique (consultant/intervention/date/periode)
- Gestion des statuts (draft/submitted/validated/rejected)
- Modification/suppression uniquement en draft

---

## ✅ Tâches accomplies

### 1. Service Timesheets
**Fichier**: `api/src/services/timesheets.service.ts`

#### Méthodes implémentées :

**validateDayEntry(db, consultantId, interventionId, date, periode, tempsSaisi)**
- Valide saisie pour une journée spécifique
- Vérifie 4 règles métier :
  1. **Pas de doublon période** : matin/apres-midi/journee déjà saisi
  2. **Max 1.0 jour/jour** : SUM(temps_saisi) <= 1.0
  3. **Journée seule** : Si "journee", aucune autre saisie ce jour-là
  4. **Pas de matin/apres-midi si journee** : Si journee existe, bloque matin/apres-midi
- Retourne `{valid: boolean, error?: string, existing_entries?: []}`

**create(db, data)**
- Crée nouvelle saisie après validation complète
- Valide cohérence `temps_saisi` ↔ `periode` :
  - `journee` → DOIT être 1.0
  - `matin`/`apres-midi` → DOIT être 0.5
- Génère ID (`ts_timestamp_random`)
- Statut initial : `draft`

**getById(db, timesheetId)**
- Récupère timesheet avec JOINs (intervention, project, consultant, user)
- Retourne : timesheet + project_nom + consultant nom/prenom

**getByConsultant(db, consultantId, month?)**
- Liste saisies d'un consultant
- Filtre optionnel par mois (`YYYY-MM`)

**getByProject(db, projectId, month?)**
- Liste saisies d'un projet
- Filtre optionnel par mois

**update(db, timesheetId, data)**
- Modifie saisie **UNIQUEMENT si statut = 'draft'**
- Si changement date/periode/temps_saisi → Revalidation complète
- Exclut timesheet courant de la validation (permet modification)
- Valide cohérence temps_saisi ↔ periode

**submit(db, timesheetId)**
- Transition `draft` → `submitted`
- Vérifie statut actuel avant transition

**delete(db, timesheetId)**
- Suppression **UNIQUEMENT si statut = 'draft'**
- Hard delete (pas de soft delete)

**getMonthlySummary(db, consultantId, month)**
- Résumé mensuel : total saisies, total jours, compteurs par statut
- Compte : draft, submitted, validated, rejected

**getDailyEntries(db, consultantId, date)**
- Liste saisies pour une date précise
- Retourne : entries[] pour visualisation journée

#### Règles de validation demi-journée

```typescript
// Règle 1: Pas de doublon période
const duplicatePeriode = existingEntries.find(e => e.periode === periode);
if (duplicatePeriode) {
  return { valid: false, error: 'Période déjà saisie' };
}

// Règle 2: Max 1.0 jour/jour
const currentTotal = existingEntries.reduce((sum, e) => sum + e.temps_saisi, 0);
if (currentTotal + tempsSaisi > 1.0) {
  return { valid: false, error: 'Dépassement max 1.0 jour' };
}

// Règle 3: Journée = saisie unique
if (periode === 'journee' && existingEntries.length > 0) {
  return { valid: false, error: 'Journée complète: impossible matin/apres-midi' };
}

// Règle 4: Si journee existe, bloque matin/apres-midi
const hasJournee = existingEntries.some(e => e.periode === 'journee');
if (hasJournee && periode !== 'journee') {
  return { valid: false, error: 'Journée déjà saisie' };
}
```

### 2. Routes Timesheets
**Fichier**: `api/src/routes/timesheets.routes.ts`

#### Endpoints créés :

**POST /timesheets** (requireAuth)
- Créer saisie de temps
- **Ownership** : Consultant ne peut créer que pour lui-même
- Schéma Zod : `CreateTimesheetSchema`
- Erreur 400 si validation échoue

**GET /timesheets/:id** (requireAuth)
- Détail timesheet
- **Ownership** : Consultant ne voit que ses saisies

**GET /timesheets/my** (requireAuth - consultant only)
- Mes saisies (consultant)
- Query param `?month=YYYY-MM` optionnel
- Erreur 403 si non-consultant

**GET /timesheets/consultant/:consultantId** (requireOwner)
- Saisies d'un consultant (admin/po/directeur)
- Query param `?month=YYYY-MM` optionnel

**GET /timesheets/project/:projectId** (requireOwner)
- Saisies d'un projet (admin/po/directeur)
- Query param `?month=YYYY-MM` optionnel

**PATCH /timesheets/:id** (requireAuth)
- Modifier saisie (draft uniquement)
- **Ownership** : Consultant ne modifie que ses saisies
- Schéma Zod : `UpdateTimesheetSchema`
- Erreur 409 Conflict si statut != draft

**POST /timesheets/:id/submit** (requireAuth)
- Soumettre pour validation (draft → submitted)
- **Ownership** : Consultant ne soumet que ses saisies

**DELETE /timesheets/:id** (requireAuth)
- Supprimer saisie (draft uniquement)
- **Ownership** : Consultant ne supprime que ses saisies
- Erreur 409 Conflict si statut != draft

**GET /timesheets/consultant/:id/summary/:month** (requireAuth)
- Résumé mensuel consultant
- **Ownership** : Consultant ne voit que son résumé
- Retourne : total_entries, total_jours, compteurs statuts

**GET /timesheets/consultant/:id/day/:date** (requireAuth)
- Saisies d'une date précise
- **Ownership** : Consultant ne voit que ses saisies
- Retourne : {entries[], total_jours, remaining}

#### Schémas Zod

```typescript
CreateTimesheetSchema = {
  consultant_id: string,
  intervention_id: string,
  date: string (ISO),
  temps_saisi: literal(0.5) | literal(1.0),  // Union stricte
  periode: enum(['matin', 'apres-midi', 'journee']),
  commentaire: optional nullable string
}

UpdateTimesheetSchema = {
  date: optional string,
  temps_saisi: optional (literal(0.5) | literal(1.0)),
  periode: optional enum(['matin', 'apres-midi', 'journee']),
  commentaire: optional nullable string
}
```

#### Ownership validation (consultant)

Pattern répété 6 fois :
```typescript
if (payload.role === 'consultant') {
  const consultant = await db.prepare('SELECT id FROM consultants WHERE user_id = ?')
    .bind(payload.userId)
    .first<{ id: string }>();

  if (!consultant || consultant.id !== data.consultant_id) {
    return 403 Forbidden;
  }
}
```

### 3. Intégration dans API
**Fichier modifié**: `api/src/index.ts`

- Import `timesheetsRoutes`
- Version API → `0.5.0`
- Message → `"CHANTIER_05 Timesheets"`
- Intégration avec JWT via `basePath()` + `use('*')`

```typescript
const timesheetsApp = app.basePath('/timesheets');
timesheetsApp.use('*', jwtMiddleware);
timesheetsApp.route('/', timesheetsRoutes);
```

---

## 📁 Fichiers créés/modifiés

### Créés :
- `api/src/services/timesheets.service.ts` (343 lignes)
- `api/src/routes/timesheets.routes.ts` (485 lignes)

### Modifiés :
- `api/src/index.ts` (ajout routes timesheets, version 0.5.0)

---

## 🔧 Tests effectués

### TypeScript
```bash
npm run typecheck
# ✅ Aucune erreur (après fixes type casting)
```

---

## 📋 Routes disponibles

### Timesheets (JWT required)
```
POST   /timesheets                              (requireAuth + ownership)
GET    /timesheets/:id                          (requireAuth + ownership)
GET    /timesheets/my                           (requireAuth - consultant only)
GET    /timesheets/consultant/:id               (requireOwner)
GET    /timesheets/project/:id                  (requireOwner)
PATCH  /timesheets/:id                          (requireAuth + ownership + draft only)
POST   /timesheets/:id/submit                   (requireAuth + ownership)
DELETE /timesheets/:id                          (requireAuth + ownership + draft only)
GET    /timesheets/consultant/:id/summary/:month (requireAuth + ownership)
GET    /timesheets/consultant/:id/day/:date     (requireAuth + ownership)
```

---

## 🔍 Logique métier

### 1. Système demi-journée

**3 types de périodes** :
- `matin` → 0.5 jour (matin uniquement)
- `apres-midi` → 0.5 jour (après-midi uniquement)
- `journee` → 1.0 jour (journée complète)

**Combinaisons valides** :

```
✅ VALIDES
- matin (0.5) seul
- apres-midi (0.5) seul
- matin (0.5) + apres-midi (0.5) = 1.0 jour
- journee (1.0) seul

❌ INVALIDES
- matin (0.5) + matin (0.5) → Doublon période
- journee (1.0) + matin (0.5) → Journée = saisie unique
- matin (0.5) + apres-midi (0.5) + autre (0.5) → Dépassement 1.0
- journee avec temps_saisi = 0.5 → Incohérence
- matin avec temps_saisi = 1.0 → Incohérence
```

### 2. Validation cohérence temps_saisi ↔ periode

```typescript
// Règle stricte
if (periode === 'journee' && temps_saisi !== 1.0) {
  throw Error('Journée complète doit être 1.0 jour');
}

if ((periode === 'matin' || periode === 'apres-midi') && temps_saisi !== 0.5) {
  throw Error('Matin/Après-midi doit être 0.5 jour');
}
```

**Exemples** :
- ✅ `{periode: 'journee', temps_saisi: 1.0}` → OK
- ✅ `{periode: 'matin', temps_saisi: 0.5}` → OK
- ❌ `{periode: 'journee', temps_saisi: 0.5}` → ERREUR
- ❌ `{periode: 'matin', temps_saisi: 1.0}` → ERREUR

### 3. Contrainte unique DB

Index unique existant :
```sql
CREATE UNIQUE INDEX idx_timesheets_unique
  ON timesheets(consultant_id, intervention_id, date, periode);
```

**Prévient** :
- 2 saisies "matin" même jour
- 2 saisies "apres-midi" même jour
- 2 saisies "journee" même jour

**Permet** :
- 1 saisie "matin" + 1 saisie "apres-midi" même jour (OK)

### 4. Gestion des statuts

**État des transitions** :
```
draft → submitted (via POST /timesheets/:id/submit)
submitted → validated (CHANTIER_06 - validation)
submitted → rejected (CHANTIER_06 - validation)
```

**Règles modification** :
- ✅ Modifier si `statut = 'draft'`
- ❌ Modifier si `statut IN ('submitted', 'validated', 'rejected')`

**Règles suppression** :
- ✅ Supprimer si `statut = 'draft'`
- ❌ Supprimer si `statut != 'draft'`

### 5. Résumé mensuel

```typescript
{
  total_entries: 15,      // Nombre total de saisies
  total_jours: 10.5,      // SUM(temps_saisi)
  draft_count: 3,         // Brouillons
  submitted_count: 5,     // Soumis pour validation
  validated_count: 7,     // Validés
  rejected_count: 0       // Rejetés
}
```

**Calcul taux utilisation** : `total_jours / 20 * 100`
- 20 jours ouvrés/mois (standard)
- Exemple : 15 jours saisis → 75% utilisation

---

## 🚨 Points d'attention

### 1. Routes ordering (IMPORTANT)

Routes spécifiques AVANT routes paramétrées :

```typescript
// ✅ CORRECT
GET /timesheets/my                           (très spécifique)
GET /timesheets/consultant/:id               (spécifique)
GET /timesheets/consultant/:id/summary/:month (très spécifique)
GET /timesheets/consultant/:id/day/:date     (très spécifique)
GET /timesheets/project/:id                  (spécifique)
GET /timesheets/:id                          (paramétré général)

// ❌ INCORRECT - :id attrape "my", "consultant", "project"
GET /timesheets/:id
GET /timesheets/my
```

### 2. Validation lors de l'update

**Complexité** : Lors d'un PATCH, exclure le timesheet courant de la validation :

```typescript
// Récupérer saisies existantes SAUF la courante
WHERE consultant_id = ?
  AND date = ?
  AND intervention_id = ?
  AND id != ?  // ← IMPORTANT: Exclure timesheet en cours de modif
```

**Pourquoi** : Sinon le timesheet compte dans sa propre validation → Toujours conflit !

**Exemple** :
```
Timesheet TS1: matin (0.5) - statut draft
PATCH TS1 → change periode de "matin" à "apres-midi"

SANS exclusion:
  - Trouve TS1 avec "matin"
  - Essaie ajouter "apres-midi"
  - Total = 0.5 (matin) + 0.5 (apres-midi) = 1.0
  - ✅ OK par chance

Mais si PATCH TS1 → garde "matin":
  - Trouve TS1 avec "matin"
  - Essaie ajouter "matin"
  - ERREUR "Période déjà saisie"
  - ❌ Impossible de modifier (même période)

AVEC exclusion (id != ?):
  - Trouve rien (TS1 exclu)
  - Essaie ajouter "matin"
  - ✅ OK
```

### 3. Type casting D1 results

```typescript
// ✅ CORRECT - Type assertions explicites
const newDate = data.date || (timesheet.date as string);
const newPeriode = data.periode || (timesheet.periode as 'matin' | 'apres-midi' | 'journee');
const newTempsSaisi = data.temps_saisi !== undefined
  ? data.temps_saisi
  : (timesheet.temps_saisi as 0.5 | 1.0);
```

### 4. Query params optionnels

Filtre par mois :
```typescript
// Route: GET /timesheets/consultant/:id?month=2025-10
const month = c.req.query('month'); // "2025-10" ou undefined

// Service utilise le param si fourni
const timesheets = await service.getByConsultant(db, consultantId, month);

// SQL adapté
if (month) {
  query += ` AND strftime('%Y-%m', date) = ?`;
  bindings.push(month);
}
```

### 5. Résumé journée

Endpoint `/timesheets/consultant/:id/day/:date` retourne :

```json
{
  "date": "2025-10-05",
  "entries": [
    {"id": "ts_001", "periode": "matin", "temps_saisi": 0.5, "project_nom": "Alpha"},
    {"id": "ts_002", "periode": "apres-midi", "temps_saisi": 0.5, "project_nom": "Beta"}
  ],
  "total_jours": 1.0,
  "remaining": 0.0
}
```

**Utile pour** :
- Afficher calendrier consultant
- Vérifier allocation journalière
- Empêcher dépassement en temps réel (UI)

---

## ⚠️ Problèmes rencontrés et solutions

### Problème 1 : Type inference temps_saisi dans update
**Erreur** : `'newTempsSaisi' is of type 'unknown'`

**Cause** : `data.temps_saisi` peut être `undefined` → Fallback vers `timesheet.temps_saisi` (type unknown de D1)

**Solution** : Vérifier `undefined` explicitement + cast
```typescript
const newTempsSaisi = data.temps_saisi !== undefined
  ? data.temps_saisi
  : (timesheet.temps_saisi as 0.5 | 1.0);
```

---

## 📋 TODO CHANTIER_06

### Validation Timesheets (Project Owner)
**Fichier** : `api/src/routes/validations.routes.ts`

#### Fonctionnalités à implémenter :
- `POST /validations` - Valider/Rejeter timesheet (po/admin/directeur)
- `GET /validations/:id` - Détail validation
- `GET /validations/timesheet/:id` - Historique validations d'un timesheet
- `GET /validations/pending` - Liste timesheets en attente (po/admin/directeur)
- `GET /validations/my-pending` - Timesheets à valider pour mes projets (po)

#### Validations métier :
- **Transition statut** : submitted → validated/rejected
- **Ownership PO** : PO ne peut valider que timesheets de ses projets
- **Commentaire rejet** : Obligatoire si rejected
- **Historique** : Tracer validateur + date + commentaire
- **Notification** : Informer consultant (email/notif - optionnel)

#### Service à créer :
**Fichier** : `api/src/services/validations.service.ts`
- Vérifier statut timesheet (doit être "submitted")
- Vérifier ownership projet (si PO)
- Créer entrée validation
- Mettre à jour statut timesheet
- Historique validations par timesheet

---

## 🔍 Vérification finale

### Checklist ✅
- [x] TimesheetsService avec 10 méthodes
- [x] Validation demi-journée stricte (4 règles)
- [x] Cohérence temps_saisi ↔ periode
- [x] Modification/suppression draft uniquement
- [x] TimesheetsRoutes avec 10 endpoints + RBAC
- [x] Ownership validation (consultant)
- [x] Schémas Zod (CreateTimesheet, UpdateTimesheet)
- [x] Query params optionnels (month)
- [x] Résumé mensuel + journalier
- [x] Intégration dans index.ts avec JWT
- [x] TypeScript strict mode (0 erreur)

### Code metrics
- **Service** : 343 lignes (10 méthodes)
- **Routes** : 485 lignes (10 endpoints)
- **Total** : 828 lignes ajoutées

---

## 📚 Documentation utile

- [Zod Literals](https://zod.dev/?id=literals)
- [Zod Unions](https://zod.dev/?id=unions)
- [SQLite Date Functions](https://www.sqlite.org/lang_datefunc.html)

---

**CHANTIER_05 TERMINÉ** ✅
**Prochaine étape** : CHANTIER_06 - Validation Timesheets

---

*Handoff créé le 2025-10-05*
*Saisie demi-journée avec validation stricte implémentée*
*Gestion complète des statuts et ownership*
