# HANDOFF 04: Interventions (Allocations)

**Date**: 2025-10-05
**Status**: ✅ COMPLÉTÉ
**Prochaine étape**: CHANTIER_05 (Timesheets)

---

## 🎯 Objectif du CHANTIER_04

Implémenter la gestion des interventions (allocations consultant→projet) avec :
- Détection automatique des conflits d'allocation
- Verrouillage du TJ au moment de l'allocation
- Validation des pourcentages (max 100% par consultant)
- CRUD complet avec ownership validation

---

## ✅ Tâches accomplies

### 1. Service Interventions
**Fichier**: `api/src/services/interventions.service.ts`

#### Méthodes implémentées :

**checkConflicts(db, consultantId, dateDebut, dateFin, newAllocation)**
- Détecte les chevauchements de dates pour un consultant
- Calcule l'allocation totale sur les périodes qui se chevauchent
- Retourne les conflits si allocation totale > 100%
- Gère 3 cas de chevauchement :
  1. Nouvelle intervention sans date_fin (chevauche tout après start)
  2. Intervention existante sans date_fin (chevauche tout après son start)
  3. Les deux ont des dates de fin (overlap classique)

**create(db, data)**
- Vérifie les conflits d'allocation AVANT insertion
- Valide les dates (`date_fin >= date_debut`)
- Valide le pourcentage (0-100)
- Génère ID intervention (`int_timestamp_random`)
- **Verrouille le TJ** au moment de l'allocation (tj_facture)
- Crée l'intervention avec statut 'active'

**getById(db, interventionId)**
- Récupère intervention avec JOINs (project, consultant, user)
- Retourne : intervention + project_nom + client + consultant nom/prenom + tjm_defaut

**getByConsultant(db, consultantId, activeOnly)**
- Liste interventions d'un consultant
- Option `activeOnly=true` pour filtrer statut='active'
- JOIN avec projects pour nom/client

**getByProject(db, projectId)**
- Liste interventions d'un projet
- JOIN avec consultants + users pour nom/prenom/tjm_defaut

**updateAllocation(db, interventionId, newAllocation)**
- Modifie le pourcentage d'allocation
- Vérifie conflits avec nouveau pourcentage
- Exclut l'intervention courante des conflits (permet de réduire allocation)
- Valide 0-100%

**end(db, interventionId)**
- Termine une intervention
- Set `date_fin = today`, `statut = 'terminee'`
- Empêche de terminer une intervention déjà terminée

**delete(db, interventionId)**
- Suppression hard delete
- **Bloque si timesheets associés** (protection données)
- Compte les timesheets avant suppression

**getCurrentAllocation(db, consultantId)**
- Calcule l'allocation actuelle d'un consultant (%)
- Filtre par date du jour (`date_debut <= today <= date_fin`)
- Somme des `pourcentage_allocation` des interventions actives

#### Logique de détection de conflits

```sql
-- Chevauchement de dates (3 cas)
WHERE consultant_id = ?
  AND statut = 'active'
  AND (
    -- Cas 1: Nouvelle intervention sans fin (chevauche tout après)
    (? IS NULL AND (i.date_fin IS NULL OR i.date_fin >= ?))
    OR
    -- Cas 2: Intervention existante sans fin
    (i.date_fin IS NULL AND ? >= i.date_debut)
    OR
    -- Cas 3: Les deux ont une fin - overlap classique
    (? IS NOT NULL AND i.date_fin IS NOT NULL
     AND ? <= i.date_fin AND ? >= i.date_debut)
  )
```

**Calcul allocation totale** :
- SUM(pourcentage_allocation) des interventions qui chevauchent
- Si `total + nouvelle_allocation > 100` → CONFLIT

### 2. Routes Interventions
**Fichier**: `api/src/routes/interventions.routes.ts`

#### Endpoints créés :

**POST /interventions** (requireOwner)
- Créer allocation consultant→projet
- Schéma Zod : `CreateInterventionSchema`
- **Ownership validation** : project_owner ne peut allouer que sur ses projets
- Erreur 409 Conflict si allocation > 100%
- Erreur 400 Bad Request si dates invalides

**GET /interventions/:id** (requireAuth)
- Détail intervention avec infos projet + consultant
- Erreur 404 si non trouvée

**GET /interventions/consultant/:consultantId** (requireAuth)
- Liste interventions d'un consultant
- Query param `?active=true` pour filtrer actives uniquement
- **Ownership check** : consultant ne voit que ses propres interventions
- Erreur 403 Forbidden si consultant essaie de voir autres

**GET /interventions/project/:projectId** (requireAuth)
- Liste interventions d'un projet (consultants assignés)
- Accessible à tous les rôles authentifiés

**PATCH /interventions/:id/allocation** (requireOwner)
- Modifier pourcentage d'allocation
- Schéma Zod : `UpdateAllocationSchema` (0-100)
- **Ownership validation** : project_owner limité à ses projets
- Détection conflits avec nouveau pourcentage
- Erreur 409 si conflit, 404 si non trouvée

**POST /interventions/:id/end** (requireOwner)
- Terminer intervention (date_fin=today, statut=terminee)
- **Ownership validation** : project_owner limité à ses projets
- Erreur 400 si déjà terminée

**DELETE /interventions/:id** (requireOwner)
- Supprimer intervention (hard delete)
- **Bloque si timesheets** : Erreur 409 Conflict
- **Ownership validation** : project_owner limité à ses projets

**GET /interventions/consultant/:consultantId/current-allocation** (requireAuth)
- Récupère allocation actuelle en % (à date du jour)
- Retourne : `{current_allocation: 75, available_allocation: 25}`
- **Ownership check** : consultant ne voit que sa propre allocation

#### Schémas Zod

```typescript
CreateInterventionSchema = {
  consultant_id: string,
  project_id: string,
  date_debut: string (ISO),
  date_fin: optional nullable string,
  tj_facture: positive number,
  pourcentage_allocation: number (0-100)
}

UpdateAllocationSchema = {
  pourcentage_allocation: number (0-100)
}
```

#### Ownership validation (project_owner)

Toutes les routes de modification vérifient :
1. Récupérer `project_id` de l'intervention
2. Récupérer `owner_id` du projet
3. Comparer avec `payload.userId`
4. Erreur 403 Forbidden si différent

**administrator** et **directeur** : Aucune restriction (accès total)

### 3. Intégration dans API
**Fichier modifié**: `api/src/index.ts`

- Import `interventionsRoutes`
- Version API → `0.4.0`
- Message → `"CHANTIER_04 Interventions"`
- Intégration avec JWT via `basePath()` + `use('*')`

```typescript
const interventionsApp = app.basePath('/interventions');
interventionsApp.use('*', jwtMiddleware);
interventionsApp.route('/', interventionsRoutes);
```

---

## 📁 Fichiers créés/modifiés

### Créés :
- `api/src/services/interventions.service.ts` (267 lignes)
- `api/src/routes/interventions.routes.ts` (522 lignes)

### Modifiés :
- `api/src/index.ts` (ajout routes interventions, version 0.4.0)

---

## 🔧 Tests effectués

### TypeScript
```bash
npm run typecheck
# ✅ Aucune erreur (après fixes type casting)
```

---

## 📋 Routes disponibles

### Interventions (JWT required)
```
POST   /interventions                                    (requireOwner + ownership)
GET    /interventions/:id                                (requireAuth)
GET    /interventions/consultant/:consultantId           (requireAuth + ownership)
GET    /interventions/project/:projectId                 (requireAuth)
PATCH  /interventions/:id/allocation                     (requireOwner + ownership)
POST   /interventions/:id/end                            (requireOwner + ownership)
DELETE /interventions/:id                                (requireOwner + ownership)
GET    /interventions/consultant/:id/current-allocation  (requireAuth + ownership)
```

---

## 🔍 Logique métier

### 1. Détection de conflits d'allocation

**Règle** : Un consultant ne peut pas être alloué à plus de 100% simultanément

**Algorithme** :
1. Trouver toutes les interventions actives du consultant
2. Filtrer celles qui chevauchent la période demandée
3. Calculer SUM(pourcentage_allocation) des interventions qui chevauchent
4. Si `total_existant + nouvelle_allocation > 100` → CONFLIT

**Exemples de conflits** :

```
Intervention A: Consultant C1, 50%, 2024-01-01 → 2024-06-30
Intervention B: Consultant C1, 60%, 2024-03-01 → 2024-09-30
→ CONFLIT sur période 2024-03-01 → 2024-06-30 (50% + 60% = 110%)

Intervention A: Consultant C1, 100%, 2024-01-01 → NULL (pas de fin)
Intervention B: Consultant C1, 20%, 2024-05-01 → 2024-12-31
→ CONFLIT car A occupe 100% indéfiniment
```

**Exemples OK** :

```
Intervention A: Consultant C1, 50%, 2024-01-01 → 2024-03-31
Intervention B: Consultant C1, 100%, 2024-04-01 → 2024-12-31
→ OK (pas de chevauchement)

Intervention A: Consultant C1, 60%, 2024-01-01 → 2024-12-31
Intervention B: Consultant C1, 40%, 2024-06-01 → 2024-08-31
→ OK (60% + 40% = 100%)
```

### 2. Verrouillage du TJ

**Principe** : Le TJ facturé ne doit JAMAIS changer après l'allocation

**Implémentation** :
- Champ `tj_facture` dans table interventions
- Valeur fournie à la création (provient généralement du `tjm_defaut` du consultant)
- **Aucune méthode** pour modifier le `tj_facture` après création
- Garantit stabilité financière des engagements

**Exemple** :
```
T0: Consultant a tjm_defaut = 600€
T1: Création intervention → tj_facture = 600€ (verrouillé)
T2: Consultant tjm_defaut change à 650€
T3: Intervention conserve tj_facture = 600€ (pas de changement rétroactif)
```

### 3. Gestion des dates

**Validations** :
- `date_fin` doit être `>= date_debut` (si définie)
- `date_fin = NULL` → Intervention ouverte (pas de fin prévue)

**Chevauchement avec date_fin NULL** :
```sql
-- Si intervention A a date_fin = NULL
-- Elle chevauche TOUTE intervention qui commence après date_debut
WHERE date_debut >= A.date_debut
```

### 4. Protection des données (timesheets)

**Règle** : Impossible de supprimer une intervention avec timesheets

**Implémentation** :
```typescript
// Compte timesheets avant DELETE
SELECT COUNT(*) FROM timesheets WHERE intervention_id = ?

if (count > 0) {
  throw Error('X timesheet(s) associé(s)');
}
```

**Alternative** : Utiliser `end()` pour terminer l'intervention (soft delete)

---

## 🚨 Points d'attention

### 1. Routes ordering (IMPORTANT)

Routes spécifiques AVANT routes paramétrées :

```typescript
// ✅ CORRECT
GET /interventions/consultant/:id           (spécifique)
GET /interventions/consultant/:id/current-allocation (très spécifique)
GET /interventions/project/:id              (spécifique)
GET /interventions/:id                      (paramétré général)

// ❌ INCORRECT
GET /interventions/:id                      (attrape "consultant", "project")
GET /interventions/consultant/:id
```

**Solution** : Dans Hono, définir routes dans cet ordre dans le fichier

### 2. Ownership validation pattern

Répété 5 fois dans le code :
```typescript
if (payload.role === 'project_owner') {
  // 1. Get intervention → project_id
  const intervention = await db.prepare(...).bind(interventionId).first();

  // 2. Get project → owner_id
  const project = await db.prepare(...).bind(intervention.project_id).first();

  // 3. Compare
  if (project.owner_id !== payload.userId) {
    return 403 Forbidden;
  }
}
```

**Amélioration possible** : Extraire dans helper function `verifyInterventionOwnership()`

### 3. Type casting D1 results

D1 retourne `Record<string, unknown>[]` → Besoin de cast :

```typescript
// ✅ CORRECT
return result.results as unknown as AllocationConflict[];

// ❌ NE COMPILE PAS
return result.results as AllocationConflict[];
```

### 4. Calcul allocation courante

Utilise **date du jour** pour filtrage :
```typescript
const today = new Date().toISOString().split('T')[0]; // "2025-10-05"

WHERE date_debut <= ? AND (date_fin IS NULL OR date_fin >= ?)
```

**Attention timezone** : `new Date()` utilise timezone local → Possibles décalages si serveur en UTC

### 5. Modification allocation

Lors d'un PATCH allocation, **exclure l'intervention courante** des conflits :

```typescript
const conflicts = await checkConflicts(...);
const otherConflicts = conflicts.filter(c => c.intervention_id !== interventionId);
```

**Pourquoi** : Sinon l'intervention actuelle compte dans son propre conflit → Toujours conflit !

---

## ⚠️ Problèmes rencontrés et solutions

### Problème 1 : Type conversion D1 results
**Erreur** : `Conversion of type 'Record<string, unknown>[]' to type 'AllocationConflict[]' may be a mistake`

**Solution** : Double cast `as unknown as AllocationConflict[]`

### Problème 2 : Type assertion intervention fields
**Erreur** : `Argument of type 'unknown' is not assignable to parameter of type 'string'`

**Cause** : D1 `.first()` retourne `Record<string, unknown> | null`

**Solution** : Cast explicite
```typescript
intervention.consultant_id as string
intervention.date_debut as string
intervention.date_fin as string | null
```

---

## 📋 TODO CHANTIER_05

### Timesheets (Saisie temps)
**Fichier** : `api/src/routes/timesheets.routes.ts`

#### Fonctionnalités à implémenter :
- `POST /timesheets` - Créer saisie (consultant ou admin)
- `GET /timesheets/my` - Mes saisies (consultant)
- `GET /timesheets/:id` - Détail timesheet
- `PATCH /timesheets/:id` - Modifier (draft uniquement)
- `DELETE /timesheets/:id` - Supprimer (draft uniquement)
- `POST /timesheets/:id/submit` - Soumettre pour validation
- `GET /timesheets/consultant/:id` - Saisies d'un consultant (admin/po)
- `GET /timesheets/project/:id` - Saisies d'un projet (admin/po)

#### Validations métier :
- **Demi-journée** : `temps_saisi IN (0.5, 1.0)`
- **Contrainte unique** : 1 seule saisie par (consultant, intervention, date, periode)
- **Statuts** : draft → submitted → validated/rejected
- **Modification** : Uniquement si statut = 'draft'
- **Suppression** : Uniquement si statut = 'draft'
- **Période** : matin (0.5) + apres-midi (0.5) OU journee (1.0)

#### Service à créer :
**Fichier** : `api/src/services/timesheets.service.ts`
- Validation contrainte unique (consultant/intervention/date/periode)
- Vérification statut avant modification/suppression
- Calcul temps saisi par période (jour, semaine, mois)
- Transition d'états (draft → submitted, submitted → validated/rejected)

---

## 🔍 Vérification finale

### Checklist ✅
- [x] InterventionsService avec 9 méthodes
- [x] Détection conflits allocation (chevauchement dates)
- [x] Verrouillage TJ à l'allocation
- [x] Validation 0-100% allocation
- [x] Protection suppression (timesheets check)
- [x] InterventionsRoutes avec 8 endpoints + RBAC
- [x] Ownership validation (project_owner)
- [x] Schémas Zod (CreateIntervention, UpdateAllocation)
- [x] Intégration dans index.ts avec JWT
- [x] TypeScript strict mode (0 erreur)

### Code metrics
- **Service** : 267 lignes (9 méthodes)
- **Routes** : 522 lignes (8 endpoints)
- **Total** : 789 lignes ajoutées

---

## 📚 Documentation utile

- [D1 Date Functions](https://www.sqlite.org/lang_datefunc.html)
- [Zod Number Validation](https://zod.dev/?id=numbers)
- [Hono Error Handling](https://hono.dev/guides/validation#error-handling)

---

**CHANTIER_04 TERMINÉ** ✅
**Prochaine étape** : CHANTIER_05 - Timesheets (Saisie temps)

---

*Handoff créé le 2025-10-05*
*Gestion complète des interventions avec détection de conflits*
*Verrouillage TJ et ownership validation implémentés*
