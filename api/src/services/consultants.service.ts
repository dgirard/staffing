/**
 * Consultants Service
 *
 * Business logic for consultant management
 * Handles CJR access control based on user role
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  getAllConsultants,
  getConsultantByUserId,
  updateConsultantDisponibilite,
} from '../db/queries';

export interface ConsultantWithUser {
  id: string;
  user_id: string;
  tjm_defaut: number;
  competences: string;
  disponible: number;
  created_at: string;
  nom: string;
  prenom: string;
  email: string;
}

export class ConsultantsService {
  /**
   * Get all consultants
   */
  async list(db: D1Database): Promise<ConsultantWithUser[]> {
    const result = await getAllConsultants(db);

    if (!result.results) {
      return [];
    }

    return result.results as unknown as ConsultantWithUser[];
  }

  /**
   * Get consultant by user ID
   */
  async getByUserId(db: D1Database, userId: string) {
    const consultant = await getConsultantByUserId(db, userId);

    if (!consultant) {
      return null;
    }

    // Parse competences JSON
    return {
      ...consultant,
      competences: JSON.parse(consultant.competences || '[]'),
    };
  }

  /**
   * Toggle consultant disponibilite (availability)
   */
  async toggleDisponibilite(db: D1Database, consultantId: string): Promise<boolean> {
    // Get current state
    const consultant = await db
      .prepare('SELECT disponible FROM consultants WHERE id = ?')
      .bind(consultantId)
      .first<{ disponible: number }>();

    if (!consultant) {
      throw new Error('Consultant non trouvé');
    }

    const newDisponible = consultant.disponible === 1 ? false : true;
    await updateConsultantDisponibilite(db, consultantId, newDisponible);

    return newDisponible;
  }

  /**
   * Get consultant utilization stats
   */
  async getUtilization(db: D1Database, consultantId: string) {
    return db
      .prepare('SELECT * FROM v_consultant_utilization WHERE consultant_id = ?')
      .bind(consultantId)
      .first();
  }

  /**
   * Get all consultant utilizations (for admin/directeur)
   */
  async getAllUtilizations(db: D1Database) {
    return db.prepare('SELECT * FROM v_consultant_utilization ORDER BY taux_utilisation DESC').all();
  }
}
