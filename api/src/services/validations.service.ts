/**
 * Validations Service
 *
 * Business logic for timesheet validation workflow
 * Handles status transitions, ownership checks, and bulk operations
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { Role } from '../types';
import { createValidation, getValidationsByTimesheet } from '../db/queries';

export interface ValidateTimesheetDTO {
  timesheet_id: string;
  validator_id: string;
  statut: 'validated' | 'rejected';
  commentaire?: string | null;
}

export interface BulkValidateDTO {
  timesheet_ids: string[];
  statut: 'validated' | 'rejected';
  commentaire?: string | null;
}

export class ValidationsService {
  /**
   * Validate or reject a timesheet
   */
  async validate(
    db: D1Database,
    data: ValidateTimesheetDTO,
    validatorRole: Role
  ): Promise<string> {
    // Get timesheet with project info
    const timesheet = await db
      .prepare(
        `SELECT t.*, i.project_id, p.owner_id
         FROM timesheets t
         INNER JOIN interventions i ON t.intervention_id = i.id
         INNER JOIN projects p ON i.project_id = p.id
         WHERE t.id = ?`
      )
      .bind(data.timesheet_id)
      .first<{
        id: string;
        statut: string;
        project_id: string;
        owner_id: string;
      }>();

    if (!timesheet) {
      throw new Error('Timesheet non trouvé');
    }

    // Check status - must be "submitted"
    if (timesheet.statut !== 'submitted') {
      throw new Error(`Impossible de valider: statut actuel "${timesheet.statut}" (doit être "submitted")`);
    }

    // Check permissions for project_owner
    if (validatorRole === 'project_owner') {
      if (timesheet.owner_id !== data.validator_id) {
        throw new Error('Vous ne pouvez valider que les timesheets de vos propres projets');
      }
    }

    // If rejecting, commentaire is required
    if (data.statut === 'rejected' && !data.commentaire) {
      throw new Error('Un commentaire est obligatoire pour rejeter un timesheet');
    }

    // Generate validation ID
    const validationId = `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create validation record
    await createValidation(db, {
      id: validationId,
      timesheet_id: data.timesheet_id,
      validator_id: data.validator_id,
      statut: data.statut,
      commentaire: data.commentaire || null,
    });

    // Update timesheet status
    await db
      .prepare(`UPDATE timesheets SET statut = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(data.statut, data.timesheet_id)
      .run();

    return validationId;
  }

  /**
   * Bulk validate/reject multiple timesheets
   */
  async validateBulk(
    db: D1Database,
    data: BulkValidateDTO,
    validatorId: string,
    validatorRole: Role
  ): Promise<{
    succeeded: string[];
    failed: Array<{ timesheet_id: string; error: string }>;
  }> {
    const succeeded: string[] = [];
    const failed: Array<{ timesheet_id: string; error: string }> = [];

    for (const timesheetId of data.timesheet_ids) {
      try {
        await this.validate(
          db,
          {
            timesheet_id: timesheetId,
            validator_id: validatorId,
            statut: data.statut,
            commentaire: data.commentaire,
          },
          validatorRole
        );
        succeeded.push(timesheetId);
      } catch (error) {
        failed.push({
          timesheet_id: timesheetId,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    return { succeeded, failed };
  }

  /**
   * Get pending timesheets for validation
   */
  async getPendingTimesheets(db: D1Database, validatorId: string, validatorRole: Role) {
    let query = `
      SELECT
        t.id,
        t.date,
        t.temps_saisi,
        t.periode,
        t.commentaire,
        t.created_at,
        t.updated_at,
        i.project_id,
        p.nom as project_nom,
        p.client,
        p.owner_id,
        c.id as consultant_id,
        u.nom as consultant_nom,
        u.prenom as consultant_prenom
      FROM timesheets t
      INNER JOIN interventions i ON t.intervention_id = i.id
      INNER JOIN projects p ON i.project_id = p.id
      INNER JOIN consultants c ON t.consultant_id = c.id
      INNER JOIN users u ON c.user_id = u.id
      WHERE t.statut = 'submitted'
    `;

    const bindings: any[] = [];

    // Filter by project ownership for project_owner
    if (validatorRole === 'project_owner') {
      query += ' AND p.owner_id = ?';
      bindings.push(validatorId);
    }

    query += ' ORDER BY t.created_at ASC';

    const result = await db.prepare(query).bind(...bindings).all();
    return result.results || [];
  }

  /**
   * Get validation history for a timesheet
   */
  async getValidationHistory(db: D1Database, timesheetId: string) {
    const result = await getValidationsByTimesheet(db, timesheetId);
    return result.results || [];
  }

  /**
   * Get validation by ID
   */
  async getById(db: D1Database, validationId: string) {
    return db
      .prepare(
        `SELECT v.*, u.nom as validator_nom, u.prenom as validator_prenom, u.role as validator_role
         FROM validations v
         INNER JOIN users u ON v.validator_id = u.id
         WHERE v.id = ?`
      )
      .bind(validationId)
      .first();
  }

  /**
   * Resubmit a rejected timesheet (rejected → submitted)
   */
  async resubmit(db: D1Database, timesheetId: string, consultantId: string): Promise<void> {
    // Get timesheet
    const timesheet = await db
      .prepare('SELECT id, consultant_id, statut FROM timesheets WHERE id = ?')
      .bind(timesheetId)
      .first<{ id: string; consultant_id: string; statut: string }>();

    if (!timesheet) {
      throw new Error('Timesheet non trouvé');
    }

    // Check ownership
    if (timesheet.consultant_id !== consultantId) {
      throw new Error('Vous ne pouvez re-soumettre que vos propres timesheets');
    }

    // Check status - must be "rejected"
    if (timesheet.statut !== 'rejected') {
      throw new Error(`Impossible de re-soumettre: statut actuel "${timesheet.statut}" (doit être "rejected")`);
    }

    // Update status to submitted
    await db
      .prepare(`UPDATE timesheets SET statut = 'submitted', updated_at = datetime('now') WHERE id = ?`)
      .bind(timesheetId)
      .run();
  }

  /**
   * Get validation statistics for a project
   */
  async getProjectStats(db: D1Database, projectId: string, month?: string) {
    let query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN t.statut = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN t.statut = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN t.statut = 'validated' THEN 1 END) as validated_count,
        COUNT(CASE WHEN t.statut = 'rejected' THEN 1 END) as rejected_count,
        SUM(CASE WHEN t.statut = 'validated' THEN t.temps_saisi ELSE 0 END) as validated_jours
      FROM timesheets t
      INNER JOIN interventions i ON t.intervention_id = i.id
      WHERE i.project_id = ?
    `;

    const bindings: any[] = [projectId];

    if (month) {
      query += ` AND strftime('%Y-%m', t.date) = ?`;
      bindings.push(month);
    }

    return db.prepare(query).bind(...bindings).first();
  }

  /**
   * Get validation statistics for a consultant
   */
  async getConsultantStats(db: D1Database, consultantId: string, month?: string) {
    let query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN statut = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN statut = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN statut = 'validated' THEN 1 END) as validated_count,
        COUNT(CASE WHEN statut = 'rejected' THEN 1 END) as rejected_count,
        SUM(CASE WHEN statut = 'validated' THEN temps_saisi ELSE 0 END) as validated_jours
      FROM timesheets
      WHERE consultant_id = ?
    `;

    const bindings: any[] = [consultantId];

    if (month) {
      query += ` AND strftime('%Y-%m', date) = ?`;
      bindings.push(month);
    }

    return db.prepare(query).bind(...bindings).first();
  }
}
