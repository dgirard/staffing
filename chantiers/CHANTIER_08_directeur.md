# CHANTIER 08 : Dashboard Directeur (CJR/CJN)

> **Durée** : 3j | **Dépend de** : 07 | **Suivant** : 09 | **Coverage** : 90%+

## 🎯 Objectifs

✅ Dashboard Directeur avec accès CJR
✅ Comparaison marges CJN vs CJR
✅ Audit trail complet accès CJR
✅ 20+ tests sécurité

## ✅ Backend - CJR Access Control

```typescript
async getProjectMargins(projectId: string, userId: string, useRealCost: boolean) {
  // Audit si accès CJR
  if (useRealCost) {
    const user = await getUser(userId);
    if (user.role !== 'directeur') {
      throw new Error('CJR access requires directeur role');
    }

    await auditLog(userId, 'VIEW_PROJECT_MARGIN_CJR', 'projects', projectId, {
      timestamp: Date.now(),
      ip: request.ip
    });
  }

  const sql = `
    SELECT
      project_id, code_projet, nom_projet,
      ca_realise,
      ${useRealCost ? 'cout_cjr as cout, marge_cjr as marge' : 'cout_cjn as cout, marge_cjn as marge'}
    FROM v_project_margins
    WHERE project_id = ?
  `;

  return await db.prepare(sql).bind(projectId).first();
}
```

## Frontend - Dashboard Directeur

```tsx
function DirecteurDashboard() {
  const [showCJR, setShowCJR] = useState(false);
  const margins = useQuery(`/api/margins?real=${showCJR}`);

  return (<>
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Dashboard Directeur</h1>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showCJR}
          onChange={(e) => setShowCJR(e.target.checked)}
        />
        <span className="text-sm">Afficher coûts réels (CJR)</span>
        {showCJR && <LockIcon className="text-red-600" />}
      </label>
    </div>

    <table className="w-full">
      <thead>
        <tr>
          <th>Projet</th>
          <th>CA Réalisé</th>
          <th>Coût {showCJR ? 'Réel (CJR)' : 'Normé (CJN)'}</th>
          <th>Marge</th>
          <th>Marge %</th>
        </tr>
      </thead>
      <tbody>
        {margins.map(m => (
          <tr key={m.project_id}>
            <td>{m.nom_projet}</td>
            <td>{m.ca_realise}€</td>
            <td className={showCJR ? 'text-red-600 font-semibold' : ''}>
              {m.cout}€
            </td>
            <td className={m.marge < 0 ? 'text-red-600' : 'text-green-600'}>
              {m.marge}€
            </td>
            <td>{((m.marge / m.ca_realise) * 100).toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>

    <Card title="Écart CJN/CJR" className="mt-6">
      <p>Économies réalisées : {margins.economie_totale}€</p>
      <p className="text-sm text-gray-600">
        CJN global : {margins.cout_cjn_total}€ | CJR réel : {margins.cout_cjr_total}€
      </p>
    </Card>

    {showCJR && (
      <Alert variant="warning" className="mt-4">
        ⚠️ Accès données sensibles (CJR) - Audit enregistré
      </Alert>
    )}
  </>);
}
```

## Tests Sécurité

```typescript
describe('CJR Access Control', () => {
  it('should deny CJR access for non-directeur', async () => {
    const res = await app.request('/api/margins?real=true', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(res.status).toBe(403);
  });

  it('should log audit when directeur accesses CJR', async () => {
    await app.request('/api/margins?real=true', {
      headers: { Authorization: `Bearer ${directeurToken}` }
    });

    const audit = await getLastAuditLog();
    expect(audit.action).toBe('VIEW_PROJECT_MARGIN_CJR');
    expect(audit.user_id).toBe(directeurId);
  });

  it('should show CJR data only for directeur', async () => {
    const res = await app.request('/api/margins?real=true', {
      headers: { Authorization: `Bearer ${directeurToken}` }
    });
    const data = await res.json();
    expect(data.cout_cjr).toBeDefined();
  });
});
```

## 📤 Livrables

- Dashboard Directeur avec toggle CJN/CJR
- Audit trail complet
- Comparaison marges
- 20+ tests sécurité (90% coverage)

---

_Chantier 08 : Dashboard Directeur_
