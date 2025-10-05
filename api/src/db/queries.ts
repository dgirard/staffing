/**
 * Database Helper Functions
 *
 * Prepared statement helpers for D1 database operations
 * Prevents SQL injection and provides type-safe queries
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { User, Role } from '../types';

// ============================================
// USERS
// ============================================

export interface CreateUserParams {
  id: string;
  email: string;
  password_hash: string;
  nom: string;
  prenom: string;
  role: Role;
}

export async function createUser(db: D1Database, params: CreateUserParams) {
  return db
    .prepare(
      `INSERT INTO users (id, email, password_hash, nom, prenom, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(params.id, params.email, params.password_hash, params.nom, params.prenom, params.role)
    .run();
}

export async function getUserByEmail(db: D1Database, email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
}

export async function getUserById(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
}

export async function deleteUser(db: D1Database, id: string) {
  return db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
}

// ============================================
// CONSULTANTS
// ============================================

export interface CreateConsultantParams {
  id: string;
  user_id: string;
  tjm_defaut: number;
  competences: string[]; // Will be JSON stringified
  disponible?: boolean;
}

export async function createConsultant(db: D1Database, params: CreateConsultantParams) {
  return db
    .prepare(
      `INSERT INTO consultants (id, user_id, tjm_defaut, competences, disponible, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      params.id,
      params.user_id,
      params.tjm_defaut,
      JSON.stringify(params.competences),
      params.disponible ? 1 : 0
    )
    .run();
}

export async function getConsultantByUserId(db: D1Database, userId: string) {
  return db
    .prepare('SELECT * FROM consultants WHERE user_id = ?')
    .bind(userId)
    .first<{
      id: string;
      user_id: string;
      tjm_defaut: number;
      competences: string;
      disponible: number;
      created_at: string;
    }>();
}

export async function getAllConsultants(db: D1Database) {
  return db
    .prepare(
      `SELECT c.*, u.nom, u.prenom, u.email
       FROM consultants c
       INNER JOIN users u ON c.user_id = u.id
       ORDER BY u.nom, u.prenom`
    )
    .all();
}

export async function updateConsultantDisponibilite(db: D1Database, id: string, disponible: boolean) {
  return db
    .prepare('UPDATE consultants SET disponible = ? WHERE id = ?')
    .bind(disponible ? 1 : 0, id)
    .run();
}

// ============================================
// PROJECTS
// ============================================

export interface CreateProjectParams {
  id: string;
  nom: string;
  client: string;
  type: 'regie' | 'forfait' | 'centre_de_service';
  date_debut: string;
  date_fin?: string | null;
  cjn: number;
  cjr?: number | null;
  owner_id: string;
  statut?: 'actif' | 'termine' | 'annule';
}

export async function createProject(db: D1Database, params: CreateProjectParams) {
  return db
    .prepare(
      `INSERT INTO projects (id, nom, client, type, date_debut, date_fin, cjn, cjr, owner_id, statut, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      params.id,
      params.nom,
      params.client,
      params.type,
      params.date_debut,
      params.date_fin || null,
      params.cjn,
      params.cjr || null,
      params.owner_id,
      params.statut || 'actif'
    )
    .run();
}

export async function getProjectById(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
}

/**
 * Get project by ID with CJR field (directeur only)
 */
export async function getProjectByIdWithCJR(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
}

/**
 * Get project by ID without CJR field (for non-directeur users)
 */
export async function getProjectByIdPublic(db: D1Database, id: string) {
  return db
    .prepare('SELECT id, nom, client, type, date_debut, date_fin, cjn, owner_id, statut, created_at FROM projects WHERE id = ?')
    .bind(id)
    .first();
}

export async function getProjectsByOwner(db: D1Database, ownerId: string) {
  return db.prepare('SELECT * FROM projects WHERE owner_id = ? ORDER BY date_debut DESC').bind(ownerId).all();
}

export async function getAllActiveProjects(db: D1Database) {
  return db.prepare("SELECT * FROM projects WHERE statut = 'actif' ORDER BY date_debut DESC").all();
}

// ============================================
// INTERVENTIONS
// ============================================

export interface CreateInterventionParams {
  id: string;
  consultant_id: string;
  project_id: string;
  date_debut: string;
  date_fin?: string | null;
  tj_facture: number;
  pourcentage_allocation: number;
  statut?: 'active' | 'terminee';
}

export async function createIntervention(db: D1Database, params: CreateInterventionParams) {
  return db
    .prepare(
      `INSERT INTO interventions (id, consultant_id, project_id, date_debut, date_fin, tj_facture, pourcentage_allocation, statut, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      params.id,
      params.consultant_id,
      params.project_id,
      params.date_debut,
      params.date_fin || null,
      params.tj_facture,
      params.pourcentage_allocation,
      params.statut || 'active'
    )
    .run();
}

export async function getInterventionsByConsultant(db: D1Database, consultantId: string) {
  return db
    .prepare(
      `SELECT i.*, p.nom as project_nom, p.client
       FROM interventions i
       INNER JOIN projects p ON i.project_id = p.id
       WHERE i.consultant_id = ?
       ORDER BY i.date_debut DESC`
    )
    .bind(consultantId)
    .all();
}

export async function getActiveInterventionsByConsultant(db: D1Database, consultantId: string) {
  return db
    .prepare(
      `SELECT i.*, p.nom as project_nom, p.client
       FROM interventions i
       INNER JOIN projects p ON i.project_id = p.id
       WHERE i.consultant_id = ? AND i.statut = 'active'
       ORDER BY i.date_debut DESC`
    )
    .bind(consultantId)
    .all();
}

export async function getInterventionsByProject(db: D1Database, projectId: string) {
  return db
    .prepare(
      `SELECT i.*, c.tjm_defaut, u.nom, u.prenom
       FROM interventions i
       INNER JOIN consultants c ON i.consultant_id = c.id
       INNER JOIN users u ON c.user_id = u.id
       WHERE i.project_id = ?
       ORDER BY i.date_debut DESC`
    )
    .bind(projectId)
    .all();
}

// ============================================
// TIMESHEETS
// ============================================

export interface CreateTimesheetParams {
  id: string;
  consultant_id: string;
  intervention_id: string;
  date: string;
  temps_saisi: 0.5 | 1.0;
  periode: 'matin' | 'apres-midi' | 'journee';
  statut?: 'draft' | 'submitted' | 'validated' | 'rejected';
  commentaire?: string | null;
}

export async function createTimesheet(db: D1Database, params: CreateTimesheetParams) {
  return db
    .prepare(
      `INSERT INTO timesheets (id, consultant_id, intervention_id, date, temps_saisi, periode, statut, commentaire, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
    .bind(
      params.id,
      params.consultant_id,
      params.intervention_id,
      params.date,
      params.temps_saisi,
      params.periode,
      params.statut || 'draft',
      params.commentaire || null
    )
    .run();
}

export async function getTimesheetsByConsultant(db: D1Database, consultantId: string, month?: string) {
  let query = `
    SELECT t.*, i.project_id, p.nom as project_nom
    FROM timesheets t
    INNER JOIN interventions i ON t.intervention_id = i.id
    INNER JOIN projects p ON i.project_id = p.id
    WHERE t.consultant_id = ?
  `;

  if (month) {
    query += ` AND strftime('%Y-%m', t.date) = ?`;
    return db.prepare(query + ' ORDER BY t.date DESC').bind(consultantId, month).all();
  }

  return db.prepare(query + ' ORDER BY t.date DESC').bind(consultantId).all();
}

export async function getTimesheetsByProject(db: D1Database, projectId: string, month?: string) {
  let query = `
    SELECT t.*, u.nom, u.prenom
    FROM timesheets t
    INNER JOIN interventions i ON t.intervention_id = i.id
    INNER JOIN consultants c ON t.consultant_id = c.id
    INNER JOIN users u ON c.user_id = u.id
    WHERE i.project_id = ?
  `;

  if (month) {
    query += ` AND strftime('%Y-%m', t.date) = ?`;
    return db.prepare(query + ' ORDER BY t.date DESC').bind(projectId, month).all();
  }

  return db.prepare(query + ' ORDER BY t.date DESC').bind(projectId).all();
}

export async function updateTimesheetStatus(
  db: D1Database,
  id: string,
  statut: 'draft' | 'submitted' | 'validated' | 'rejected'
) {
  return db
    .prepare(`UPDATE timesheets SET statut = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(statut, id)
    .run();
}

export async function deleteTimesheet(db: D1Database, id: string) {
  return db.prepare('DELETE FROM timesheets WHERE id = ?').bind(id).run();
}

// ============================================
// VALIDATIONS
// ============================================

export interface CreateValidationParams {
  id: string;
  timesheet_id: string;
  validator_id: string;
  statut: 'validated' | 'rejected';
  commentaire?: string | null;
}

export async function createValidation(db: D1Database, params: CreateValidationParams) {
  return db
    .prepare(
      `INSERT INTO validations (id, timesheet_id, validator_id, statut, commentaire, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(params.id, params.timesheet_id, params.validator_id, params.statut, params.commentaire || null)
    .run();
}

export async function getValidationsByTimesheet(db: D1Database, timesheetId: string) {
  return db
    .prepare(
      `SELECT v.*, u.nom as validator_nom, u.prenom as validator_prenom
       FROM validations v
       INNER JOIN users u ON v.validator_id = u.id
       WHERE v.timesheet_id = ?
       ORDER BY v.created_at DESC`
    )
    .bind(timesheetId)
    .all();
}

// ============================================
// CHAT
// ============================================

export interface CreateConversationParams {
  id: string;
  user_id: string;
  titre: string;
}

export async function createConversation(db: D1Database, params: CreateConversationParams) {
  return db
    .prepare(
      `INSERT INTO chat_conversations (id, user_id, titre, created_at)
       VALUES (?, ?, ?, datetime('now'))`
    )
    .bind(params.id, params.user_id, params.titre)
    .run();
}

export async function getConversationsByUser(db: D1Database, userId: string) {
  return db
    .prepare('SELECT * FROM chat_conversations WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();
}

export interface CreateMessageParams {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string | null;
}

export async function createMessage(db: D1Database, params: CreateMessageParams) {
  return db
    .prepare(
      `INSERT INTO chat_messages (id, conversation_id, role, content, intent, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(params.id, params.conversation_id, params.role, params.content, params.intent || null)
    .run();
}

export async function getMessagesByConversation(db: D1Database, conversationId: string) {
  return db
    .prepare('SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .bind(conversationId)
    .all();
}

// ============================================
// VIEWS - Analytics
// ============================================

export async function getConsultantUtilization(db: D1Database, consultantId?: string) {
  if (consultantId) {
    return db.prepare('SELECT * FROM v_consultant_utilization WHERE consultant_id = ?').bind(consultantId).first();
  }
  return db.prepare('SELECT * FROM v_consultant_utilization ORDER BY taux_utilisation DESC').all();
}

export async function getProjectMargins(db: D1Database, projectId?: string) {
  if (projectId) {
    return db.prepare('SELECT * FROM v_project_margins WHERE project_id = ?').bind(projectId).first();
  }
  return db.prepare('SELECT * FROM v_project_margins ORDER BY marge DESC').all();
}

/**
 * Get project margins without CJR data (for non-directeur users)
 */
export async function getProjectMarginsPublic(db: D1Database) {
  return db
    .prepare(
      `SELECT
        project_id,
        project_nom,
        client,
        type,
        cjn,
        nb_consultants,
        total_jours_saisis,
        ca_norme
      FROM v_project_margins
      ORDER BY ca_norme DESC`
    )
    .all();
}
