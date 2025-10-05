/**
 * Projects Service
 *
 * Business logic for project management
 * Handles CJR access control and project ownership
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { Role } from '../types';
import {
  createProject,
  getProjectById,
  getProjectByIdPublic,
  getProjectByIdWithCJR,
  getProjectsByOwner,
  getAllActiveProjects,
  getInterventionsByProject,
  CreateProjectParams,
} from '../db/queries';

export interface CreateProjectDTO {
  nom: string;
  client: string;
  type: 'regie' | 'forfait' | 'centre_de_service';
  date_debut: string;
  date_fin?: string | null;
  cjn: number;
  cjr?: number | null;
  owner_id: string;
}

export class ProjectsService {
  /**
   * Create a new project
   */
  async create(db: D1Database, data: CreateProjectDTO): Promise<string> {
    const id = `prj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const params: CreateProjectParams = {
      id,
      nom: data.nom,
      client: data.client,
      type: data.type,
      date_debut: data.date_debut,
      date_fin: data.date_fin || null,
      cjn: data.cjn,
      cjr: data.cjr || null,
      owner_id: data.owner_id,
      statut: 'actif',
    };

    await createProject(db, params);
    return id;
  }

  /**
   * Get project by ID with CJR filtering based on role
   */
  async getById(db: D1Database, projectId: string, userRole: Role) {
    // Directeur can see CJR
    if (userRole === 'directeur') {
      return getProjectByIdWithCJR(db, projectId);
    }

    // Others cannot see CJR
    return getProjectByIdPublic(db, projectId);
  }

  /**
   * Get all active projects (filtered by CJR access)
   */
  async listActive(db: D1Database, userRole: Role) {
    const result = await getAllActiveProjects(db);

    if (!result.results) {
      return [];
    }

    // Filter CJR for non-directeur users
    if (userRole === 'directeur') {
      return result.results;
    }

    // Remove CJR field for non-directeur
    return result.results.map((project: any) => {
      const { cjr, ...rest } = project;
      return rest;
    });
  }

  /**
   * Get projects owned by a specific user
   */
  async listByOwner(db: D1Database, ownerId: string, userRole: Role) {
    const result = await getProjectsByOwner(db, ownerId);

    if (!result.results) {
      return [];
    }

    // Filter CJR for non-directeur users
    if (userRole === 'directeur') {
      return result.results;
    }

    // Remove CJR field
    return result.results.map((project: any) => {
      const { cjr, ...rest } = project;
      return rest;
    });
  }

  /**
   * Get project interventions (consultants assigned to project)
   */
  async getInterventions(db: D1Database, projectId: string) {
    const result = await getInterventionsByProject(db, projectId);
    return result.results || [];
  }

  /**
   * Get project margins (directeur only)
   */
  async getMargins(db: D1Database, projectId: string) {
    return db.prepare('SELECT * FROM v_project_margins WHERE project_id = ?').bind(projectId).first();
  }

  /**
   * Get all project margins (directeur only)
   */
  async getAllMargins(db: D1Database) {
    return db.prepare('SELECT * FROM v_project_margins ORDER BY marge DESC').all();
  }

  /**
   * Update project status
   */
  async updateStatus(db: D1Database, projectId: string, statut: 'actif' | 'termine' | 'annule') {
    return db
      .prepare('UPDATE projects SET statut = ? WHERE id = ?')
      .bind(statut, projectId)
      .run();
  }

  /**
   * Check if user owns project
   */
  async isOwner(db: D1Database, projectId: string, userId: string): Promise<boolean> {
    const project = await getProjectById(db, projectId);
    if (!project) {
      return false;
    }
    return project.owner_id === userId;
  }
}
