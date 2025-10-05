-- Migration 003: Audit Logs
-- Created: 2025-10-05
-- Description: Create audit logs table for tracking sensitive data access (CJR)

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- e.g., 'VIEW_PROJECT_MARGIN_CJR', 'VIEW_CONSULTANT_CJR'
  resource_type TEXT NOT NULL, -- e.g., 'projects', 'consultants', 'interventions'
  resource_id TEXT NOT NULL, -- ID of the resource accessed
  metadata TEXT, -- JSON with additional context (ip, timestamp, etc.)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
