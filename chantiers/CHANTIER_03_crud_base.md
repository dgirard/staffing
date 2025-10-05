# CHANTIER 03 : CRUD Consultants + Projets

> **Durée** : 3j | **Dépend de** : 02 | **Suivant** : 04 | **Coverage** : 85%+

## 🎯 Objectifs

✅ CRUD Consultants (avec CJN/CJN + RBAC + Audit)
✅ CRUD Projets (avec ownership)
✅ 30+ tests unitaires + intégration

## ✅ Tâches

### 1. Service Consultants

**`api/src/services/consultants.service.ts`**

```typescript
export class ConsultantsService {
  async create(data: CreateConsultantDTO, userId: string, userRole: string) {
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO consultants VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'actif')
    `).bind(id, data.nom, data.prenom, data.profil, data.cjn, data.cjr, data.date_embauche).run();

    // Audit si CJR
    if (userRole === 'directeur') {
      await auditLog(userId, 'CREATE_CONSULTANT', 'consultants', id);
    }

    return id;
  }

  async getById(id: string, userRole: string) {
    const sql = userRole === 'directeur'
      ? 'SELECT * FROM consultants WHERE consultant_id = ?'
      : 'SELECT consultant_id, nom, prenom, profil_seniority, cjn, statut FROM consultants WHERE consultant_id = ?';

    return await db.prepare(sql).bind(id).first();
  }

  async list(userRole: string) {
    const sql = userRole === 'directeur'
      ? 'SELECT * FROM consultants WHERE statut = ?'
      : 'SELECT consultant_id, nom, prenom, profil_seniority, cjn, statut FROM consultants WHERE statut = ?';

    return await db.prepare(sql).bind('actif').all();
  }
}
```

### 2. Routes Consultants

**`api/src/routes/consultants.routes.ts`**

```typescript
const consultants = new Hono();

consultants.get('/', requireAdmin, async (c) => {
  const { role } = c.get('jwtPayload');
  const list = await service.list(role);
  return c.json(list);
});

consultants.post('/', requireAdmin, async (c) => {
  const data = await c.req.json();
  const { userId, role } = c.get('jwtPayload');
  const id = await service.create(data, userId, role);
  return c.json({ consultant_id: id }, 201);
});
```

### 3. Tests

**`api/tests/unit/consultants.service.test.ts`** - 15 tests
**`api/tests/integration/consultants.api.test.ts`** - 10 tests

```typescript
describe('Consultants API', () => {
  it('should hide CJR for administrator', async () => {
    const res = await app.request('/api/consultants/123', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    expect(data.cjn).toBeDefined();
    expect(data.cjr).toBeUndefined();
  });

  it('should show CJR for directeur', async () => {
    const res = await app.request('/api/consultants/123', {
      headers: { Authorization: `Bearer ${directeurToken}` }
    });
    const data = await res.json();
    expect(data.cjr).toBeDefined();
  });
});
```

## 📤 Livrables

- `consultants.service.ts`, `consultants.routes.ts`
- `projects.service.ts`, `projects.routes.ts`
- 30+ tests (85% coverage)

## ✅ Validation

```bash
npm test
npm run test:coverage  # >= 85%
curl http://localhost:8787/api/consultants -H "Authorization: Bearer $TOKEN"
```

---

_Chantier 03 : CRUD Base_
