# CHANTIER 05 : Saisie Timesheet Demi-Journée

> **Durée** : 4j | **Dépend de** : 04 | **Suivant** : 06 | **Coverage** : 90%+

## 🎯 Objectifs

✅ Saisie temps web (React)
✅ Saisie temps mobile (PWA)
✅ Validation 0.5j/1j, max 1j/jour
✅ 25+ tests + E2E

## ✅ Tâches Clés

### Backend - Validation

```typescript
function validateTimeEntry(date: string, entries: TimeEntry[]) {
  // Max 2 saisies/jour (matin + aprem OU journée seule)
  if (entries.length > 2) return { valid: false, error: 'Max 2 saisies/jour' };

  // Pas de doublon période
  const periodes = entries.map(e => e.periode);
  if (new Set(periodes).size !== periodes.length) {
    return { valid: false, error: 'Période déjà saisie' };
  }

  // Max 1 jour total
  const total = entries.reduce((sum, e) => sum + e.jours, 0);
  if (total > 1.0) return { valid: false, error: 'Max 1 jour' };

  // Si "journee", pas d'autre saisie
  if (entries.some(e => e.periode === 'journee') && entries.length > 1) {
    return { valid: false, error: 'Journée complète = saisie unique' };
  }

  return { valid: true };
}
```

### Frontend - Composant Saisie

```tsx
function TimesheetEntry() {
  const [selectedPeriode, setSelectedPeriode] = useState<'matin' | 'apres_midi' | 'journee'>();

  return (
    <div className="card">
      <h2>Saisie du {format(date, 'dd/MM/yyyy')}</h2>

      <select name="project" className="input">
        {projets.map(p => <option value={p.id}>{p.nom}</option>)}
      </select>

      <div className="flex gap-3 mt-4">
        <button
          className={selectedPeriode === 'matin' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setSelectedPeriode('matin')}
        >
          ☀️ Matin (0.5j)
        </button>
        <button
          className={selectedPeriode === 'apres_midi' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setSelectedPeriode('apres_midi')}
        >
          🌙 Après-midi (0.5j)
        </button>
        <button
          className={selectedPeriode === 'journee' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setSelectedPeriode('journee')}
        >
          📅 Journée (1j)
        </button>
      </div>

      <button className="btn-primary mt-6" onClick={handleSubmit}>
        Soumettre
      </button>
    </div>
  );
}
```

### Tests E2E

```typescript
test('consultant can submit timesheet', async ({ page }) => {
  await page.goto('/timesheet');
  await page.selectOption('[name="project"]', 'Alpha');
  await page.click('button:has-text("Matin")');
  await page.click('button:has-text("Soumettre")');

  await expect(page.locator('.toast-success')).toContainText('0.5 jour saisi');
});
```

## 📤 Livrables

- API timesheet avec validation stricte
- Composant React saisie demi-journée
- PWA offline-capable
- 25+ tests + E2E

---

_Chantier 05 : Timesheet_
