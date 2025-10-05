# HANDOFF 07 : Dashboards & Analytics

**Date** : 2025-10-05
**Chantier** : CHANTIER_07
**Statut** : ✅ TERMINÉ
**Durée** : 4j (estimé)

---

## 🎯 Objectifs

Implémenter des dashboards analytiques adaptés à chaque rôle utilisateur :
- ✅ Dashboard Consultant (mes projets, mon temps)
- ✅ Dashboard Project Owner (validation, budgets)
- ✅ Dashboard Administrator (capacité globale)
- ✅ Dashboard Directeur (marges CJR confidentielles)

---

## 📦 Livrables

### 1. Service Layer (`dashboards.service.ts`)

**Fichier** : `api/src/services/dashboards.service.ts` (268 lignes)

**Méthodes implémentées** :
- `getConsultantStats(db, userId)` - Dashboard consultant
- `getProjectOwnerStats(db, userId)` - Dashboard project owner
- `getAdminStats(db)` - Dashboard administrator
- `getDirecteurStats(db)` - Dashboard directeur avec CJR
- `getWeekStart(date)` - Helper calcul début de semaine
- `getWeekEnd(date)` - Helper calcul fin de semaine

**Fonctionnalités clés** :

#### Dashboard Consultant
- Jours validés ce mois
- Nombre de projets actifs
- Taux d'utilisation (depuis `v_consultant_utilization`)
- Liste des projets actifs avec pourcentage d'allocation
- Saisies de temps de la semaine en cours

#### Dashboard Project Owner
- Nombre de timesheets en attente de validation
- Liste des projets avec :
  - CA réalisé (timesheets validés)
  - Marge CJN (sans CJR confidentiel)
  - Progression vs budget

#### Dashboard Administrator
- Nombre de consultants actifs
- Taux moyen d'utilisation
- Nombre de projets actifs
- CA total réalisé
- Liste consultants avec taux d'utilisation
- Détection des conflits d'allocation (>100%)

#### Dashboard Directeur
- Toutes les stats admin
- Marges projet avec CJR (données confidentielles)
- Total marge CJN et CJR

---

### 2. Routes Layer (`dashboards.routes.ts`)

**Fichier** : `api/src/routes/dashboards.routes.ts` (222 lignes)

**Endpoints implémentés** :

| Méthode | Route | RBAC | Description |
|---------|-------|------|-------------|
| GET | `/dashboards/me` | requireAuth | Dashboard adapté au rôle de l'utilisateur |
| GET | `/dashboards/consultant/:userId` | requireOwner | Stats consultant spécifique (admin/directeur) |
| GET | `/dashboards/owner/:userId` | requireOwner | Stats project owner spécifique (admin/directeur) |
| GET | `/dashboards/admin` | requireOwner | Dashboard administrator |
| GET | `/dashboards/directeur` | requireDirecteur | Dashboard directeur avec CJR |
| GET | `/dashboards/capacity` | requireOwner | Vue capacité globale |

**Gestion des rôles dans `/me`** :
```typescript
switch (payload.role) {
  case 'consultant':
    data = await service.getConsultantStats(c.env.DB, payload.userId);
    break;
  case 'project_owner':
    data = await service.getProjectOwnerStats(c.env.DB, payload.userId);
    break;
  case 'administrator':
    data = await service.getAdminStats(c.env.DB);
    break;
  case 'directeur':
    data = await service.getDirecteurStats(c.env.DB);
    break;
}
```

---

### 3. Intégration (`index.ts`)

**Fichier modifié** : `api/src/index.ts`

**Changements** :
```typescript
// Import
import dashboardsRoutes from './routes/dashboards.routes';

// Version update
version: '0.7.0',
message: 'Staffing ESN API - CHANTIER_07 Dashboards',

// Route mounting
const dashboardsApp = app.basePath('/dashboards');
dashboardsApp.use('*', jwtMiddleware);
dashboardsApp.route('/', dashboardsRoutes);
```

---

## 🔐 Sécurité & RBAC

### Contrôles d'accès

1. **requireAuth** : Tous les endpoints dashboards (authentification JWT)
2. **requireOwner** : Admin/directeur/project_owner pour stats globales
3. **requireDirecteur** : Directeur uniquement pour données CJR

### Ségrégation des données

- **Consultants** : Uniquement leurs propres données
- **Project Owners** : Leurs projets + timesheets à valider
- **Administrators** : Stats globales sans CJR
- **Directeur** : Accès complet incluant marges CJR

### Confidentialité CJR

Les coûts réels (CJR) ne sont **jamais** exposés aux rôles non-directeur :
- Dashboard project owner : marge CJN uniquement
- Dashboard admin : pas de marges projet individuelles
- Dashboard directeur : vue complète CJN + CJR

---

## 📊 Requêtes SQL clés

### Détection des conflits d'allocation

```sql
SELECT
  c.id as consultant_id,
  u.nom as consultant_nom,
  u.prenom as consultant_prenom,
  i.date_debut_prevue as date_debut,
  i.date_fin_prevue as date_fin,
  SUM(i.pourcentage_allocation) as total_allocation
FROM interventions i
INNER JOIN consultants c ON i.consultant_id = c.id
INNER JOIN users u ON c.user_id = u.id
WHERE i.date_fin_reelle IS NULL
GROUP BY c.id, u.nom, u.prenom, i.date_debut_prevue, i.date_fin_prevue
HAVING total_allocation > 100
ORDER BY u.nom, u.prenom
```

### Calcul CA réalisé et marges

```sql
SELECT
  p.id,
  p.nom,
  p.client,
  p.montant_vendu,
  p.tjm_vente,
  p.statut,
  COALESCE(SUM(CASE WHEN t.statut = 'validated' THEN t.temps_saisi * p.tjm_vente ELSE 0 END), 0) as ca_realise,
  COALESCE(SUM(CASE WHEN t.statut = 'validated' THEN t.temps_saisi * (p.tjm_vente - i.tjm_achat_norme) ELSE 0 END), 0) as marge_cjn
FROM projects p
LEFT JOIN interventions i ON p.id = i.project_id
LEFT JOIN timesheets t ON i.id = t.intervention_id
WHERE p.owner_id = ?
  AND p.statut IN ('actif', 'planifie')
GROUP BY p.id, p.nom, p.client, p.montant_vendu, p.tjm_vente, p.statut
ORDER BY p.nom
```

---

## 🧪 Tests recommandés

### Tests unitaires (Service)

```typescript
describe('DashboardsService', () => {
  describe('getConsultantStats', () => {
    it('should return stats for consultant', async () => {
      const stats = await service.getConsultantStats(db, userId);
      expect(stats).toHaveProperty('jours_mois');
      expect(stats).toHaveProperty('nb_projets');
      expect(stats).toHaveProperty('taux_util');
      expect(stats).toHaveProperty('projets');
      expect(stats).toHaveProperty('semaine');
    });

    it('should throw error if consultant not found', async () => {
      await expect(
        service.getConsultantStats(db, 'invalid-user-id')
      ).rejects.toThrow('Profil consultant non trouvé');
    });
  });

  describe('getProjectOwnerStats', () => {
    it('should return pending timesheets count', async () => {
      const stats = await service.getProjectOwnerStats(db, userId);
      expect(stats).toHaveProperty('pending_count');
      expect(stats.pending_count).toBeGreaterThanOrEqual(0);
    });

    it('should return projects with CJN margins only', async () => {
      const stats = await service.getProjectOwnerStats(db, userId);
      expect(stats.projects[0]).toHaveProperty('marge_cjn');
      expect(stats.projects[0]).not.toHaveProperty('marge_cjr');
    });
  });

  describe('getAdminStats', () => {
    it('should return global capacity stats', async () => {
      const stats = await service.getAdminStats(db);
      expect(stats).toHaveProperty('total_consultants');
      expect(stats).toHaveProperty('taux_moyen');
      expect(stats).toHaveProperty('nb_projets');
      expect(stats).toHaveProperty('ca_total');
      expect(stats).toHaveProperty('consultants');
      expect(stats).toHaveProperty('conflits');
    });

    it('should detect allocation conflicts', async () => {
      const stats = await service.getAdminStats(db);
      const conflict = stats.conflits.find(c => c.total_allocation > 100);
      expect(conflict).toBeDefined();
    });
  });

  describe('getDirecteurStats', () => {
    it('should include CJR margins', async () => {
      const stats = await service.getDirecteurStats(db);
      expect(stats).toHaveProperty('project_margins');
      expect(stats).toHaveProperty('total_marge_cjn');
      expect(stats).toHaveProperty('total_marge_cjr');
    });
  });

  describe('getWeekStart/getWeekEnd', () => {
    it('should calculate week boundaries (Monday-Sunday)', () => {
      const date = new Date('2025-10-05'); // Saturday
      const weekStart = service['getWeekStart'](date);
      const weekEnd = service['getWeekEnd'](date);
      expect(weekStart).toBe('2025-09-29'); // Previous Monday
      expect(weekEnd).toBe('2025-10-05'); // Current Sunday
    });
  });
});
```

### Tests d'intégration (Routes)

```typescript
describe('Dashboards Routes', () => {
  describe('GET /dashboards/me', () => {
    it('should return consultant stats for consultant role', async () => {
      const res = await request(app)
        .get('/dashboards/me')
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe('consultant');
      expect(res.body.data).toHaveProperty('jours_mois');
    });

    it('should return project owner stats for project_owner role', async () => {
      const res = await request(app)
        .get('/dashboards/me')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('project_owner');
      expect(res.body.data).toHaveProperty('pending_count');
    });

    it('should return admin stats for administrator role', async () => {
      const res = await request(app)
        .get('/dashboards/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('administrator');
      expect(res.body.data).toHaveProperty('total_consultants');
    });

    it('should return directeur stats for directeur role', async () => {
      const res = await request(app)
        .get('/dashboards/me')
        .set('Authorization', `Bearer ${directeurToken}`);

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('directeur');
      expect(res.body.data).toHaveProperty('total_marge_cjr');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/dashboards/me');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /dashboards/directeur', () => {
    it('should allow directeur access', async () => {
      const res = await request(app)
        .get('/dashboards/directeur')
        .set('Authorization', `Bearer ${directeurToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total_marge_cjr');
    });

    it('should reject non-directeur users', async () => {
      const res = await request(app)
        .get('/dashboards/directeur')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /dashboards/capacity', () => {
    it('should return capacity overview for admin', async () => {
      const res = await request(app)
        .get('/dashboards/capacity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total_consultants');
      expect(res.body.data).toHaveProperty('conflits');
    });

    it('should reject consultant access', async () => {
      const res = await request(app)
        .get('/dashboards/capacity')
        .set('Authorization', `Bearer ${consultantToken}`);

      expect(res.status).toBe(403);
    });
  });
});
```

---

## 🎨 Format des réponses

### Consultant Dashboard (`GET /dashboards/me`)

```json
{
  "success": true,
  "role": "consultant",
  "data": {
    "jours_mois": 12.5,
    "nb_projets": 2,
    "taux_util": 75,
    "projets": [
      {
        "id": "proj_001",
        "nom": "Projet Alpha",
        "client": "Client A",
        "pourcentage_allocation": 50
      }
    ],
    "semaine": [
      {
        "date": "2025-10-01",
        "temps_saisi": 1.0,
        "periode": "journee",
        "statut": "validated",
        "project_nom": "Projet Alpha",
        "client": "Client A"
      }
    ]
  }
}
```

### Project Owner Dashboard

```json
{
  "success": true,
  "role": "project_owner",
  "data": {
    "pending_count": 5,
    "projects": [
      {
        "id": "proj_001",
        "nom": "Projet Alpha",
        "client": "Client A",
        "montant_vendu": 100000,
        "tjm_vente": 500,
        "statut": "actif",
        "ca_realise": 45000,
        "marge_cjn": 12000
      }
    ]
  }
}
```

### Admin Dashboard

```json
{
  "success": true,
  "role": "administrator",
  "data": {
    "total_consultants": 25,
    "taux_moyen": 68,
    "nb_projets": 12,
    "ca_total": 1250000,
    "consultants": [
      {
        "id": "cons_001",
        "nom": "Dupont",
        "prenom": "Jean",
        "taux_util": 85
      }
    ],
    "conflits": [
      {
        "consultant_id": "cons_002",
        "consultant_nom": "Martin",
        "consultant_prenom": "Sophie",
        "date_debut": "2025-10-01",
        "date_fin": "2025-12-31",
        "total_allocation": 150
      }
    ]
  }
}
```

### Directeur Dashboard

```json
{
  "success": true,
  "role": "directeur",
  "data": {
    "total_consultants": 25,
    "taux_moyen": 68,
    "nb_projets": 12,
    "ca_total": 1250000,
    "consultants": [...],
    "conflits": [...],
    "project_margins": [
      {
        "project_id": "proj_001",
        "project_nom": "Projet Alpha",
        "client": "Client A",
        "marge_cjn": 25000,
        "marge_cjr": 18500,
        "ca_realise": 95000,
        "montant_vendu": 100000
      }
    ],
    "total_marge_cjn": 125000,
    "total_marge_cjr": 87500
  }
}
```

---

## 🚀 Utilisation

### Requêtes cURL

```bash
# Dashboard personnel (adapté au rôle)
curl -X GET http://localhost:8787/dashboards/me \
  -H "Authorization: Bearer $JWT_TOKEN"

# Stats consultant spécifique (admin/directeur)
curl -X GET http://localhost:8787/dashboards/consultant/usr_001 \
  -H "Authorization: Bearer $JWT_ADMIN_TOKEN"

# Dashboard directeur avec CJR
curl -X GET http://localhost:8787/dashboards/directeur \
  -H "Authorization: Bearer $JWT_DIRECTEUR_TOKEN"

# Vue capacité globale
curl -X GET http://localhost:8787/dashboards/capacity \
  -H "Authorization: Bearer $JWT_ADMIN_TOKEN"
```

---

## 📝 Notes techniques

### Calcul des semaines

- Semaine = Lundi (jour 1) → Dimanche (jour 0)
- `getWeekStart()` : Recule au lundi précédent
- `getWeekEnd()` : Avance au dimanche suivant
- Format de date : ISO 8601 (`YYYY-MM-DD`)

### Utilisation des vues D1

- `v_consultant_utilization` : Taux d'utilisation pré-calculé
- `v_project_margins` : Marges CJN et CJR par projet

### Gestion des NULL

- `COALESCE()` pour valeurs par défaut (0)
- `|| 0` en TypeScript pour sécurité supplémentaire
- Tous les compteurs initialisés à 0

### Performance

- Requêtes optimisées avec `INNER JOIN`
- Filtres sur statuts et dates
- Groupements pour agrégations
- Aucune requête N+1

---

## ✅ Checklist de complétion

- [x] Service dashboards créé avec 4 méthodes principales
- [x] Routes dashboards avec 6 endpoints
- [x] RBAC appliqué (requireAuth, requireOwner, requireDirecteur)
- [x] Ségrégation données CJR/CJN
- [x] Détection conflits d'allocation
- [x] Calcul semaines (Monday-Sunday)
- [x] Intégration dans index.ts
- [x] Version API → 0.7.0
- [x] TypeScript strict mode (0 erreurs)
- [x] Documentation complète

---

## 🔄 Prochaines étapes (CHANTIER_08)

Le prochain chantier concernera probablement :
- **CHANTIER_08** : Dashboard Directeur étendu (si pas déjà inclus)
- Ou fonctionnalités complémentaires (exports, graphiques frontend, etc.)

---

## 📚 Références

- Spec : `chantiers/CHANTIER_07_dashboards.md`
- Service : `api/src/services/dashboards.service.ts`
- Routes : `api/src/routes/dashboards.routes.ts`
- Vues DB : `api/migrations/001_initial_schema.sql` (views)
- RBAC : `api/src/middlewares/rbac.middleware.ts`

---

**Handoff complet : CHANTIER_07 terminé avec succès** ✅
