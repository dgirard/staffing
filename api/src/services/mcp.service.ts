/**
 * MCP Service
 *
 * Model Context Protocol implementation for Staffing ESN
 * Provides AI-accessible tools for timesheet, consultant, and project management
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { Role } from '../types';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPContext {
  userId: string;
  role: Role;
}

export class MCPService {
  /**
   * List available tools
   */
  listTools(): MCPTool[] {
    return [
      {
        name: 'create_timesheet',
        description: 'Create a timesheet entry for a consultant on a project',
        inputSchema: {
          type: 'object',
          properties: {
            consultant_id: { type: 'string', description: 'Consultant ID' },
            intervention_id: { type: 'string', description: 'Intervention ID' },
            date: { type: 'string', format: 'date', description: 'Date (YYYY-MM-DD)' },
            periode: {
              type: 'string',
              enum: ['matin', 'apres_midi', 'journee'],
              description: 'Period of the day',
            },
            temps_saisi: { type: 'number', enum: [0.5, 1.0], description: 'Time in days' },
            commentaire: { type: 'string', description: 'Optional comment' },
          },
          required: ['consultant_id', 'intervention_id', 'date', 'periode', 'temps_saisi'],
        },
      },
      {
        name: 'get_consultant_utilization',
        description: 'Get consultant utilization rate for a period',
        inputSchema: {
          type: 'object',
          properties: {
            consultant_id: { type: 'string', description: 'Consultant ID' },
            month: { type: 'string', format: 'YYYY-MM', description: 'Month (optional)' },
          },
          required: ['consultant_id'],
        },
      },
      {
        name: 'get_project_margins',
        description:
          'Get project margins (CJN for most roles, CJR for directeur only with use_real_cost=true)',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project ID' },
            use_real_cost: {
              type: 'boolean',
              default: false,
              description: 'Use real cost (CJR) - directeur only',
            },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'list_consultants',
        description: 'List all active consultants with their utilization',
        inputSchema: {
          type: 'object',
          properties: {
            disponible: { type: 'boolean', description: 'Filter by availability (optional)' },
          },
        },
      },
      {
        name: 'validate_timesheet',
        description: 'Validate or reject a timesheet entry (owner/admin/directeur only)',
        inputSchema: {
          type: 'object',
          properties: {
            timesheet_id: { type: 'string', description: 'Timesheet ID' },
            statut: {
              type: 'string',
              enum: ['validated', 'rejected'],
              description: 'Validation status',
            },
            commentaire: { type: 'string', description: 'Comment (required for rejection)' },
          },
          required: ['timesheet_id', 'statut'],
        },
      },
      {
        name: 'list_pending_validations',
        description: 'List timesheets pending validation (owner/admin/directeur only)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_my_timesheets',
        description: 'Get my timesheets for a period',
        inputSchema: {
          type: 'object',
          properties: {
            month: { type: 'string', format: 'YYYY-MM', description: 'Month (optional)' },
          },
        },
      },
      {
        name: 'get_my_projects',
        description: 'Get my active projects',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * Call a tool
   */
  async callTool(
    db: D1Database,
    toolName: string,
    params: Record<string, any>,
    context: MCPContext
  ): Promise<any> {
    switch (toolName) {
      case 'create_timesheet':
        return this.createTimesheet(db, params, context);

      case 'get_consultant_utilization':
        return this.getConsultantUtilization(db, params, context);

      case 'get_project_margins':
        return this.getProjectMargins(db, params, context);

      case 'list_consultants':
        return this.listConsultants(db, context);

      case 'validate_timesheet':
        return this.validateTimesheet(db, params, context);

      case 'list_pending_validations':
        return this.listPendingValidations(db, context);

      case 'get_my_timesheets':
        return this.getMyTimesheets(db, params, context);

      case 'get_my_projects':
        return this.getMyProjects(db, context);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Create timesheet
   */
  private async createTimesheet(
    db: D1Database,
    params: Record<string, any>,
    context: MCPContext
  ) {
    const { consultant_id, intervention_id, date, periode, temps_saisi, commentaire } = params;

    // Verify consultant ownership
    if (context.role === 'consultant') {
      const consultant = await db
        .prepare('SELECT id FROM consultants WHERE user_id = ?')
        .bind(context.userId)
        .first<{ id: string }>();

      if (!consultant || consultant.id !== consultant_id) {
        throw new Error('Vous ne pouvez créer des timesheets que pour vous-même');
      }
    }

    // Generate ID
    const timesheetId = `ts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert timesheet
    await db
      .prepare(
        `INSERT INTO timesheets (id, consultant_id, intervention_id, date, periode, temps_saisi, commentaire, statut, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'), datetime('now'))`
      )
      .bind(timesheetId, consultant_id, intervention_id, date, periode, temps_saisi, commentaire || null)
      .run();

    return {
      success: true,
      timesheet_id: timesheetId,
      message: `Timesheet créé pour le ${date} (${temps_saisi} jour${temps_saisi > 1 ? 's' : ''})`,
    };
  }

  /**
   * Get consultant utilization
   */
  private async getConsultantUtilization(
    db: D1Database,
    params: Record<string, any>,
    context: MCPContext
  ) {
    const { consultant_id } = params;

    // Check permissions
    if (context.role === 'consultant') {
      const consultant = await db
        .prepare('SELECT id FROM consultants WHERE user_id = ?')
        .bind(context.userId)
        .first<{ id: string }>();

      if (!consultant || consultant.id !== consultant_id) {
        throw new Error('Vous ne pouvez consulter que votre propre utilisation');
      }
    }

    // Get utilization from view
    const utilization = await db
      .prepare(
        `SELECT
           consultant_id,
           nom,
           prenom,
           taux_utilisation,
           jours_saisis,
           nb_interventions_actives
         FROM v_consultant_utilization
         WHERE consultant_id = ?`
      )
      .bind(consultant_id)
      .first();

    if (!utilization) {
      return {
        consultant_id,
        taux_utilisation: 0,
        jours_saisis: 0,
        message: 'Aucune donnée d\'utilisation disponible',
      };
    }

    return utilization;
  }

  /**
   * Get project margins
   */
  private async getProjectMargins(
    db: D1Database,
    params: Record<string, any>,
    context: MCPContext
  ) {
    const { project_id, use_real_cost } = params;

    // Check CJR access
    if (use_real_cost && context.role !== 'directeur') {
      throw new Error('CJR access requires directeur role');
    }

    const marginField = use_real_cost ? 'marge_cjr' : 'marge_cjn';
    const costField = use_real_cost ? 'cout_cjr' : 'cout_cjn';

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
      .bind(project_id)
      .first();

    if (!result) {
      throw new Error('Projet non trouvé');
    }

    return {
      ...result,
      cost_type: use_real_cost ? 'CJR' : 'CJN',
    };
  }

  /**
   * List consultants
   */
  private async listConsultants(db: D1Database, context: MCPContext) {
    if (context.role === 'consultant') {
      throw new Error('Les consultants ne peuvent pas lister les autres consultants');
    }

    let query = `
      SELECT
        c.id,
        u.nom,
        u.prenom,
        c.tjm_defaut,
        c.disponible,
        COALESCE(v.taux_utilisation, 0) as taux_utilisation,
        COALESCE(v.jours_saisis, 0) as jours_saisis
      FROM consultants c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN v_consultant_utilization v ON c.id = v.consultant_id
    `;

    query += ' ORDER BY u.nom, u.prenom';

    const result = await db.prepare(query).all();

    return {
      consultants: result.results || [],
      count: result.results?.length || 0,
    };
  }

  /**
   * Validate timesheet
   */
  private async validateTimesheet(
    db: D1Database,
    params: Record<string, any>,
    context: MCPContext
  ) {
    const { timesheet_id, statut, commentaire } = params;

    // Check permissions
    if (
      context.role !== 'project_owner' &&
      context.role !== 'administrator' &&
      context.role !== 'directeur'
    ) {
      throw new Error('Seuls les project owners, admins et directeurs peuvent valider');
    }

    // Get timesheet
    const timesheet = await db
      .prepare(
        `SELECT t.*, i.project_id, p.owner_id
         FROM timesheets t
         INNER JOIN interventions i ON t.intervention_id = i.id
         INNER JOIN projects p ON i.project_id = p.id
         WHERE t.id = ?`
      )
      .bind(timesheet_id)
      .first<{ id: string; statut: string; project_id: string; owner_id: string }>();

    if (!timesheet) {
      throw new Error('Timesheet non trouvé');
    }

    // Check status
    if (timesheet.statut !== 'submitted') {
      throw new Error(`Impossible de valider: statut actuel "${timesheet.statut}" (doit être "submitted")`);
    }

    // Check project ownership for project_owner
    if (context.role === 'project_owner' && timesheet.owner_id !== context.userId) {
      throw new Error('Vous ne pouvez valider que les timesheets de vos propres projets');
    }

    // Check comment requirement for rejection
    if (statut === 'rejected' && !commentaire) {
      throw new Error('Un commentaire est obligatoire pour rejeter un timesheet');
    }

    // Generate validation ID
    const validationId = `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create validation record
    await db
      .prepare(
        `INSERT INTO validations (id, timesheet_id, validator_id, statut, commentaire, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(validationId, timesheet_id, context.userId, statut, commentaire || null)
      .run();

    // Update timesheet status
    await db
      .prepare(`UPDATE timesheets SET statut = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(statut, timesheet_id)
      .run();

    return {
      success: true,
      validation_id: validationId,
      message: `Timesheet ${statut === 'validated' ? 'validé' : 'rejeté'} avec succès`,
    };
  }

  /**
   * List pending validations
   */
  private async listPendingValidations(db: D1Database, context: MCPContext) {
    if (
      context.role !== 'project_owner' &&
      context.role !== 'administrator' &&
      context.role !== 'directeur'
    ) {
      throw new Error('Seuls les project owners, admins et directeurs peuvent voir les validations');
    }

    let query = `
      SELECT
        t.id,
        t.date,
        t.temps_saisi,
        t.periode,
        c.id as consultant_id,
        u.nom as consultant_nom,
        u.prenom as consultant_prenom,
        p.nom as project_nom,
        p.client
      FROM timesheets t
      INNER JOIN consultants c ON t.consultant_id = c.id
      INNER JOIN users u ON c.user_id = u.id
      INNER JOIN interventions i ON t.intervention_id = i.id
      INNER JOIN projects p ON i.project_id = p.id
      WHERE t.statut = 'submitted'
    `;

    const bindings: any[] = [];

    if (context.role === 'project_owner') {
      query += ' AND p.owner_id = ?';
      bindings.push(context.userId);
    }

    query += ' ORDER BY t.date DESC';

    const result = await db.prepare(query).bind(...bindings).all();

    return {
      pending: result.results || [],
      count: result.results?.length || 0,
    };
  }

  /**
   * Get my timesheets
   */
  private async getMyTimesheets(db: D1Database, params: Record<string, any>, context: MCPContext) {
    const { month } = params;

    // Get consultant ID
    const consultant = await db
      .prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(context.userId)
      .first<{ id: string }>();

    if (!consultant && context.role === 'consultant') {
      throw new Error('Profil consultant non trouvé');
    }

    let query = `
      SELECT
        t.id,
        t.date,
        t.temps_saisi,
        t.periode,
        t.statut,
        t.commentaire,
        p.nom as project_nom,
        p.client
      FROM timesheets t
      INNER JOIN interventions i ON t.intervention_id = i.id
      INNER JOIN projects p ON i.project_id = p.id
      WHERE t.consultant_id = ?
    `;

    const bindings: any[] = [consultant?.id];

    if (month) {
      query += " AND strftime('%Y-%m', t.date) = ?";
      bindings.push(month);
    }

    query += ' ORDER BY t.date DESC';

    const result = await db.prepare(query).bind(...bindings).all();

    return {
      timesheets: result.results || [],
      count: result.results?.length || 0,
    };
  }

  /**
   * Get my projects
   */
  private async getMyProjects(db: D1Database, context: MCPContext) {
    let query = `
      SELECT
        p.id,
        p.nom,
        p.client,
        p.type,
        p.statut,
        p.date_debut,
        p.date_fin
      FROM projects p
    `;

    const bindings: any[] = [];

    if (context.role === 'consultant') {
      query += `
        INNER JOIN interventions i ON p.id = i.project_id
        INNER JOIN consultants c ON i.consultant_id = c.id
        WHERE c.user_id = ?
          AND (i.date_fin_reelle IS NULL OR i.date_fin_reelle >= date('now'))
      `;
      bindings.push(context.userId);
    } else if (context.role === 'project_owner') {
      query += ' WHERE p.owner_id = ?';
      bindings.push(context.userId);
    } else {
      query += " WHERE p.statut = 'actif'";
    }

    query += ' ORDER BY p.nom';

    const result = await db.prepare(query).bind(...bindings).all();

    return {
      projects: result.results || [],
      count: result.results?.length || 0,
    };
  }
}
