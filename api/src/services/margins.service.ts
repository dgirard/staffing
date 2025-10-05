/**
 * Margins Service
 *
 * Business logic for project margins with CJR/CJN access control
 * Implements audit trail for sensitive CJR data access
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { Role } from '../types';
import { AuditService } from './audit.service';

export class MarginsService {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Get project margins (with CJR access control)
   */
  async getProjectMargins(
    db: D1Database,
    projectId: string,
    userId: string,
    userRole: Role,
    useRealCost: boolean,
    metadata?: Record<string, any>
  ) {
    // Check CJR access permission
    if (useRealCost) {
      if (userRole !== 'directeur') {
        throw new Error('CJR access requires directeur role');
      }

      // Audit log CJR access
      await this.auditService.log(
        db,
        userId,
        'VIEW_PROJECT_MARGIN_CJR',
        'projects',
        projectId,
        {
          timestamp: new Date().toISOString(),
          ...metadata,
        }
      );
    }

    // Build SQL query based on access level
    const marginField = useRealCost ? 'marge_cjr' : 'marge_cjn';
    const costField = useRealCost ? 'cout_cjr' : 'cout_cjn';

    const result = await db
      .prepare(
        `SELECT
           project_id,
           project_nom,
           client,
           ca_realise,
           montant_vendu,
           ${costField} as cout,
           ${marginField} as marge
         FROM v_project_margins
         WHERE project_id = ?`
      )
      .bind(projectId)
      .first();

    if (!result) {
      throw new Error('Projet non trouvé');
    }

    return {
      ...result,
      cost_type: useRealCost ? 'CJR' : 'CJN',
    };
  }

  /**
   * Get all project margins (with CJR access control)
   */
  async getAllMargins(
    db: D1Database,
    userId: string,
    userRole: Role,
    useRealCost: boolean,
    metadata?: Record<string, any>
  ) {
    // Check CJR access permission
    if (useRealCost) {
      if (userRole !== 'directeur') {
        throw new Error('CJR access requires directeur role');
      }

      // Audit log CJR access
      await this.auditService.log(
        db,
        userId,
        'VIEW_ALL_MARGINS_CJR',
        'projects',
        '*',
        {
          timestamp: new Date().toISOString(),
          ...metadata,
        }
      );
    }

    // Build SQL query based on access level
    const marginField = useRealCost ? 'marge_cjr' : 'marge_cjn';
    const costField = useRealCost ? 'cout_cjr' : 'cout_cjn';

    const result = await db
      .prepare(
        `SELECT
           project_id,
           project_nom,
           client,
           ca_realise,
           montant_vendu,
           ${costField} as cout,
           ${marginField} as marge
         FROM v_project_margins
         ORDER BY project_nom`
      )
      .all();

    return {
      projects: result.results || [],
      cost_type: useRealCost ? 'CJR' : 'CJN',
    };
  }

  /**
   * Compare CJN vs CJR margins (directeur only)
   */
  async compareMargins(
    db: D1Database,
    userId: string,
    userRole: Role,
    projectId?: string,
    metadata?: Record<string, any>
  ) {
    // Only directeur can compare
    if (userRole !== 'directeur') {
      throw new Error('Margin comparison requires directeur role');
    }

    // Audit log
    await this.auditService.log(
      db,
      userId,
      'VIEW_ALL_MARGINS_CJR',
      'projects',
      projectId || '*',
      {
        action_detail: 'CJN_CJR_COMPARISON',
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    );

    let query = `
      SELECT
        project_id,
        project_nom,
        client,
        ca_realise,
        montant_vendu,
        cout_cjn,
        cout_cjr,
        marge_cjn,
        marge_cjr,
        (cout_cjn - cout_cjr) as economie,
        CASE
          WHEN ca_realise > 0 THEN ROUND((marge_cjn / ca_realise) * 100, 2)
          ELSE 0
        END as marge_cjn_pct,
        CASE
          WHEN ca_realise > 0 THEN ROUND((marge_cjr / ca_realise) * 100, 2)
          ELSE 0
        END as marge_cjr_pct
      FROM v_project_margins
    `;

    const bindings: any[] = [];

    if (projectId) {
      query += ' WHERE project_id = ?';
      bindings.push(projectId);
    }

    query += ' ORDER BY project_nom';

    const result = await db.prepare(query).bind(...bindings).all();

    const projects = result.results || [];

    // Calculate totals
    const totals = projects.reduce(
      (acc: any, p: any) => {
        acc.ca_realise += p.ca_realise || 0;
        acc.cout_cjn += p.cout_cjn || 0;
        acc.cout_cjr += p.cout_cjr || 0;
        acc.marge_cjn += p.marge_cjn || 0;
        acc.marge_cjr += p.marge_cjr || 0;
        acc.economie += p.economie || 0;
        return acc;
      },
      { ca_realise: 0, cout_cjn: 0, cout_cjr: 0, marge_cjn: 0, marge_cjr: 0, economie: 0 }
    );

    return {
      projects,
      totals: {
        ...totals,
        marge_cjn_pct:
          totals.ca_realise > 0
            ? Math.round((totals.marge_cjn / totals.ca_realise) * 10000) / 100
            : 0,
        marge_cjr_pct:
          totals.ca_realise > 0
            ? Math.round((totals.marge_cjr / totals.ca_realise) * 10000) / 100
            : 0,
      },
    };
  }

  /**
   * Get consultant CJR (directeur only)
   */
  async getConsultantCJR(
    db: D1Database,
    consultantId: string,
    userId: string,
    userRole: Role,
    metadata?: Record<string, any>
  ) {
    // Only directeur can access
    if (userRole !== 'directeur') {
      throw new Error('Consultant CJR access requires directeur role');
    }

    // Audit log
    await this.auditService.log(
      db,
      userId,
      'VIEW_CONSULTANT_CJR',
      'consultants',
      consultantId,
      {
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    );

    // Get consultant with interventions including CJR
    const interventions = await db
      .prepare(
        `SELECT
           i.id,
           i.date_debut_prevue,
           i.date_fin_prevue,
           i.date_fin_reelle,
           i.pourcentage_allocation,
           i.tjm_achat_reel,
           i.tjm_achat_norme,
           p.nom as project_nom,
           p.client,
           p.tjm_vente
         FROM interventions i
         INNER JOIN projects p ON i.project_id = p.id
         WHERE i.consultant_id = ?
         ORDER BY i.date_debut_prevue DESC`
      )
      .bind(consultantId)
      .all();

    return {
      consultant_id: consultantId,
      interventions: interventions.results || [],
      cost_type: 'CJR',
    };
  }
}
