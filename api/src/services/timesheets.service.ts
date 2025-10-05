/**
 * Timesheets Service
 *
 * Business logic for timesheet management
 * Handles half-day validation, unique constraints, and status transitions
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  createTimesheet,
  getTimesheetsByConsultant,
  getTimesheetsByProject,
  updateTimesheetStatus,
  deleteTimesheet,
  CreateTimesheetParams,
} from '../db/queries';

export interface CreateTimesheetDTO {
  consultant_id: string;
  intervention_id: string;
  date: string;
  temps_saisi: 0.5 | 1.0;
  periode: 'matin' | 'apres-midi' | 'journee';
  commentaire?: string | null;
}

export interface DayValidation {
  valid: boolean;
  error?: string;
  existing_entries?: Array<{
    id: string;
    periode: 'matin' | 'apres-midi' | 'journee';
    temps_saisi: number;
  }>;
}

export class TimesheetsService {
  /**
   * Validate timesheet entry for a specific day
   * Rules:
   * - Max 1.0 day total per day
   * - Max 2 entries per day (matin + apres-midi)
   * - No duplicate periode on same day
   * - If "journee", must be only entry for that day
   */
  async validateDayEntry(
    db: D1Database,
    consultantId: string,
    interventionId: string,
    date: string,
    periode: 'matin' | 'apres-midi' | 'journee',
    tempsSaisi: 0.5 | 1.0
  ): Promise<DayValidation> {
    // Get existing entries for this day (all interventions)
    const existingEntries = await db
      .prepare(
        `SELECT id, periode, temps_saisi
         FROM timesheets
         WHERE consultant_id = ?
           AND date = ?
           AND intervention_id = ?`
      )
      .bind(consultantId, date, interventionId)
      .all();

    const entries = existingEntries.results || [];

    // Check for duplicate periode
    const duplicatePeriode = entries.find((e: any) => e.periode === periode);
    if (duplicatePeriode) {
      return {
        valid: false,
        error: `Période "${periode}" déjà saisie pour cette date`,
        existing_entries: entries as any,
      };
    }

    // Calculate total time for the day (including new entry)
    const currentTotal = entries.reduce((sum: number, e: any) => sum + e.temps_saisi, 0);
    const newTotal = currentTotal + tempsSaisi;

    if (newTotal > 1.0) {
      return {
        valid: false,
        error: `Dépassement: ${newTotal} jour (max 1.0 jour/jour)`,
        existing_entries: entries as any,
      };
    }

    // If new entry is "journee", check no other entries exist
    if (periode === 'journee' && entries.length > 0) {
      return {
        valid: false,
        error: 'Journée complète: impossible de saisir matin/après-midi séparément',
        existing_entries: entries as any,
      };
    }

    // If existing "journee" entry, cannot add matin/apres-midi
    const hasJournee = entries.some((e: any) => e.periode === 'journee');
    if (hasJournee && periode !== 'journee') {
      return {
        valid: false,
        error: 'Journée complète déjà saisie, impossible d\'ajouter matin/après-midi',
        existing_entries: entries as any,
      };
    }

    return { valid: true };
  }

  /**
   * Create a new timesheet entry
   */
  async create(db: D1Database, data: CreateTimesheetDTO): Promise<string> {
    // Validate day entry
    const validation = await this.validateDayEntry(
      db,
      data.consultant_id,
      data.intervention_id,
      data.date,
      data.periode,
      data.temps_saisi
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Validate temps_saisi matches periode
    if (data.periode === 'journee' && data.temps_saisi !== 1.0) {
      throw new Error('Journée complète doit être 1.0 jour');
    }

    if ((data.periode === 'matin' || data.periode === 'apres-midi') && data.temps_saisi !== 0.5) {
      throw new Error('Matin/Après-midi doit être 0.5 jour');
    }

    // Generate timesheet ID
    const id = `ts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create timesheet with status 'draft'
    const params: CreateTimesheetParams = {
      id,
      consultant_id: data.consultant_id,
      intervention_id: data.intervention_id,
      date: data.date,
      temps_saisi: data.temps_saisi,
      periode: data.periode,
      statut: 'draft',
      commentaire: data.commentaire || null,
    };

    await createTimesheet(db, params);
    return id;
  }

  /**
   * Get timesheet by ID
   */
  async getById(db: D1Database, timesheetId: string) {
    return db
      .prepare(
        `SELECT t.*, i.project_id, p.nom as project_nom, u.nom, u.prenom
         FROM timesheets t
         INNER JOIN interventions i ON t.intervention_id = i.id
         INNER JOIN projects p ON i.project_id = p.id
         INNER JOIN consultants c ON t.consultant_id = c.id
         INNER JOIN users u ON c.user_id = u.id
         WHERE t.id = ?`
      )
      .bind(timesheetId)
      .first();
  }

  /**
   * Get timesheets for a consultant
   */
  async getByConsultant(db: D1Database, consultantId: string, month?: string) {
    const result = await getTimesheetsByConsultant(db, consultantId, month);
    return result.results || [];
  }

  /**
   * Get timesheets for a project
   */
  async getByProject(db: D1Database, projectId: string, month?: string) {
    const result = await getTimesheetsByProject(db, projectId, month);
    return result.results || [];
  }

  /**
   * Update timesheet (only if status is 'draft')
   */
  async update(
    db: D1Database,
    timesheetId: string,
    data: Partial<CreateTimesheetDTO>
  ): Promise<void> {
    // Get current timesheet
    const timesheet = await this.getById(db, timesheetId);
    if (!timesheet) {
      throw new Error('Timesheet non trouvé');
    }

    if (timesheet.statut !== 'draft') {
      throw new Error('Impossible de modifier: statut doit être "draft"');
    }

    // If changing date/periode/temps_saisi, revalidate
    if (data.date || data.periode || data.temps_saisi !== undefined) {
      const newDate = data.date || (timesheet.date as string);
      const newPeriode = data.periode || (timesheet.periode as 'matin' | 'apres-midi' | 'journee');
      const newTempsSaisi = data.temps_saisi !== undefined ? data.temps_saisi : (timesheet.temps_saisi as 0.5 | 1.0);

      // Check validation (excluding current timesheet)
      const existingEntries = await db
        .prepare(
          `SELECT id, periode, temps_saisi
           FROM timesheets
           WHERE consultant_id = ?
             AND date = ?
             AND intervention_id = ?
             AND id != ?`
        )
        .bind(timesheet.consultant_id, newDate, timesheet.intervention_id, timesheetId)
        .all();

      const entries = existingEntries.results || [];

      // Check duplicate periode
      const duplicatePeriode = entries.find((e: any) => e.periode === newPeriode);
      if (duplicatePeriode) {
        throw new Error(`Période "${newPeriode}" déjà saisie pour cette date`);
      }

      // Check total
      const currentTotal = entries.reduce((sum: number, e: any) => sum + e.temps_saisi, 0);
      if (currentTotal + newTempsSaisi > 1.0) {
        throw new Error(`Dépassement: ${currentTotal + newTempsSaisi} jour (max 1.0)`);
      }

      // Validate temps_saisi matches periode
      if (newPeriode === 'journee' && newTempsSaisi !== 1.0) {
        throw new Error('Journée complète doit être 1.0 jour');
      }

      if ((newPeriode === 'matin' || newPeriode === 'apres-midi') && newTempsSaisi !== 0.5) {
        throw new Error('Matin/Après-midi doit être 0.5 jour');
      }
    }

    // Build update query
    const updates: string[] = [];
    const bindings: any[] = [];

    if (data.date) {
      updates.push('date = ?');
      bindings.push(data.date);
    }
    if (data.temps_saisi !== undefined) {
      updates.push('temps_saisi = ?');
      bindings.push(data.temps_saisi);
    }
    if (data.periode) {
      updates.push('periode = ?');
      bindings.push(data.periode);
    }
    if (data.commentaire !== undefined) {
      updates.push('commentaire = ?');
      bindings.push(data.commentaire);
    }

    updates.push("updated_at = datetime('now')");
    bindings.push(timesheetId);

    await db
      .prepare(`UPDATE timesheets SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();
  }

  /**
   * Submit timesheet for validation (draft → submitted)
   */
  async submit(db: D1Database, timesheetId: string): Promise<void> {
    const timesheet = await this.getById(db, timesheetId);
    if (!timesheet) {
      throw new Error('Timesheet non trouvé');
    }

    if (timesheet.statut !== 'draft') {
      throw new Error(`Impossible de soumettre: statut actuel "${timesheet.statut}"`);
    }

    await updateTimesheetStatus(db, timesheetId, 'submitted');
  }

  /**
   * Delete timesheet (only if status is 'draft')
   */
  async delete(db: D1Database, timesheetId: string): Promise<void> {
    const timesheet = await this.getById(db, timesheetId);
    if (!timesheet) {
      throw new Error('Timesheet non trouvé');
    }

    if (timesheet.statut !== 'draft') {
      throw new Error('Impossible de supprimer: statut doit être "draft"');
    }

    await deleteTimesheet(db, timesheetId);
  }

  /**
   * Get monthly summary for a consultant
   */
  async getMonthlySummary(db: D1Database, consultantId: string, month: string) {
    const result = await db
      .prepare(
        `SELECT
           COUNT(*) as total_entries,
           SUM(temps_saisi) as total_jours,
           COUNT(CASE WHEN statut = 'draft' THEN 1 END) as draft_count,
           COUNT(CASE WHEN statut = 'submitted' THEN 1 END) as submitted_count,
           COUNT(CASE WHEN statut = 'validated' THEN 1 END) as validated_count,
           COUNT(CASE WHEN statut = 'rejected' THEN 1 END) as rejected_count
         FROM timesheets
         WHERE consultant_id = ?
           AND strftime('%Y-%m', date) = ?`
      )
      .bind(consultantId, month)
      .first();

    return result;
  }

  /**
   * Get daily entries for a consultant and date
   */
  async getDailyEntries(db: D1Database, consultantId: string, date: string) {
    const result = await db
      .prepare(
        `SELECT t.*, i.project_id, p.nom as project_nom
         FROM timesheets t
         INNER JOIN interventions i ON t.intervention_id = i.id
         INNER JOIN projects p ON i.project_id = p.id
         WHERE t.consultant_id = ?
           AND t.date = ?
         ORDER BY t.created_at`
      )
      .bind(consultantId, date)
      .all();

    return result.results || [];
  }
}
