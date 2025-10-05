/**
 * Interventions Service
 *
 * Business logic for consultant allocations to projects
 * Handles conflict detection, TJ locking, and allocation management
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  createIntervention,
  getInterventionsByConsultant,
  getActiveInterventionsByConsultant,
  getInterventionsByProject,
  CreateInterventionParams,
} from '../db/queries';

export interface CreateInterventionDTO {
  consultant_id: string;
  project_id: string;
  date_debut: string;
  date_fin?: string | null;
  tj_facture: number;
  pourcentage_allocation: number;
}

export interface AllocationConflict {
  intervention_id: string;
  project_nom: string;
  date_debut: string;
  date_fin: string | null;
  pourcentage_allocation: number;
}

export class InterventionsService {
  /**
   * Check for allocation conflicts for a consultant
   * Returns overlapping interventions that would exceed 100% allocation
   */
  async checkConflicts(
    db: D1Database,
    consultantId: string,
    dateDebut: string,
    dateFin: string | null,
    newAllocation: number
  ): Promise<AllocationConflict[]> {
    // Find overlapping active interventions
    let query = `
      SELECT
        i.id as intervention_id,
        p.nom as project_nom,
        i.date_debut,
        i.date_fin,
        i.pourcentage_allocation
      FROM interventions i
      INNER JOIN projects p ON i.project_id = p.id
      WHERE i.consultant_id = ?
        AND i.statut = 'active'
        AND (
          -- New intervention has no end date (overlaps everything after start)
          (? IS NULL AND (i.date_fin IS NULL OR i.date_fin >= ?))
          OR
          -- Existing intervention has no end date (overlaps everything after its start)
          (i.date_fin IS NULL AND ? >= i.date_debut)
          OR
          -- Both have end dates - check overlap
          (? IS NOT NULL AND i.date_fin IS NOT NULL AND ? <= i.date_fin AND ? >= i.date_debut)
        )
    `;

    const result = await db
      .prepare(query)
      .bind(consultantId, dateFin, dateDebut, dateDebut, dateFin, dateDebut, dateFin || dateDebut)
      .all();

    if (!result.results || result.results.length === 0) {
      return [];
    }

    // Calculate total allocation for overlapping periods
    const totalAllocation = result.results.reduce(
      (sum: number, intervention: any) => sum + intervention.pourcentage_allocation,
      0
    );

    // If adding new allocation would exceed 100%, return conflicts
    if (totalAllocation + newAllocation > 100) {
      return result.results as unknown as AllocationConflict[];
    }

    return [];
  }

  /**
   * Create a new intervention with conflict detection and TJ locking
   */
  async create(db: D1Database, data: CreateInterventionDTO): Promise<string> {
    // Check for allocation conflicts
    const conflicts = await this.checkConflicts(
      db,
      data.consultant_id,
      data.date_debut,
      data.date_fin || null,
      data.pourcentage_allocation
    );

    if (conflicts.length > 0) {
      throw new Error(
        `Conflit d'allocation: Le consultant est déjà alloué à ${conflicts.length} projet(s) sur cette période (total > 100%)`
      );
    }

    // Validate dates
    if (data.date_fin && data.date_fin < data.date_debut) {
      throw new Error('La date de fin doit être supérieure ou égale à la date de début');
    }

    // Validate allocation percentage
    if (data.pourcentage_allocation < 0 || data.pourcentage_allocation > 100) {
      throw new Error('Le pourcentage d\'allocation doit être entre 0 et 100');
    }

    // Generate intervention ID
    const id = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create intervention with TJ locked at allocation time
    const params: CreateInterventionParams = {
      id,
      consultant_id: data.consultant_id,
      project_id: data.project_id,
      date_debut: data.date_debut,
      date_fin: data.date_fin || null,
      tj_facture: data.tj_facture, // TJ is locked at this value
      pourcentage_allocation: data.pourcentage_allocation,
      statut: 'active',
    };

    await createIntervention(db, params);
    return id;
  }

  /**
   * Get intervention by ID
   */
  async getById(db: D1Database, interventionId: string) {
    return db
      .prepare(
        `SELECT i.*, p.nom as project_nom, p.client, c.tjm_defaut, u.nom, u.prenom
         FROM interventions i
         INNER JOIN projects p ON i.project_id = p.id
         INNER JOIN consultants c ON i.consultant_id = c.id
         INNER JOIN users u ON c.user_id = u.id
         WHERE i.id = ?`
      )
      .bind(interventionId)
      .first();
  }

  /**
   * Get interventions for a consultant
   */
  async getByConsultant(db: D1Database, consultantId: string, activeOnly: boolean = false) {
    if (activeOnly) {
      const result = await getActiveInterventionsByConsultant(db, consultantId);
      return result.results || [];
    }

    const result = await getInterventionsByConsultant(db, consultantId);
    return result.results || [];
  }

  /**
   * Get interventions for a project
   */
  async getByProject(db: D1Database, projectId: string) {
    const result = await getInterventionsByProject(db, projectId);
    return result.results || [];
  }

  /**
   * Update allocation percentage
   */
  async updateAllocation(
    db: D1Database,
    interventionId: string,
    newAllocation: number
  ): Promise<void> {
    // Validate allocation percentage
    if (newAllocation < 0 || newAllocation > 100) {
      throw new Error('Le pourcentage d\'allocation doit être entre 0 et 100');
    }

    // Get current intervention
    const intervention = await this.getById(db, interventionId);
    if (!intervention) {
      throw new Error('Intervention non trouvée');
    }

    // Check conflicts with new allocation
    const conflicts = await this.checkConflicts(
      db,
      intervention.consultant_id as string,
      intervention.date_debut as string,
      intervention.date_fin as string | null,
      newAllocation
    );

    // Filter out current intervention from conflicts
    const otherConflicts = conflicts.filter((c) => c.intervention_id !== interventionId);

    if (otherConflicts.length > 0) {
      throw new Error(
        `Conflit d'allocation: Le nouveau pourcentage créerait un conflit avec ${otherConflicts.length} projet(s)`
      );
    }

    await db
      .prepare('UPDATE interventions SET pourcentage_allocation = ? WHERE id = ?')
      .bind(newAllocation, interventionId)
      .run();
  }

  /**
   * End an intervention (set date_fin to today, change status to terminee)
   */
  async end(db: D1Database, interventionId: string): Promise<void> {
    const intervention = await this.getById(db, interventionId);
    if (!intervention) {
      throw new Error('Intervention non trouvée');
    }

    if (intervention.statut === 'terminee') {
      throw new Error('Cette intervention est déjà terminée');
    }

    const today = new Date().toISOString().split('T')[0];

    await db
      .prepare(`UPDATE interventions SET date_fin = ?, statut = 'terminee' WHERE id = ?`)
      .bind(today, interventionId)
      .run();
  }

  /**
   * Delete an intervention (hard delete)
   */
  async delete(db: D1Database, interventionId: string): Promise<void> {
    // Check if intervention has timesheets
    const timesheets = await db
      .prepare('SELECT COUNT(*) as count FROM timesheets WHERE intervention_id = ?')
      .bind(interventionId)
      .first<{ count: number }>();

    if (timesheets && timesheets.count > 0) {
      throw new Error(
        `Impossible de supprimer cette intervention: ${timesheets.count} timesheet(s) associé(s)`
      );
    }

    await db.prepare('DELETE FROM interventions WHERE id = ?').bind(interventionId).run();
  }

  /**
   * Get consultant's current allocation percentage
   */
  async getCurrentAllocation(db: D1Database, consultantId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const result = await db
      .prepare(
        `SELECT COALESCE(SUM(pourcentage_allocation), 0) as total
         FROM interventions
         WHERE consultant_id = ?
           AND statut = 'active'
           AND date_debut <= ?
           AND (date_fin IS NULL OR date_fin >= ?)`
      )
      .bind(consultantId, today, today)
      .first<{ total: number }>();

    return result?.total || 0;
  }
}
