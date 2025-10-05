# CHANTIER 07 : Dashboards Standard

> **Durée** : 4j | **Dépend de** : 06 | **Suivant** : 08 | **Coverage** : 80%+

## 🎯 Objectifs

✅ Dashboard Consultant (mes projets, mon temps)
✅ Dashboard Project Owner (validation, budgets)
✅ Dashboard Administrator (capacité globale)
✅ Graphiques + KPIs temps réel

## ✅ Dashboards

### 1. Consultant Dashboard

```tsx
function ConsultantDashboard() {
  const stats = useQuery('/api/me/stats');

  return (<>
    <div className="grid grid-cols-3 gap-4">
      <StatCard title="Jours ce mois" value={stats.jours_mois} />
      <StatCard title="Projets actifs" value={stats.nb_projets} />
      <StatCard title="Utilisation" value={`${stats.taux_util}%`} />
    </div>

    <Card title="Mes projets">
      {stats.projets.map(p => (
        <ProjectRow key={p.id} {...p} />
      ))}
    </Card>

    <Card title="Temps saisi cette semaine">
      <WeekView entries={stats.semaine} />
    </Card>
  </>);
}
```

### 2. Project Owner Dashboard

```tsx
function OwnerDashboard() {
  const pending = useQuery('/api/timesheets/pending');
  const projects = useQuery('/api/my-projects');

  return (<>
    <Alert variant="info">
      {pending.length} timesheets en attente de validation
    </Alert>

    <Card title="Mes projets">
      {projects.map(p => (
        <div className="flex justify-between">
          <span>{p.nom}</span>
          <div>
            <span className="text-sm">Budget: {p.ca_realise}/{p.montant_vendu}€</span>
            <ProgressBar value={p.ca_realise / p.montant_vendu * 100} />
            <span className="text-sm">Marge (CJN): {p.marge_cjn}€</span>
          </div>
        </div>
      ))}
    </Card>
  </>);
}
```

### 3. Admin Dashboard

```tsx
function AdminDashboard() {
  const capacity = useQuery('/api/capacity');

  return (<>
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Consultants actifs" value={capacity.total_consultants} />
      <StatCard title="Taux moyen util." value={`${capacity.taux_moyen}%`} />
      <StatCard title="Projets actifs" value={capacity.nb_projets} />
      <StatCard title="CA réalisé" value={`${capacity.ca_total}€`} />
    </div>

    <Card title="Utilisation par consultant">
      <BarChart data={capacity.consultants.map(c => ({
        name: `${c.prenom} ${c.nom}`,
        utilisation: c.taux_util
      }))} />
    </Card>

    <Card title="Conflits détectés">
      {capacity.conflits.map(c => (
        <Alert variant="warning">
          {c.consultant_nom} : allocation > 100% du {c.date_debut} au {c.date_fin}
        </Alert>
      ))}
    </Card>
  </>);
}
```

## 📤 Livrables

- 3 dashboards (Consultant, Owner, Admin)
- KPIs temps réel
- Graphiques (recharts ou chart.js)
- 15+ tests composants

---

_Chantier 07 : Dashboards_
