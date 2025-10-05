/**
 * Dashboards Service
 *
 * Business logic for dashboard analytics and KPIs
 * Provides role-specific dashboard data for consultant, project_owner, and administrator
 */

import type { D1Database } from '@cloudflare/workers-types';

export class DashboardsService {
  /**
   * Get consultant dashboard stats
   */
  async getConsultantStats(db: D1Database, userId: string) {
    // Get consultant ID
    const consultant = await db
      .prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(userId)
      .first<{ id: string }>();

    if (!consultant) {
      throw new Error('Profil consultant non trouvé');
    }

    const consultantId = consultant.id;

    // Get current month (YYYY-MM format)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get jours ce mois (validated timesheets)
    const monthStats = await db
      .prepare(
        `SELECT SUM(temps_saisi) as jours_mois
         FROM timesheets
         WHERE consultant_id = ?
           AND statut = 'validated'
           AND strftime('%Y-%m', date) = ?`
      )
      .bind(consultantId, currentMonth)
      .first<{ jours_mois: number | null }>();

    // Get active projects
    const activeProjects = await db
      .prepare(
        `SELECT DISTINCT p.id, p.nom, p.client, i.pourcentage_allocation
         FROM interventions i
         INNER JOIN projects p ON i.project_id = p.id
         WHERE i.consultant_id = ?
           AND (i.date_fin_reelle IS NULL OR i.date_fin_reelle >= date('now'))
         ORDER BY p.nom`
      )
      .bind(consultantId)
      .all();

    // Get utilization from view
    const utilization = await db
      .prepare(
        `SELECT taux_utilisation
         FROM v_consultant_utilization
         WHERE consultant_id = ?`
      )
      .bind(consultantId)
      .first<{ taux_utilisation: number }>();

    // Get this week's timesheet entries
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(now);

    const weekEntries = await db
      .prepare(
        `SELECT
           t.date,
           t.temps_saisi,
           t.periode,
           t.statut,
           p.nom as project_nom,
           p.client
         FROM timesheets t
         INNER JOIN interventions i ON t.intervention_id = i.id
         INNER JOIN projects p ON i.project_id = p.id
         WHERE t.consultant_id = ?
           AND t.date >= ?
           AND t.date <= ?
         ORDER BY t.date ASC`
      )
      .bind(consultantId, weekStart, weekEnd)
      .all();

    return {
      jours_mois: monthStats?.jours_mois || 0,
      nb_projets: activeProjects.results?.length || 0,
      taux_util: Math.round(utilization?.taux_utilisation || 0),
      projets: activeProjects.results || [],
      semaine: weekEntries.results || [],
    };
  }

  /**
   * Get project owner dashboard stats
   */
  async getProjectOwnerStats(db: D1Database, userId: string) {
    // Get pending timesheets count
    const pendingCount = await db
      .prepare(
        `SELECT COUNT(*) as count
         FROM timesheets t
         INNER JOIN interventions i ON t.intervention_id = i.id
         INNER JOIN projects p ON i.project_id = p.id
         WHERE p.owner_id = ?
           AND t.statut = 'submitted'`
      )
      .bind(userId)
      .first<{ count: number }>();

    // Get my projects with budget info (using CJN margins, not CJR)
    const projects = await db
      .prepare(
        `SELECT
           p.id,
           p.nom,
           p.client,
           p.montant_vendu,
           p.tjm_vente,
           p.statut,
           COALESCE(SUM(CASE WHEN t.statut = 'validated' THEN t.temps_saisi * p.tjm_vente ELSE 0 END), 0) as ca_realise,
           COALESCE(SUM(CASE WHEN t.statut = 'validated' THEN t.temps_saisi * (p.tjm_vente - i.tjm_achat_norme) ELSE 0 END), 0) as marge_cjn
         FROM projects p
         LEFT JOIN interventions i ON p.id = i.project_id
         LEFT JOIN timesheets t ON i.id = t.intervention_id
         WHERE p.owner_id = ?
           AND p.statut IN ('actif', 'planifie')
         GROUP BY p.id, p.nom, p.client, p.montant_vendu, p.tjm_vente, p.statut
         ORDER BY p.nom`
      )
      .bind(userId)
      .all();

    return {
      pending_count: pendingCount?.count || 0,
      projects: projects.results || [],
    };
  }

  /**
   * Get administrator dashboard stats
   */
  async getAdminStats(db: D1Database) {
    // Get total active consultants
    const activeConsultants = await db
      .prepare(
        `SELECT COUNT(*) as count
         FROM consultants
         WHERE disponibilite = 1`
      )
      .all();

    // Get total active projects
    const activeProjects = await db
      .prepare(
        `SELECT COUNT(*) as count
         FROM projects
         WHERE statut = 'actif'`
      )
      .all();

    // Get total CA realized (validated timesheets)
    const caTotal = await db
      .prepare(
        `SELECT COALESCE(SUM(t.temps_saisi * p.tjm_vente), 0) as ca_total
         FROM timesheets t
         INNER JOIN interventions i ON t.intervention_id = i.id
         INNER JOIN projects p ON i.project_id = p.id
         WHERE t.statut = 'validated'`
      )
      .first<{ ca_total: number }>();

    // Get average utilization
    const avgUtil = await db
      .prepare(
        `SELECT AVG(taux_utilisation) as taux_moyen
         FROM v_consultant_utilization`
      )
      .first<{ taux_moyen: number | null }>();

    // Get utilization by consultant
    const consultantUtil = await db
      .prepare(
        `SELECT
           c.id,
           u.nom,
           u.prenom,
           COALESCE(v.taux_utilisation, 0) as taux_util
         FROM consultants c
         INNER JOIN users u ON c.user_id = u.id
         LEFT JOIN v_consultant_utilization v ON c.id = v.consultant_id
         WHERE c.disponibilite = 1
         ORDER BY u.nom, u.prenom`
      )
      .all();

    // Detect allocation conflicts (>100%)
    const conflicts = await db
      .prepare(
        `SELECT
           c.id as consultant_id,
           u.nom as consultant_nom,
           u.prenom as consultant_prenom,
           i.date_debut_prevue as date_debut,
           i.date_fin_prevue as date_fin,
           SUM(i.pourcentage_allocation) as total_allocation
         FROM interventions i
         INNER JOIN consultants c ON i.consultant_id = c.id
         INNER JOIN users u ON c.user_id = u.id
         WHERE i.date_fin_reelle IS NULL
         GROUP BY c.id, u.nom, u.prenom, i.date_debut_prevue, i.date_fin_prevue
         HAVING total_allocation > 100
         ORDER BY u.nom, u.prenom`
      )
      .all();

    return {
      total_consultants: activeConsultants.results?.[0]?.count || 0,
      taux_moyen: Math.round(avgUtil?.taux_moyen || 0),
      nb_projets: activeProjects.results?.[0]?.count || 0,
      ca_total: caTotal?.ca_total || 0,
      consultants: consultantUtil.results || [],
      conflits: conflicts.results || [],
    };
  }

  /**
   * Get directeur dashboard stats (includes CJR margins)
   */
  async getDirecteurStats(db: D1Database) {
    // Get admin stats as base
    const adminStats = await this.getAdminStats(db);

    // Get project margins with CJR (confidential data)
    const projectMargins = await db
      .prepare(
        `SELECT
           project_id,
           project_nom,
           client,
           marge_cjn,
           marge_cjr,
           ca_realise,
           montant_vendu
         FROM v_project_margins
         ORDER BY project_nom`
      )
      .all();

    // Get total margins
    const totalMargins = await db
      .prepare(
        `SELECT
           COALESCE(SUM(marge_cjn), 0) as total_marge_cjn,
           COALESCE(SUM(marge_cjr), 0) as total_marge_cjr
         FROM v_project_margins`
      )
      .first<{ total_marge_cjn: number; total_marge_cjr: number }>();

    return {
      ...adminStats,
      project_margins: projectMargins.results || [],
      total_marge_cjn: totalMargins?.total_marge_cjn || 0,
      total_marge_cjr: totalMargins?.total_marge_cjr || 0,
    };
  }

  /**
   * Helper: Get week start (Monday)
   */
  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  /**
   * Helper: Get week end (Sunday)
   */
  private getWeekEnd(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }
}
