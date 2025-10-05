# CHANTIER 06 : Workflow Validation Timesheets

> **Durée** : 3j | **Dépend de** : 05 | **Suivant** : 07 | **Coverage** : 90%+

## 🎯 Objectifs

✅ Workflow états (draft → submitted → validated/rejected)
✅ Permissions validation (Owner/Admin/Directeur)
✅ Validation en masse
✅ 20+ tests

## ✅ Machine à États

```
draft → submitted → validated ✅
   ↓                    ↓
  [delete]          rejected → submitted (re-soumission)
```

### Service Validation

```typescript
async validateTimesheet(entryId: string, validatorId: string, validatorRole: string) {
  // Vérifier permissions
  const entry = await getTimeEntry(entryId);

  if (validatorRole === 'project_owner') {
    // Owner peut valider seulement ses projets
    const project = await getProject(entry.project_id);
    if (project.owner_id !== validatorId) {
      throw new Error('Not project owner');
    }
  }

  // Changer statut
  await db.prepare(`
    UPDATE time_entries
    SET statut = 'validated', validated_by = ?, validated_at = ?
    WHERE time_entry_id = ?
  `).bind(validatorId, Date.now(), entryId).run();

  return { success: true };
}

async validateBulk(entryIds: string[], validatorId: string, validatorRole: string) {
  const results = await Promise.all(
    entryIds.map(id => this.validateTimesheet(id, validatorId, validatorRole))
  );
  return results;
}
```

### Frontend - Vue Validation

```tsx
function ValidationView() {
  const [pendingEntries, setPendingEntries] = useState([]);

  return (
    <div className="card">
      <h2>Timesheets en attente</h2>

      {pendingEntries.map(entry => (
        <div key={entry.id} className="flex justify-between items-center p-4 border-b">
          <div>
            <p className="font-semibold">{entry.consultant_nom}</p>
            <p className="text-sm text-gray-600">
              {entry.project_nom} - {entry.jours}j - {format(entry.date)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={() => validate(entry.id)}
            >
              ✅ Valider
            </button>
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => reject(entry.id)}
            >
              ❌ Rejeter
            </button>
          </div>
        </div>
      ))}

      <button className="btn-primary mt-4" onClick={validateAll}>
        Tout valider
      </button>
    </div>
  );
}
```

### Tests

```typescript
it('owner can validate only his projects', async () => {
  const res = await app.request(`/api/timesheets/${entryId}/validate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });

  if (entry.project.owner_id === ownerId) {
    expect(res.status).toBe(200);
  } else {
    expect(res.status).toBe(403);
  }
});

it('admin can validate all projects', async () => {
  const res = await app.request(`/api/timesheets/${entryId}/validate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  expect(res.status).toBe(200);
});
```

## 📤 Livrables

- Workflow complet draft→validated
- RBAC validation
- Validation en masse
- Interface validation

---

_Chantier 06 : Validation_
