-- Migration 001: Initial Database Schema
-- Created: 2025-10-05
-- Description: Create all tables, indexes, and views for Staffing ESN

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role TEXT CHECK(role IN ('consultant', 'project_owner', 'administrator', 'directeur')) NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- TABLE: consultants
-- ============================================
CREATE TABLE IF NOT EXISTS consultants (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tjm_defaut REAL NOT NULL,
  competences TEXT, -- JSON array stored as text
  disponible INTEGER DEFAULT 1, -- 0 = false, 1 = true
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consultants_user ON consultants(user_id);
CREATE INDEX IF NOT EXISTS idx_consultants_disponible ON consultants(disponible);

-- ============================================
-- TABLE: projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  client TEXT NOT NULL,
  type TEXT CHECK(type IN ('regie', 'forfait', 'centre_de_service')) NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  cjn REAL NOT NULL, -- Coût Journalier Normé (public)
  cjr REAL, -- Coût Journalier Réel (confidentiel - directeur only)
  owner_id TEXT NOT NULL REFERENCES users(id),
  statut TEXT CHECK(statut IN ('actif', 'termine', 'annule')) DEFAULT 'actif',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_statut ON projects(statut);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client);

-- ============================================
-- TABLE: interventions
-- ============================================
CREATE TABLE IF NOT EXISTS interventions (
  id TEXT PRIMARY KEY,
  consultant_id TEXT NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  tj_facture REAL NOT NULL, -- TJ verrouillé au moment de l'allocation
  pourcentage_allocation INTEGER CHECK(pourcentage_allocation >= 0 AND pourcentage_allocation <= 100) NOT NULL,
  statut TEXT CHECK(statut IN ('active', 'terminee')) DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interventions_consultant ON interventions(consultant_id, statut);
CREATE INDEX IF NOT EXISTS idx_interventions_project ON interventions(project_id);
CREATE INDEX IF NOT EXISTS idx_interventions_dates ON interventions(date_debut, date_fin);

-- ============================================
-- TABLE: timesheets
-- ============================================
CREATE TABLE IF NOT EXISTS timesheets (
  id TEXT PRIMARY KEY,
  consultant_id TEXT NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  intervention_id TEXT NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  temps_saisi REAL CHECK(temps_saisi IN (0.5, 1.0)) NOT NULL, -- Demi-journée: 0.5 ou 1.0
  periode TEXT CHECK(periode IN ('matin', 'apres-midi', 'journee')) NOT NULL,
  statut TEXT CHECK(statut IN ('draft', 'submitted', 'validated', 'rejected')) DEFAULT 'draft',
  commentaire TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Contrainte unique: 1 seule saisie par consultant/intervention/date/periode
CREATE UNIQUE INDEX IF NOT EXISTS idx_timesheets_unique
  ON timesheets(consultant_id, intervention_id, date, periode);

CREATE INDEX IF NOT EXISTS idx_timesheets_consultant_date ON timesheets(consultant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_timesheets_statut ON timesheets(statut);
CREATE INDEX IF NOT EXISTS idx_timesheets_intervention ON timesheets(intervention_id);

-- ============================================
-- TABLE: validations
-- ============================================
CREATE TABLE IF NOT EXISTS validations (
  id TEXT PRIMARY KEY,
  timesheet_id TEXT NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  validator_id TEXT NOT NULL REFERENCES users(id),
  statut TEXT CHECK(statut IN ('validated', 'rejected')) NOT NULL,
  commentaire TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_validations_timesheet ON validations(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_validations_validator ON validations(validator_id);

-- ============================================
-- TABLE: chat_conversations
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);

-- ============================================
-- TABLE: chat_messages
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  intent TEXT, -- NLU detected intent
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);

-- ============================================
-- VIEW: v_consultant_utilization
-- Taux d'utilisation des consultants
-- ============================================
CREATE VIEW IF NOT EXISTS v_consultant_utilization AS
SELECT
  c.id as consultant_id,
  u.nom,
  u.prenom,
  c.tjm_defaut,
  c.disponible,
  COUNT(DISTINCT i.id) as nb_interventions_actives,
  COALESCE(SUM(CASE WHEN t.statut = 'validated' THEN t.temps_saisi ELSE 0 END), 0) as jours_saisis,
  ROUND(COALESCE(SUM(CASE WHEN t.statut = 'validated' THEN t.temps_saisi ELSE 0 END), 0) / 20.0 * 100, 1) as taux_utilisation,
  COALESCE(SUM(CASE WHEN t.statut = 'validated' THEN t.temps_saisi * c.tjm_defaut ELSE 0 END), 0) as ca_genere
FROM consultants c
INNER JOIN users u ON c.user_id = u.id
LEFT JOIN interventions i ON c.id = i.consultant_id AND i.statut = 'active'
LEFT JOIN timesheets t ON c.id = t.consultant_id
  AND t.date >= date('now', 'start of month')
  AND t.date < date('now', 'start of month', '+1 month')
GROUP BY c.id, u.nom, u.prenom, c.tjm_defaut, c.disponible;

-- ============================================
-- VIEW: v_project_margins
-- Calcul des marges projets (CJR vs CJN)
-- ============================================
CREATE VIEW IF NOT EXISTS v_project_margins AS
SELECT
  p.id as project_id,
  p.nom as project_nom,
  p.client,
  p.type,
  p.cjn,
  p.cjr,
  COUNT(DISTINCT i.id) as nb_consultants,
  COALESCE(SUM(t.temps_saisi), 0) as total_jours_saisis,
  COALESCE(SUM(t.temps_saisi * p.cjn), 0) as ca_norme,
  COALESCE(SUM(t.temps_saisi * p.cjr), 0) as ca_reel,
  COALESCE(SUM(t.temps_saisi * (p.cjn - COALESCE(p.cjr, 0))), 0) as marge,
  CASE
    WHEN SUM(t.temps_saisi * p.cjn) > 0
    THEN ROUND(SUM(t.temps_saisi * (p.cjn - COALESCE(p.cjr, 0))) / SUM(t.temps_saisi * p.cjn) * 100, 1)
    ELSE 0
  END as taux_marge
FROM projects p
LEFT JOIN interventions i ON p.id = i.project_id
LEFT JOIN timesheets t ON i.id = t.intervention_id AND t.statut = 'validated'
GROUP BY p.id, p.nom, p.client, p.type, p.cjn, p.cjr;

-- Migration complete
