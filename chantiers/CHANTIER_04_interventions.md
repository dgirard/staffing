# CHANTIER 04 : Interventions (Allocations)

> **Durée** : 2j | **Dépend de** : 03 | **Suivant** : 05 | **Coverage** : 85%+

## 🎯 Objectifs

✅ CRUD Interventions (allocations consultants→projets)
✅ Détection conflits de dates
✅ Verrouillage TJ à l'allocation
✅ 20+ tests

## ✅ Tâches Clés

### Service Interventions

```typescript
async create(data: CreateInterventionDTO) {
  // Vérifier conflits (même consultant, dates qui se chevauchent)
  const conflicts = await db.prepare(`
    SELECT * FROM interventions
    WHERE consultant_id = ?
    AND statut = 'active'
    AND (
      (date_debut <= ? AND (date_fin IS NULL OR date_fin >= ?))
      OR (date_debut <= ? AND (date_fin IS NULL OR date_fin >= ?))
    )
  `).bind(data.consultant_id, data.date_fin, data.date_debut,
          data.date_debut, data.date_debut).all();

  if (conflicts.results.length > 0 && totalAllocation > 100) {
    throw new Error('Conflit d\'allocation');
  }

  // Verrouiller TJ
  const persona = await getPersona(data.persona_id);
  const intervention = {
    ...data,
    tj_verrouille: persona.tj_reference
  };

  return await insertIntervention(intervention);
}
```

### Tests

```typescript
it('should detect allocation conflicts', async () => {
  // Consultant déjà à 100% sur projet A
  await expect(
    service.create({ consultant_id: 'c1', allocation_pct: 50, /* dates overlap */ })
  ).rejects.toThrow('Conflit');
});

it('should lock TJ at allocation time', async () => {
  const intervention = await service.create({ persona_id: 'p1', /* ... */ });
  expect(intervention.tj_verrouille).toBe(500); // TJ persona au moment T
});
```

## 📤 Livrables

- `interventions.service.ts`, `interventions.routes.ts`
- Détection conflits + verrouillage TJ
- 20+ tests

---

_Chantier 04 : Interventions_
