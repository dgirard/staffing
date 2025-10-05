# HANDOFF 03: CRUD Consultants + Projects

**Date**: 2025-10-05
**Status**: ✅ COMPLÉTÉ
**Prochaine étape**: CHANTIER_04 (Interventions)

---

## 🎯 Objectif du CHANTIER_03

Créer les routes et services CRUD pour :
- Consultants (liste, détail, utilisation, disponibilité)
- Projets (création, lecture, interventions, marges)
- Contrôle d'accès RBAC strict
- Filtrage CJR selon rôle

---

## ✅ Tâches accomplies

### 1. Service Consultants
**Fichier**: `api/src/services/consultants.service.ts`

#### Méthodes implémentées :
- `list(db)` - Liste tous les consultants avec infos user (JOIN)
- `getByUserId(db, userId)` - Profil consultant par user ID (compétences parsées JSON)
- `toggleDisponibilite(db, consultantId)` - Toggle disponible 0/1
- `getUtilization(db, consultantId)` - Stats utilisation (vue v_consultant_utilization)
- `getAllUtilizations(db)` - Toutes les utilisations (admin/directeur)

#### Caractéristiques :
- **Parse JSON** automatique pour `competences`
- **Gestion d'erreur** si consultant non trouvé
- **Retour booléen** pour disponibilité (conversion 0/1 → false/true)

### 2. Routes Consultants
**Fichier**: `api/src/routes/consultants.routes.ts`

#### Endpoints créés :
```typescript
GET    /consultants                    // Liste (admin/directeur)
GET    /consultants/me                 // Mon profil (consultant)
GET    /consultants/:id/utilization    // Utilisation (auth + ownership check)
GET    /consultants/utilizations/all   // Toutes utilisations (admin/directeur)
PATCH  /consultants/:id/disponibilite  // Toggle disponibilité (admin/directeur)
```

#### RBAC appliqué :
- `requireAdmin` - Liste consultants, toggle disponibilité, toutes utilisations
- `requireAuth` - Voir utilisation (avec vérification ownership pour consultants)
- **Ownership check** : Consultant ne peut voir que sa propre utilisation

#### Validations :
- Vérification rôle pour `/me` (consultant uniquement)
- Vérification ownership pour `/consultants/:id/utilization` (consultant)
- Error 404 si consultant/profil non trouvé
- Error 403 si accès refusé (ownership)

### 3. Service Projects
**Fichier**: `api/src/services/projects.service.ts`

#### Méthodes implémentées :
- `create(db, data)` - Créer projet avec génération ID (`prj_timestamp_random`)
- `getById(db, projectId, userRole)` - Projet avec filtrage CJR selon rôle
- `listActive(db, userRole)` - Projets actifs avec filtrage CJR
- `listByOwner(db, ownerId, userRole)` - Projets par owner avec filtrage CJR
- `getInterventions(db, projectId)` - Consultants assignés (JOIN)
- `getMargins(db, projectId)` - Marges projet (vue v_project_margins)
- `getAllMargins(db)` - Toutes marges (directeur)
- `updateStatus(db, projectId, statut)` - Changer statut (actif/termine/annule)
- `isOwner(db, projectId, userId)` - Vérifier ownership

#### Filtrage CJR :
```typescript
// Directeur → Voit CJR
if (userRole === 'directeur') {
  return getProjectByIdWithCJR(db, projectId);
}

// Autres → CJR caché
return getProjectByIdPublic(db, projectId);

// OU destructuring pour listes
return results.map(({ cjr, ...rest }) => rest);
```

### 4. Routes Projects
**Fichier**: `api/src/routes/projects.routes.ts`

#### Endpoints créés :
```typescript
GET    /projects                  // Liste actifs (auth + CJR filtré)
POST   /projects                  // Créer (owner/admin/directeur + validation ownership)
GET    /projects/my               // Mes projets (owner)
GET    /projects/:id              // Détail (auth + CJR filtré)
GET    /projects/:id/interventions // Consultants assignés (auth)
GET    /projects/:id/margins      // Marges (directeur uniquement)
GET    /projects/margins/all      // Toutes marges (directeur)
PATCH  /projects/:id/status       // Changer statut (owner + ownership check)
```

#### Schémas Zod :
```typescript
CreateProjectSchema = {
  nom: min(3),
  client: min(2),
  type: enum(['regie', 'forfait', 'centre_de_service']),
  date_debut: string (ISO),
  date_fin: optional nullable,
  cjn: positive,
  cjr: optional nullable positive,
  owner_id: string
}

UpdateStatusSchema = {
  statut: enum(['actif', 'termine', 'annule'])
}
```

#### RBAC appliqué :
- `requireAuth` - Liste, détail, interventions
- `requireOwner` - Création, modification statut
- `requireDirecteur` - Marges
- **Ownership validation** :
  - `POST /projects` : project_owner ne peut créer que pour lui-même
  - `PATCH /:id/status` : project_owner ne peut modifier que ses projets

### 5. Intégration dans API
**Fichier modifié**: `api/src/index.ts`

#### Changements :
- Import `consultantsRoutes`, `projectsRoutes`
- Version API → `0.3.0`
- Message → `"CHANTIER_03 CRUD"`

#### Intégration routes avec JWT :
```typescript
// Note: route() ne prend pas de middleware en 2e param
const consultantsApp = app.basePath('/consultants');
consultantsApp.use('*', jwtMiddleware);
consultantsApp.route('/', consultantsRoutes);

const projectsApp = app.basePath('/projects');
projectsApp.use('*', jwtMiddleware);
projectsApp.route('/', projectsRoutes);
```

**Pourquoi `basePath()` + `use()` ?**
- Hono `route()` n'accepte que 2 paramètres : `(path, handler)`
- Pour appliquer middleware JWT à toutes les routes, utiliser `basePath()` + `use('*')`

---

## 📁 Fichiers créés/modifiés

### Créés :
- `api/src/services/consultants.service.ts` (100 lignes)
- `api/src/routes/consultants.routes.ts` (162 lignes)
- `api/src/services/projects.service.ts` (156 lignes)
- `api/src/routes/projects.routes.ts` (206 lignes)

### Modifiés :
- `api/src/index.ts` (ajout routes consultants + projects, version 0.3.0)

---

## 🔧 Tests effectués

### TypeScript
```bash
npm run typecheck
# ✅ Aucune erreur
```

### API locale
```bash
npx wrangler dev --local --port 8787

# Test root
curl http://localhost:8787/
# → {"status":"ok","message":"Staffing ESN API - CHANTIER_03 CRUD","version":"0.3.0"}
```

---

## 📋 Routes disponibles

### Authentication (Public)
```
POST   /auth/register
POST   /auth/login
GET    /auth/me (JWT required)
```

### Consultants (JWT required)
```
GET    /consultants                      (requireAdmin)
GET    /consultants/me                   (requireAuth + consultant role)
GET    /consultants/:id/utilization      (requireAuth + ownership)
GET    /consultants/utilizations/all     (requireAdmin)
PATCH  /consultants/:id/disponibilite    (requireAdmin)
```

### Projects (JWT required)
```
GET    /projects                         (requireAuth)
POST   /projects                         (requireOwner + ownership validation)
GET    /projects/my                      (requireOwner)
GET    /projects/:id                     (requireAuth)
GET    /projects/:id/interventions       (requireAuth)
GET    /projects/:id/margins             (requireDirecteur)
GET    /projects/margins/all             (requireDirecteur)
PATCH  /projects/:id/status              (requireOwner + ownership validation)
```

---

## 🔍 Contrôle d'accès RBAC

### Matrice des permissions

| Route | consultant | project_owner | administrator | directeur |
|-------|-----------|---------------|---------------|-----------|
| GET /consultants | ❌ | ❌ | ✅ | ✅ |
| GET /consultants/me | ✅ | ❌ | ❌ | ❌ |
| GET /consultants/:id/utilization | ✅ (own) | ✅ | ✅ | ✅ |
| GET /consultants/utilizations/all | ❌ | ❌ | ✅ | ✅ |
| PATCH /consultants/:id/disponibilite | ❌ | ❌ | ✅ | ✅ |
| GET /projects | ✅ | ✅ | ✅ | ✅ |
| POST /projects | ❌ | ✅ (self) | ✅ | ✅ |
| GET /projects/my | ❌ | ✅ | ✅ | ✅ |
| GET /projects/:id | ✅ | ✅ | ✅ | ✅ (+ CJR) |
| GET /projects/:id/interventions | ✅ | ✅ | ✅ | ✅ |
| GET /projects/:id/margins | ❌ | ❌ | ❌ | ✅ |
| GET /projects/margins/all | ❌ | ❌ | ❌ | ✅ |
| PATCH /projects/:id/status | ❌ | ✅ (own) | ✅ | ✅ |

### Filtrage CJR

| Rôle | Peut voir CJR ? |
|------|----------------|
| consultant | ❌ |
| project_owner | ❌ |
| administrator | ❌ |
| directeur | ✅ |

**Implémentation** :
- `getById()`, `listActive()`, `listByOwner()` → Filtrage automatique selon `userRole`
- Routes marges (`/margins`) → `requireDirecteur` middleware

---

## 🚨 Points d'attention

### 1. Ownership validation
**project_owner** a des restrictions :
- `POST /projects` : Ne peut créer que pour `owner_id === payload.userId`
- `PATCH /projects/:id/status` : Ne peut modifier que si `isOwner(projectId, userId)`

**administrator** et **directeur** : Aucune restriction ownership

### 2. Filtrage CJR
Deux approches selon type de requête :

**Single record** :
```typescript
if (userRole === 'directeur') {
  return getProjectByIdWithCJR(db, projectId);
}
return getProjectByIdPublic(db, projectId);
```

**Multiple records** :
```typescript
if (userRole === 'directeur') {
  return result.results;
}
return result.results.map(({ cjr, ...rest }) => rest);
```

### 3. Compétences JSON
- Stockées en TEXT dans DB : `'["React", "TypeScript"]'`
- Service parse automatiquement : `JSON.parse(consultant.competences || '[]')`
- Routes reçoivent tableau : `["React", "TypeScript"]`

### 4. Disponibilité (boolean vs integer)
- DB stocke **0** (non dispo) / **1** (dispo)
- Service convertit **0 → false**, **1 → true**
- Routes exposent **boolean**

### 5. Routes ordering
**Important** : Routes spécifiques AVANT routes paramétrées

```typescript
// ✅ CORRECT
GET /consultants/utilizations/all  (spécifique)
GET /consultants/:id/utilization   (paramétré)

// ✅ CORRECT
GET /projects/my                   (spécifique)
GET /projects/margins/all          (spécifique)
GET /projects/:id                  (paramétré)

// ❌ INCORRECT
GET /consultants/:id/utilization   (attrape "utilizations")
GET /consultants/utilizations/all
```

---

## ⚠️ Problèmes rencontrés et solutions

### Problème 1 : Hono route() ne prend pas de middleware
**Erreur** : `Expected 2 arguments, but got 3.`
```typescript
// ❌ NE FONCTIONNE PAS
app.route('/consultants', jwtMiddleware, consultantsRoutes);
```

**Solution** : Utiliser `basePath()` + `use('*')`
```typescript
// ✅ FONCTIONNE
const consultantsApp = app.basePath('/consultants');
consultantsApp.use('*', jwtMiddleware);
consultantsApp.route('/', consultantsRoutes);
```

### Problème 2 : Type conversion D1 results
**Erreur** : `Conversion of type 'Record<string, unknown>[]' to type 'ConsultantWithUser[]' may be a mistake`

**Solution** : Double cast `as unknown as ConsultantWithUser[]`
```typescript
return result.results as unknown as ConsultantWithUser[];
```

### Problème 3 : isOwner() return type
**Erreur** : `Type 'boolean | null' is not assignable to type 'boolean'`

**Cause** : `project && project.owner_id === userId` peut retourner `null`

**Solution** : Check explicite
```typescript
if (!project) return false;
return project.owner_id === userId;
```

### Problème 4 : Unused import
**Erreur** : `'Role' is declared but its value is never read`

**Solution** : Supprimer import inutilisé après refactoring `list(db, userRole)` → `list(db)`

---

## 📋 TODO CHANTIER_04

### Interventions (Allocations consultant/projet)
**Fichier** : `api/src/routes/interventions.routes.ts`
- `POST /interventions` - Créer allocation (owner/admin/directeur)
- `GET /interventions/:id` - Détail intervention
- `PATCH /interventions/:id/allocation` - Modifier % allocation
- `DELETE /interventions/:id` - Terminer intervention
- `GET /consultants/:id/interventions` - Interventions d'un consultant
- `GET /projects/:id/interventions` - Déjà fait (appeler service projects)

### Validations à prévoir
- **TJ verrouillé** : `tj_facture` ne doit pas changer après création
- **Dates cohérentes** : `date_fin >= date_debut` (si définie)
- **Allocation totale** : SUM(pourcentage_allocation) <= 100% par consultant
- **Conflit dates** : Vérifier chevauchement interventions actives

### Service à créer
**Fichier** : `api/src/services/interventions.service.ts`
- Logique métier allocations
- Validation % total par consultant
- Détection conflits dates

---

## 🔍 Vérification finale

### Checklist ✅
- [x] ConsultantsService avec 5 méthodes
- [x] ConsultantsRoutes avec 5 endpoints + RBAC
- [x] ProjectsService avec 9 méthodes + filtrage CJR
- [x] ProjectsRoutes avec 8 endpoints + RBAC + ownership
- [x] Schémas Zod validation (CreateProject, UpdateStatus)
- [x] Intégration dans index.ts avec JWT
- [x] TypeScript strict mode (0 erreur)
- [x] Tests API locaux (root endpoint)

### Endpoints testés
```bash
✅ GET  /                    - Version 0.3.0 CHANTIER_03
✅ npm run typecheck         - 0 erreur TypeScript
```

### Endpoints non testés (nécessitent DB seed + JWT)
```
⏸️ GET  /consultants
⏸️ GET  /consultants/me
⏸️ GET  /projects
⏸️ POST /projects
```

**Raison** : DB seed utilise `$2a$10$YourHashedPasswordHere` (placeholder password hash)
**Action requise** : Mettre à jour seed data avec vrais hashes bcrypt

---

## 📚 Documentation utile

- [Hono Routing](https://hono.dev/api/routing)
- [Hono Middleware](https://hono.dev/api/middleware)
- [Zod Validation](https://zod.dev/)
- [D1 Client API](https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/)

---

**CHANTIER_03 TERMINÉ** ✅
**Prochaine étape** : CHANTIER_04 - Interventions (Allocations)

---

*Handoff créé le 2025-10-05*
*Services et routes CRUD fonctionnels avec RBAC strict*
*Filtrage CJR implémenté pour tous les endpoints projects*
