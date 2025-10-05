# CHANTIER 02 : Database D1 - Schéma + Migrations + Seed

> **Durée estimée** : 2 jours
> **Dépendances** : CHANTIER_01 (Auth)
> **Chantier suivant** : CHANTIER_03_crud_base.md

---

## 📋 1. Contexte et objectifs

### Objectifs

✅ Créer schéma complet D1 (8 tables + vues)
✅ Migrations versionnées
✅ Seed data pour développement
✅ Tests contraintes et vues
✅ Coverage 85%+

---

## ✅ 2. Tâches

### Tâche 1 : Créer migrations

**Fichier** : `api/migrations/001_initial.sql`

```sql
-- USERS
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('consultant', 'project_owner', 'administrator', 'directeur')) NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_users_email ON users(email);

-- CONSULTANTS
CREATE TABLE consultants (
  consultant_id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(user_id),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  profil_seniority TEXT CHECK(profil_seniority IN ('junior', 'consultant', 'senior', 'manager', 'directeur')) NOT NULL,
  cjn REAL NOT NULL,
  cjr REAL NOT NULL,
  date_embauche TEXT,
  statut TEXT DEFAULT 'actif' CHECK(statut IN ('actif', 'inactif'))
);
CREATE INDEX idx_consultants_statut ON consultants(statut);
CREATE INDEX idx_consultants_user ON consultants(user_id);

-- PROJECTS
CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  code_projet TEXT UNIQUE NOT NULL,
  nom_projet TEXT NOT NULL,
  client TEXT,
  type_projet TEXT CHECK(type_projet IN ('regie', 'forfait')) NOT NULL,
  montant_vendu REAL,
  jours_vendus INTEGER,
  date_debut TEXT,
  date_fin TEXT,
  statut TEXT DEFAULT 'actif' CHECK(statut IN ('actif', 'termine', 'annule')),
  owner_id TEXT REFERENCES users(user_id)
);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_statut ON projects(statut);

-- PERSONAS
CREATE TABLE personas (
  persona_id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  libelle TEXT NOT NULL,
  tj_reference REAL NOT NULL
);

-- INTERVENTIONS
CREATE TABLE interventions (
  intervention_id TEXT PRIMARY KEY,
  consultant_id TEXT REFERENCES consultants(consultant_id),
  project_id TEXT REFERENCES projects(project_id),
  persona_id TEXT REFERENCES personas(persona_id),
  tj_verrouille REAL NOT NULL,
  allocation_pct INTEGER CHECK(allocation_pct >= 0 AND allocation_pct <= 100) NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  statut TEXT DEFAULT 'active' CHECK(statut IN ('active', 'terminee'))
);
CREATE INDEX idx_interventions_consultant ON interventions(consultant_id, statut);
CREATE INDEX idx_interventions_project ON interventions(project_id);

-- TIME_ENTRIES
CREATE TABLE time_entries (
  time_entry_id TEXT PRIMARY KEY,
  consultant_id TEXT REFERENCES consultants(consultant_id),
  intervention_id TEXT REFERENCES interventions(intervention_id),
  project_id TEXT REFERENCES projects(project_id),
  entry_date TEXT NOT NULL,
  periode TEXT CHECK(periode IN ('matin', 'apres_midi', 'journee')) NOT NULL,
  jours REAL CHECK(jours IN (0.5, 1.0)) NOT NULL,
  statut TEXT CHECK(statut IN ('draft', 'submitted', 'validated', 'rejected')) DEFAULT 'draft',
  validated_by TEXT REFERENCES users(user_id),
  validated_at INTEGER,
  commentaire TEXT,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_time_entries_unique ON time_entries(consultant_id, intervention_id, entry_date, periode);
CREATE INDEX idx_time_entries_consultant_date ON time_entries(consultant_id, entry_date DESC);
CREATE INDEX idx_time_entries_statut ON time_entries(statut);

-- AUDIT_LOGS
CREATE TABLE audit_logs (
  audit_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- CHAT_HISTORY
CREATE TABLE chat_history (
  chat_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  messages TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_chat_user_date ON chat_history(user_id, created_at DESC);

-- VUES CALCULÉES
CREATE VIEW v_consultant_utilization AS
SELECT
  c.consultant_id,
  c.nom,
  c.prenom,
  c.profil_seniority,
  c.cjn,
  COUNT(DISTINCT i.intervention_id) as nb_projets_actifs,
  COALESCE(SUM(CASE WHEN te.statut = 'validated' THEN te.jours ELSE 0 END), 0) as jours_valides_30j,
  ROUND(COALESCE(SUM(CASE WHEN te.statut = 'validated' THEN te.jours ELSE 0 END), 0) * 100.0 / 21, 1) as taux_utilisation_30j
FROM consultants c
LEFT JOIN interventions i ON c.consultant_id = i.consultant_id AND i.statut = 'active'
LEFT JOIN time_entries te ON i.intervention_id = te.intervention_id
  AND te.entry_date >= date('now', '-30 days')
GROUP BY c.consultant_id;

CREATE VIEW v_project_margins AS
SELECT
  p.project_id,
  p.code_projet,
  p.nom_projet,
  p.montant_vendu,
  p.jours_vendus,
  COALESCE(SUM(te.jours * i.tj_verrouille), 0) as ca_realise,
  COALESCE(SUM(te.jours * c.cjn), 0) as cout_cjn,
  COALESCE(SUM(te.jours * c.cjr), 0) as cout_cjr,
  p.montant_vendu - COALESCE(SUM(te.jours * c.cjn), 0) as marge_cjn,
  p.montant_vendu - COALESCE(SUM(te.jours * c.cjr), 0) as marge_cjr
FROM projects p
LEFT JOIN interventions i ON p.project_id = i.project_id
LEFT JOIN time_entries te ON i.intervention_id = te.intervention_id AND te.statut = 'validated'
LEFT JOIN consultants c ON i.consultant_id = c.consultant_id
GROUP BY p.project_id;
```

### Tâche 2 : Seed data

**Fichier** : `api/migrations/002_seed.sql`

```sql
-- Users (hash = bcrypt de 'Test1234!')
INSERT INTO users VALUES
  ('user-1', 'consultant@test.com', '$2a$10$hash1', 'consultant', 1704067200),
  ('user-2', 'owner@test.com', '$2a$10$hash2', 'project_owner', 1704067200),
  ('user-3', 'admin@test.com', '$2a$10$hash3', 'administrator', 1704067200),
  ('user-4', 'directeur@test.com', '$2a$10$hash4', 'directeur', 1704067200);

-- Consultants
INSERT INTO consultants VALUES
  ('cons-1', 'user-1', 'Dupont', 'Jean', 'senior', 450, 380, '2020-01-15', 'actif'),
  ('cons-2', NULL, 'Martin', 'Marie', 'consultant', 400, 340, '2021-03-20', 'actif'),
  ('cons-3', NULL, 'Durand', 'Pierre', 'junior', 300, 280, '2023-06-01', 'actif');

-- Personas
INSERT INTO personas VALUES
  ('pers-1', 'DEV-JUN', 'Développeur Junior', 350),
  ('pers-2', 'DEV-SEN', 'Développeur Senior', 500),
  ('pers-3', 'ARCH', 'Architecte', 700),
  ('pers-4', 'PM', 'Project Manager', 600),
  ('pers-5', 'DIR', 'Directeur Technique', 800);

-- Projects
INSERT INTO projects VALUES
  ('proj-1', 'ALPHA', 'Projet Alpha', 'Acme Corp', 'regie', 150000, 300, '2024-01-01', '2024-12-31', 'actif', 'user-2'),
  ('proj-2', 'BETA', 'Projet Beta', 'TechStart', 'forfait', 80000, 160, '2024-02-01', '2024-08-31', 'actif', 'user-2'),
  ('proj-3', 'GAMMA', 'Projet Gamma', 'Internal', 'regie', 50000, 100, '2024-03-01', '2024-06-30', 'actif', 'user-3');
```

### Tâche 3 : Appliquer migrations

```bash
cd api

# Local
npx wrangler d1 execute staffing-db --local --file=migrations/001_initial.sql
npx wrangler d1 execute staffing-db --local --file=migrations/002_seed.sql

# Remote
npx wrangler d1 execute staffing-db --remote --file=migrations/001_initial.sql
npx wrangler d1 execute staffing-db --remote --file=migrations/002_seed.sql
```

### Tâche 4 : Helper DB

**Fichier** : `api/src/db/index.ts`

```typescript
export function getDb(env: any) {
  return env.DB;
}

export async function queryOne<T>(db: any, sql: string, params: any[] = []): Promise<T | null> {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(...params);
  }
  return await stmt.first();
}

export async function queryAll<T>(db: any, sql: string, params: any[] = []): Promise<T[]> {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(...params);
  }
  const result = await stmt.all();
  return result.results || [];
}
```

---

## 🧪 3. Tests

### Tests migrations

**Fichier** : `api/tests/integration/database.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { getTestDb } from '../helpers';

describe('Database Schema', () => {
  let db: any;

  beforeAll(async () => {
    db = await getTestDb();
    // Apply migrations
    await applyMigrations(db);
  });

  it('should have all tables', async () => {
    const tables = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all();

    const tableNames = tables.results.map((t: any) => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('consultants');
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('personas');
    expect(tableNames).toContain('interventions');
    expect(tableNames).toContain('time_entries');
    expect(tableNames).toContain('audit_logs');
    expect(tableNames).toContain('chat_history');
  });

  it('should enforce unique email constraint', async () => {
    await expect(
      db.prepare(
        'INSERT INTO users VALUES (?, ?, ?, ?, ?)'
      ).bind('u1', 'test@test.com', 'hash', 'consultant', Date.now()).run()
    ).resolves.toBeTruthy();

    await expect(
      db.prepare(
        'INSERT INTO users VALUES (?, ?, ?, ?, ?)'
      ).bind('u2', 'test@test.com', 'hash', 'consultant', Date.now()).run()
    ).rejects.toThrow(/UNIQUE constraint failed/);
  });

  it('should enforce time_entry constraints', async () => {
    // jours doit être 0.5 ou 1.0
    await expect(
      db.prepare(
        'INSERT INTO time_entries (time_entry_id, consultant_id, project_id, entry_date, periode, jours, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind('te1', 'c1', 'p1', '2024-01-01', 'matin', 0.75, Date.now()).run()
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it('should calculate utilization view correctly', async () => {
    // Seed consultant + time entries
    // ...
    const result = await db.prepare(
      'SELECT * FROM v_consultant_utilization WHERE consultant_id = ?'
    ).bind('cons-1').first();

    expect(result).toBeDefined();
    expect(result.taux_utilisation_30j).toBeGreaterThanOrEqual(0);
  });
});
```

---

## 📤 4. Livrables

```
api/
├── migrations/
│   ├── 001_initial.sql        [CRÉÉ] 8 tables + 2 vues
│   └── 002_seed.sql           [CRÉÉ] Données test
├── src/
│   └── db/
│       └── index.ts           [CRÉÉ] Helpers DB
└── tests/
    └── integration/
        └── database.test.ts   [CRÉÉ] Tests schema
```

---

## ✅ 5. Validation

```bash
# Appliquer migrations
cd api
npx wrangler d1 execute staffing-db --local --file=migrations/001_initial.sql
npx wrangler d1 execute staffing-db --local --file=migrations/002_seed.sql

# Vérifier tables
npx wrangler d1 execute staffing-db --local \
  --command="SELECT name FROM sqlite_master WHERE type='table'"

# Vérifier données
npx wrangler d1 execute staffing-db --local \
  --command="SELECT * FROM users"

# Tests
npm test
```

### Checklist

- [ ] 8 tables créées
- [ ] 2 vues créées
- [ ] Seed data chargé
- [ ] Contraintes fonctionnent
- [ ] Tests >= 85% coverage
- [ ] Migrations appliquées local + remote

---

## 🔄 6. Handoff CHANTIER_03

Le chantier 03 utilisera :
- Table users complète → Login/Register fonctionnels
- Tables consultants + projects → CRUD à implémenter
- Helpers DB → queryOne/queryAll

---

_Chantier 02 : Database_
_Durée : 2 jours_
