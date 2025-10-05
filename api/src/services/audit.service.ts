/**
 * Audit Service
 *
 * Tracks sensitive data access (CJR) for compliance and security
 */

import type { D1Database } from '@cloudflare/workers-types';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export type AuditAction =
  | 'VIEW_PROJECT_MARGIN_CJR'
  | 'VIEW_CONSULTANT_CJR'
  | 'VIEW_INTERVENTION_CJR'
  | 'VIEW_ALL_MARGINS_CJR'
  | 'EXPORT_CJR_DATA';

export class AuditService {
  /**
   * Log an audit event
   */
  async log(
    db: D1Database,
    userId: string,
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const auditId = `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db
      .prepare(
        `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        auditId,
        userId,
        action,
        resourceType,
        resourceId,
        metadata ? JSON.stringify(metadata) : null
      )
      .run();

    return auditId;
  }

  /**
   * Get audit logs for a user
   */
  async getByUser(db: D1Database, userId: string, limit: number = 100) {
    const result = await db
      .prepare(
        `SELECT
           a.id,
           a.user_id,
           a.action,
           a.resource_type,
           a.resource_id,
           a.metadata,
           a.created_at,
           u.nom,
           u.prenom,
           u.email
         FROM audit_logs a
         INNER JOIN users u ON a.user_id = u.id
         WHERE a.user_id = ?
         ORDER BY a.created_at DESC
         LIMIT ?`
      )
      .bind(userId, limit)
      .all();

    return result.results || [];
  }

  /**
   * Get audit logs for a resource
   */
  async getByResource(
    db: D1Database,
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ) {
    const result = await db
      .prepare(
        `SELECT
           a.id,
           a.user_id,
           a.action,
           a.resource_type,
           a.resource_id,
           a.metadata,
           a.created_at,
           u.nom,
           u.prenom,
           u.email,
           u.role
         FROM audit_logs a
         INNER JOIN users u ON a.user_id = u.id
         WHERE a.resource_type = ? AND a.resource_id = ?
         ORDER BY a.created_at DESC
         LIMIT ?`
      )
      .bind(resourceType, resourceId, limit)
      .all();

    return result.results || [];
  }

  /**
   * Get all audit logs (admin/directeur only)
   */
  async getAll(db: D1Database, limit: number = 100) {
    const result = await db
      .prepare(
        `SELECT
           a.id,
           a.user_id,
           a.action,
           a.resource_type,
           a.resource_id,
           a.metadata,
           a.created_at,
           u.nom,
           u.prenom,
           u.email,
           u.role
         FROM audit_logs a
         INNER JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC
         LIMIT ?`
      )
      .bind(limit)
      .all();

    return result.results || [];
  }

  /**
   * Get audit statistics
   */
  async getStats(db: D1Database, startDate?: string, endDate?: string) {
    let query = `
      SELECT
        action,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs
    `;

    const bindings: any[] = [];

    if (startDate && endDate) {
      query += ' WHERE created_at >= ? AND created_at <= ?';
      bindings.push(startDate, endDate);
    } else if (startDate) {
      query += ' WHERE created_at >= ?';
      bindings.push(startDate);
    }

    query += ' GROUP BY action ORDER BY count DESC';

    const result = await db.prepare(query).bind(...bindings).all();
    return result.results || [];
  }
}
