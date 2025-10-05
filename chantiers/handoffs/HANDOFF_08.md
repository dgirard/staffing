# HANDOFF 08 : Dashboard Directeur (CJR/CJN)

**Date** : 2025-10-05
**Chantier** : CHANTIER_08
**Statut** : ✅ TERMINÉ
**Durée** : 3j (estimé)

---

## 🎯 Objectifs

Implémenter un système d'accès sécurisé aux données CJR (Coût Journalier Réel) avec audit trail complet :
- ✅ Dashboard Directeur avec accès CJR
- ✅ Comparaison marges CJN vs CJR
- ✅ Audit trail complet accès CJR
- ✅ Contrôle d'accès strict (directeur uniquement)

---

## 📦 Livrables

### 1. Database Migration (`003_audit_logs.sql`)

**Fichier** : `api/migrations/003_audit_logs.sql`

**Table créée** :
```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Index** :
- `idx_audit_logs_user` - Requêtes par utilisateur
- `idx_audit_logs_action` - Requêtes par type d'action
- `idx_audit_logs_resource` - Requêtes par ressource
- `idx_audit_logs_created` - Requêtes par date

**Actions auditées** :
- `VIEW_PROJECT_MARGIN_CJR` - Consultation marge CJR projet spécifique
- `VIEW_CONSULTANT_CJR` - Consultation CJR consultant
- `VIEW_INTERVENTION_CJR` - Consultation CJR intervention
- `VIEW_ALL_MARGINS_CJR` - Consultation toutes marges CJR
- `EXPORT_CJR_DATA` - Export données CJR

---

### 2. Audit Service (`audit.service.ts`)

**Fichier** : `api/src/services/audit.service.ts` (165 lignes)

**Méthodes implémentées** :
- `log(db, userId, action, resourceType, resourceId, metadata)` - Enregistrer un événement
- `getByUser(db, userId, limit)` - Logs d'un utilisateur
- `getByResource(db, resourceType, resourceId, limit)` - Logs d'une ressource
- `getAll(db, limit)` - Tous les logs (admin/directeur)
- `getStats(db, startDate, endDate)` - Statistiques d'audit

**Format métadonnées** :
```typescript
{
  timestamp: "2025-10-05T14:30:00.000Z",
  ip: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  action_detail: "CJN_CJR_COMPARISON" // optionnel
}
```

**Fonctionnalités** :
- Enregistrement automatique avec horodatage
- Support métadonnées JSON
- Recherche par utilisateur, ressource, action
- Statistiques agrégées
- Limite configurable

---

### 3. Margins Service (`margins.service.ts`)

**Fichier** : `api/src/services/margins.service.ts` (257 lignes)

**Méthodes implémentées** :
- `getProjectMargins(db, projectId, userId, userRole, useRealCost, metadata)` - Marges projet
- `getAllMargins(db, userId, userRole, useRealCost, metadata)` - Toutes les marges
- `compareMargins(db, userId, userRole, projectId, metadata)` - Comparaison CJN/CJR
- `getConsultantCJR(db, consultantId, userId, userRole, metadata)` - CJR consultant

**Contrôle d'accès CJR** :

Chaque méthode vérifie :
1. **Autorisation** : `userRole === 'directeur'`
2. **Audit** : Log automatique via `AuditService`
3. **Requête SQL** : Sélection dynamique CJN ou CJR

```typescript
if (useRealCost) {
  if (userRole !== 'directeur') {
    throw new Error('CJR access requires directeur role');
  }

  await this.auditService.log(
    db,
    userId,
    'VIEW_PROJECT_MARGIN_CJR',
    'projects',
    projectId,
    { timestamp: new Date().toISOString(), ...metadata }
  );
}
```

**Sélection SQL dynamique** :
```typescript
const marginField = useRealCost ? 'marge_cjr' : 'marge_cjn';
const costField = useRealCost ? 'cout_cjr' : 'cout_cjn';
```

**Comparaison CJN/CJR** :

Retourne pour chaque projet :
- CA réalisé
- Coût CJN et CJR
- Marge CJN et CJR
- Économie = CJN - CJR
- Marge % CJN et CJR

Totaux globaux :
- Total CA
- Total coûts (CJN et CJR)
- Total marges (CJN et CJR)
- Économies totales
- Marges % globales

---

### 4. Margins Routes (`margins.routes.ts`)

**Fichier** : `api/src/routes/margins.routes.ts` (238 lignes)

**Endpoints implémentés** :

| Méthode | Route | RBAC | Description |
|---------|-------|------|-------------|
| GET | `/margins` | requireOwner | Toutes marges (CJN par défaut, CJR avec `?real=true`) |
| GET | `/margins/project/:projectId` | requireOwner | Marges projet spécifique (CJN/CJR) |
| GET | `/margins/compare` | requireDirecteur | Comparaison CJN vs CJR |
| GET | `/margins/consultant/:consultantId/cjr` | requireDirecteur | CJR consultant |

**Query parameters** :
- `real=true` - Activer accès CJR (directeur uniquement)
- `project_id=xxx` - Filtrer comparaison sur un projet

**Métadonnées auditées** :
- IP : `x-forwarded-for` ou `cf-connecting-ip`
- User-Agent : Header HTTP
- Timestamp : ISO 8601

**Warning en réponse** :
```json
{
  "success": true,
  "data": {...},
  "warning": "CJR access logged for audit"
}
```

---

### 5. Audit Routes (`audit.routes.ts`)

**Fichier** : `api/src/routes/audit.routes.ts` (151 lignes)

**Endpoints implémentés** :

| Méthode | Route | RBAC | Description |
|---------|-------|------|-------------|
| GET | `/audit/me` | requireAuth | Mes logs audit |
| GET | `/audit/all` | requireDirecteur | Tous les logs |
| GET | `/audit/user/:userId` | requireDirecteur | Logs utilisateur spécifique |
| GET | `/audit/resource/:resourceType/:resourceId` | requireDirecteur | Logs ressource |
| GET | `/audit/stats` | requireDirecteur | Statistiques audit |

**Query parameters** :
- `limit=100` - Limite résultats (défaut: 100)
- `start_date=YYYY-MM-DD` - Date début (stats uniquement)
- `end_date=YYYY-MM-DD` - Date fin (stats uniquement)

**Exemple stats** :
```json
{
  "success": true,
  "data": [
    {
      "action": "VIEW_ALL_MARGINS_CJR",
      "count": 45,
      "unique_users": 3
    },
    {
      "action": "VIEW_PROJECT_MARGIN_CJR",
      "count": 128,
      "unique_users": 2
    }
  ]
}
```

---

### 6. Intégration (`index.ts`)

**Fichier modifié** : `api/src/index.ts`

**Changements** :
```typescript
// Imports
import marginsRoutes from './routes/margins.routes';
import auditRoutes from './routes/audit.routes';

// Version update
version: '0.8.0',
message: 'Staffing ESN API - CHANTIER_08 Dashboard Directeur',

// Routes mounting
const marginsApp = app.basePath('/margins');
marginsApp.use('*', jwtMiddleware);
marginsApp.route('/', marginsRoutes);

const auditApp = app.basePath('/audit');
auditApp.use('*', jwtMiddleware);
auditApp.route('/', auditRoutes);
```

---

## 🔐 Sécurité & RBAC

### Contrôle d'accès CJR

**Triple protection** :
1. **Middleware RBAC** : `requireDirecteur` sur routes CJR
2. **Service Layer** : Vérification rôle avant requête SQL
3. **Audit automatique** : Log obligatoire avant accès données

**Flux d'accès CJR** :
```
User Request (?real=true)
    ↓
requireOwner/requireDirecteur middleware
    ↓
Service: if (useRealCost && role !== 'directeur') → 403
    ↓
AuditService.log() → INSERT audit_logs
    ↓
SELECT ... marge_cjr, cout_cjr
    ↓
Response + warning
```

### Confidentialité données

**CJN (Public)** :
- Accessible : project_owner, administrator, directeur
- Vue : `v_project_margins.cout_cjn`, `marge_cjn`
- Audit : Non requis

**CJR (Confidentiel)** :
- Accessible : directeur uniquement
- Vue : `v_project_margins.cout_cjr`, `marge_cjr`
- Audit : **Obligatoire**

**Erreurs d'accès** :
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "CJR access requires directeur role"
}
```

---

## 📊 Format des réponses

### GET /margins?real=false (CJN)

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "project_id": "proj_001",
        "project_nom": "Projet Alpha",
        "client": "Client A",
        "ca_realise": 95000,
        "montant_vendu": 100000,
        "cout": 70000,
        "marge": 25000
      }
    ],
    "cost_type": "CJN"
  }
}
```

### GET /margins?real=true (CJR - Directeur)

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "project_id": "proj_001",
        "project_nom": "Projet Alpha",
        "client": "Client A",
        "ca_realise": 95000,
        "montant_vendu": 100000,
        "cout": 76500,
        "marge": 18500
      }
    ],
    "cost_type": "CJR"
  },
  "warning": "CJR access logged for audit"
}
```

### GET /margins/compare (Directeur)

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "project_id": "proj_001",
        "project_nom": "Projet Alpha",
        "client": "Client A",
        "ca_realise": 95000,
        "montant_vendu": 100000,
        "cout_cjn": 70000,
        "cout_cjr": 76500,
        "marge_cjn": 25000,
        "marge_cjr": 18500,
        "economie": -6500,
        "marge_cjn_pct": 26.32,
        "marge_cjr_pct": 19.47
      }
    ],
    "totals": {
      "ca_realise": 1250000,
      "cout_cjn": 900000,
      "cout_cjr": 950000,
      "marge_cjn": 350000,
      "marge_cjr": 300000,
      "economie": -50000,
      "marge_cjn_pct": 28.0,
      "marge_cjr_pct": 24.0
    }
  },
  "warning": "CJR comparison access logged for audit"
}
```

### GET /audit/me

```json
{
  "success": true,
  "data": [
    {
      "id": "aud_1234567890_abc123",
      "user_id": "usr_001",
      "action": "VIEW_ALL_MARGINS_CJR",
      "resource_type": "projects",
      "resource_id": "*",
      "metadata": "{\"timestamp\":\"2025-10-05T14:30:00.000Z\",\"ip\":\"192.168.1.1\"}",
      "created_at": "2025-10-05 14:30:00",
      "nom": "Dupont",
      "prenom": "Marie",
      "email": "marie.dupont@example.com"
    }
  ]
}
```

### GET /audit/stats

```json
{
  "success": true,
  "data": [
    {
      "action": "VIEW_ALL_MARGINS_CJR",
      "count": 45,
      "unique_users": 3
    },
    {
      "action": "VIEW_PROJECT_MARGIN_CJR",
      "count": 128,
      "unique_users": 2
    },
    {
      "action": "VIEW_CONSULTANT_CJR",
      "count": 67,
      "unique_users": 2
    }
  ]
}
```

---

## 🧪 Tests recommandés

### Tests sécurité (Service)

```typescript
describe('MarginsService - CJR Access Control', () => {
  it('should deny CJR access for non-directeur', async () => {
    await expect(
      service.getAllMargins(db, userId, 'administrator', true)
    ).rejects.toThrow('CJR access requires directeur role');
  });

  it('should allow CJN access for administrator', async () => {
    const result = await service.getAllMargins(db, userId, 'administrator', false);
    expect(result.cost_type).toBe('CJN');
  });

  it('should allow CJR access for directeur', async () => {
    const result = await service.getAllMargins(db, userId, 'directeur', true);
    expect(result.cost_type).toBe('CJR');
  });

  it('should log audit when directeur accesses CJR', async () => {
    const auditSpy = jest.spyOn(auditService, 'log');
    await service.getAllMargins(db, userId, 'directeur', true);

    expect(auditSpy).toHaveBeenCalledWith(
      db,
      userId,
      'VIEW_ALL_MARGINS_CJR',
      'projects',
      '*',
      expect.any(Object)
    );
  });

  it('should NOT log audit when accessing CJN', async () => {
    const auditSpy = jest.spyOn(auditService, 'log');
    await service.getAllMargins(db, userId, 'directeur', false);

    expect(auditSpy).not.toHaveBeenCalled();
  });
});

describe('MarginsService - compareMargins', () => {
  it('should calculate CJN/CJR differences', async () => {
    const result = await service.compareMargins(db, userId, 'directeur');

    expect(result.projects[0]).toHaveProperty('economie');
    expect(result.projects[0].economie).toBe(
      result.projects[0].cout_cjn - result.projects[0].cout_cjr
    );
  });

  it('should calculate margin percentages', async () => {
    const result = await service.compareMargins(db, userId, 'directeur');
    const project = result.projects[0];

    expect(project.marge_cjn_pct).toBeCloseTo(
      (project.marge_cjn / project.ca_realise) * 100,
      2
    );
  });

  it('should aggregate totals correctly', async () => {
    const result = await service.compareMargins(db, userId, 'directeur');

    const expectedCaTotal = result.projects.reduce((sum, p) => sum + p.ca_realise, 0);
    expect(result.totals.ca_realise).toBe(expectedCaTotal);
  });
});
```

### Tests d'intégration (Routes)

```typescript
describe('Margins Routes - Access Control', () => {
  it('should deny CJR access without token', async () => {
    const res = await request(app).get('/margins?real=true');
    expect(res.status).toBe(401);
  });

  it('should deny CJR access for consultant', async () => {
    const res = await request(app)
      .get('/margins?real=true')
      .set('Authorization', `Bearer ${consultantToken}`);
    expect(res.status).toBe(403);
  });

  it('should deny CJR access for project_owner', async () => {
    const res = await request(app)
      .get('/margins?real=true')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(res.status).toBe(403);
  });

  it('should deny CJR access for administrator', async () => {
    const res = await request(app)
      .get('/margins?real=true')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('should allow CJR access for directeur', async () => {
    const res = await request(app)
      .get('/margins?real=true')
      .set('Authorization', `Bearer ${directeurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cost_type).toBe('CJR');
    expect(res.body.warning).toBe('CJR access logged for audit');
  });

  it('should allow CJN access for administrator', async () => {
    const res = await request(app)
      .get('/margins?real=false')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cost_type).toBe('CJN');
    expect(res.body.warning).toBeUndefined();
  });
});

describe('Margins Routes - Compare', () => {
  it('should deny compare access for non-directeur', async () => {
    const res = await request(app)
      .get('/margins/compare')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('should return CJN/CJR comparison for directeur', async () => {
    const res = await request(app)
      .get('/margins/compare')
      .set('Authorization', `Bearer ${directeurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.projects[0]).toHaveProperty('economie');
    expect(res.body.data.totals).toHaveProperty('marge_cjn_pct');
  });
});

describe('Audit Routes', () => {
  it('should allow user to see their own logs', async () => {
    const res = await request(app)
      .get('/audit/me')
      .set('Authorization', `Bearer ${directeurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should deny all logs access for non-directeur', async () => {
    const res = await request(app)
      .get('/audit/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('should return audit stats for directeur', async () => {
    const res = await request(app)
      .get('/audit/stats')
      .set('Authorization', `Bearer ${directeurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toHaveProperty('action');
    expect(res.body.data[0]).toHaveProperty('count');
    expect(res.body.data[0]).toHaveProperty('unique_users');
  });
});
```

### Tests audit (AuditService)

```typescript
describe('AuditService', () => {
  it('should log audit event', async () => {
    const auditId = await service.log(
      db,
      userId,
      'VIEW_PROJECT_MARGIN_CJR',
      'projects',
      'proj_001',
      { ip: '192.168.1.1' }
    );

    expect(auditId).toMatch(/^aud_/);
  });

  it('should retrieve user audit logs', async () => {
    const logs = await service.getByUser(db, userId);
    expect(logs).toBeInstanceOf(Array);
  });

  it('should retrieve resource audit logs', async () => {
    const logs = await service.getByResource(db, 'projects', 'proj_001');
    expect(logs).toBeInstanceOf(Array);
  });

  it('should calculate audit stats', async () => {
    const stats = await service.getStats(db, '2025-10-01', '2025-10-31');
    expect(stats[0]).toHaveProperty('action');
    expect(stats[0]).toHaveProperty('count');
  });
});
```

---

## 🚀 Utilisation

### Requêtes cURL

```bash
# Marges CJN (admin/directeur)
curl -X GET http://localhost:8787/margins \
  -H "Authorization: Bearer $JWT_ADMIN_TOKEN"

# Marges CJR (directeur uniquement)
curl -X GET "http://localhost:8787/margins?real=true" \
  -H "Authorization: Bearer $JWT_DIRECTEUR_TOKEN"

# Marge projet spécifique avec CJR
curl -X GET "http://localhost:8787/margins/project/proj_001?real=true" \
  -H "Authorization: Bearer $JWT_DIRECTEUR_TOKEN"

# Comparaison CJN vs CJR
curl -X GET http://localhost:8787/margins/compare \
  -H "Authorization: Bearer $JWT_DIRECTEUR_TOKEN"

# Comparaison pour un projet
curl -X GET "http://localhost:8787/margins/compare?project_id=proj_001" \
  -H "Authorization: Bearer $JWT_DIRECTEUR_TOKEN"

# CJR consultant
curl -X GET http://localhost:8787/margins/consultant/cons_001/cjr \
  -H "Authorization: Bearer $JWT_DIRECTEUR_TOKEN"

# Mes logs audit
curl -X GET http://localhost:8787/audit/me \
  -H "Authorization: Bearer $JWT_TOKEN"

# Tous les logs (directeur)
curl -X GET "http://localhost:8787/audit/all?limit=50" \
  -H "Authorization: Bearer $JWT_DIRECTEUR_TOKEN"

# Stats audit
curl -X GET "http://localhost:8787/audit/stats?start_date=2025-10-01&end_date=2025-10-31" \
  -H "Authorization: Bearer $JWT_DIRECTEUR_TOKEN"
```

---

## 📝 Notes techniques

### Différence CJN vs CJR

**CJN (Coût Journalier Normé)** :
- Coût moyen/normalisé utilisé pour budgétisation
- Visible par project_owner, administrator, directeur
- Utilisé pour estimations et budgets prévisionnels

**CJR (Coût Journalier Réel)** :
- Coût réel payé au consultant
- **Confidentiel** - directeur uniquement
- Utilisé pour calculs de marge réelle

**Économie** :
- Économie = CJN - CJR
- Économie > 0 : Coût réel < Coût normé (bon)
- Économie < 0 : Coût réel > Coût normé (surcoût)

### Métadonnées audit

IP capture :
1. `x-forwarded-for` (proxy/CDN)
2. `cf-connecting-ip` (Cloudflare)
3. Fallback : `"unknown"`

### Performance

- Index sur `audit_logs.created_at` pour tri DESC
- Limite par défaut 100 résultats
- Statistiques agrégées avec GROUP BY

### Conformité

- **RGPD** : Logs audit traçables
- **ISO 27001** : Contrôle accès données sensibles
- **SOC 2** : Audit trail complet
- **Immutabilité** : Logs non modifiables (INSERT only)

---

## ✅ Checklist de complétion

- [x] Migration audit_logs créée
- [x] AuditService avec 5 méthodes
- [x] MarginsService avec contrôle CJR
- [x] Routes margins avec 4 endpoints
- [x] Routes audit avec 5 endpoints
- [x] RBAC strict (requireDirecteur)
- [x] Audit automatique accès CJR
- [x] Métadonnées IP + User-Agent
- [x] Comparaison CJN/CJR avec totaux
- [x] Intégration index.ts
- [x] Version API → 0.8.0
- [x] TypeScript strict mode (0 erreurs)
- [x] Documentation complète

---

## 🔄 Prochaines étapes (CHANTIER_09)

Le prochain chantier concernera :
- **CHANTIER_09** : Chat IA Gemini
- Ou autres fonctionnalités avancées (exports, notifications, etc.)

---

## 📚 Références

- Spec : `chantiers/CHANTIER_08_directeur.md`
- Migration : `api/migrations/003_audit_logs.sql`
- Audit Service : `api/src/services/audit.service.ts`
- Margins Service : `api/src/services/margins.service.ts`
- Routes Margins : `api/src/routes/margins.routes.ts`
- Routes Audit : `api/src/routes/audit.routes.ts`
- RBAC : `api/src/middlewares/rbac.middleware.ts`

---

**Handoff complet : CHANTIER_08 terminé avec succès** ✅
