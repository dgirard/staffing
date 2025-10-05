-- Migration 002: Seed Data for Development
-- Created: 2025-10-05
-- Description: Insert sample data for local development and testing

-- ============================================
-- USERS (5 users with different roles)
-- ============================================

-- Directeur (accès CJR)
INSERT INTO users (id, email, password_hash, nom, prenom, role, created_at) VALUES
('user_dir_001', 'directeur@esn.com', '$2a$10$YourHashedPasswordHere', 'Directeur', 'Jean', 'directeur', datetime('now'));

-- Administrator
INSERT INTO users (id, email, password_hash, nom, prenom, role, created_at) VALUES
('user_adm_001', 'admin@esn.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'Marie', 'administrator', datetime('now'));

-- Project Owner
INSERT INTO users (id, email, password_hash, nom, prenom, role, created_at) VALUES
('user_po_001', 'po1@esn.com', '$2a$10$YourHashedPasswordHere', 'Dupont', 'Pierre', 'project_owner', datetime('now')),
('user_po_002', 'po2@esn.com', '$2a$10$YourHashedPasswordHere', 'Martin', 'Sophie', 'project_owner', datetime('now'));

-- Consultants
INSERT INTO users (id, email, password_hash, nom, prenom, role, created_at) VALUES
('user_con_001', 'consultant1@esn.com', '$2a$10$YourHashedPasswordHere', 'Leroy', 'Thomas', 'consultant', datetime('now')),
('user_con_002', 'consultant2@esn.com', '$2a$10$YourHashedPasswordHere', 'Bernard', 'Julie', 'consultant', datetime('now')),
('user_con_003', 'consultant3@esn.com', '$2a$10$YourHashedPasswordHere', 'Petit', 'Lucas', 'consultant', datetime('now')),
('user_con_004', 'consultant4@esn.com', '$2a$10$YourHashedPasswordHere', 'Robert', 'Emma', 'consultant', datetime('now')),
('user_con_005', 'consultant5@esn.com', '$2a$10$YourHashedPasswordHere', 'Richard', 'Hugo', 'consultant', datetime('now'));

-- ============================================
-- CONSULTANTS (5 consultants)
-- ============================================
INSERT INTO consultants (id, user_id, tjm_defaut, competences, disponible, created_at) VALUES
('con_001', 'user_con_001', 600, '["React", "TypeScript", "Node.js"]', 1, datetime('now')),
('con_002', 'user_con_002', 550, '["Angular", "Java", "Spring"]', 1, datetime('now')),
('con_003', 'user_con_003', 650, '["Vue.js", "Python", "Django"]', 1, datetime('now')),
('con_004', 'user_con_004', 700, '["React Native", "iOS", "Swift"]', 1, datetime('now')),
('con_005', 'user_con_005', 500, '["PHP", "Laravel", "MySQL"]', 0, datetime('now'));

-- ============================================
-- PROJECTS (3 projects)
-- ============================================
INSERT INTO projects (id, nom, client, type, date_debut, date_fin, cjn, cjr, owner_id, statut, created_at) VALUES
('prj_001', 'Refonte SI Client A', 'Client A', 'forfait', '2024-01-01', '2024-06-30', 650, 500, 'user_po_001', 'actif', datetime('now')),
('prj_002', 'Support Applicatif Client B', 'Client B', 'regie', '2024-02-01', NULL, 600, 480, 'user_po_001', 'actif', datetime('now')),
('prj_003', 'Migration Cloud Client C', 'Client C', 'forfait', '2024-03-01', '2024-12-31', 700, 550, 'user_po_002', 'actif', datetime('now'));

-- ============================================
-- INTERVENTIONS (5 allocations)
-- ============================================
INSERT INTO interventions (id, consultant_id, project_id, date_debut, date_fin, tj_facture, pourcentage_allocation, statut, created_at) VALUES
('int_001', 'con_001', 'prj_001', '2024-01-01', '2024-06-30', 650, 100, 'active', datetime('now')),
('int_002', 'con_002', 'prj_002', '2024-02-01', NULL, 600, 100, 'active', datetime('now')),
('int_003', 'con_003', 'prj_003', '2024-03-01', '2024-12-31', 700, 50, 'active', datetime('now')),
('int_004', 'con_004', 'prj_001', '2024-01-15', '2024-06-30', 650, 100, 'active', datetime('now')),
('int_005', 'con_003', 'prj_002', '2024-04-01', NULL, 600, 50, 'active', datetime('now'));

-- ============================================
-- TIMESHEETS (Sample for current month)
-- ============================================
-- Consultant 1 - Full month (20 days)
INSERT INTO timesheets (id, consultant_id, intervention_id, date, temps_saisi, periode, statut, created_at, updated_at) VALUES
('ts_001', 'con_001', 'int_001', date('now', 'start of month'), 1.0, 'journee', 'validated', datetime('now'), datetime('now')),
('ts_002', 'con_001', 'int_001', date('now', 'start of month', '+1 day'), 1.0, 'journee', 'validated', datetime('now'), datetime('now')),
('ts_003', 'con_001', 'int_001', date('now', 'start of month', '+2 day'), 1.0, 'journee', 'validated', datetime('now'), datetime('now')),
('ts_004', 'con_001', 'int_001', date('now', 'start of month', '+3 day'), 1.0, 'journee', 'validated', datetime('now'), datetime('now')),
('ts_005', 'con_001', 'int_001', date('now', 'start of month', '+4 day'), 1.0, 'journee', 'validated', datetime('now'), datetime('now'));

-- Consultant 2 - Half days examples
INSERT INTO timesheets (id, consultant_id, intervention_id, date, temps_saisi, periode, statut, created_at, updated_at) VALUES
('ts_006', 'con_002', 'int_002', date('now', 'start of month'), 0.5, 'matin', 'validated', datetime('now'), datetime('now')),
('ts_007', 'con_002', 'int_002', date('now', 'start of month'), 0.5, 'apres-midi', 'validated', datetime('now'), datetime('now')),
('ts_008', 'con_002', 'int_002', date('now', 'start of month', '+1 day'), 1.0, 'journee', 'submitted', datetime('now'), datetime('now')),
('ts_009', 'con_002', 'int_002', date('now', 'start of month', '+2 day'), 1.0, 'journee', 'draft', datetime('now'), datetime('now'));

-- Consultant 3 - Split between 2 projects (50/50)
INSERT INTO timesheets (id, consultant_id, intervention_id, date, temps_saisi, periode, statut, created_at, updated_at) VALUES
('ts_010', 'con_003', 'int_003', date('now', 'start of month'), 0.5, 'matin', 'validated', datetime('now'), datetime('now')),
('ts_011', 'con_003', 'int_005', date('now', 'start of month'), 0.5, 'apres-midi', 'validated', datetime('now'), datetime('now')),
('ts_012', 'con_003', 'int_003', date('now', 'start of month', '+1 day'), 0.5, 'matin', 'validated', datetime('now'), datetime('now')),
('ts_013', 'con_003', 'int_005', date('now', 'start of month', '+1 day'), 0.5, 'apres-midi', 'validated', datetime('now'), datetime('now'));

-- ============================================
-- VALIDATIONS (Sample validations)
-- ============================================
INSERT INTO validations (id, timesheet_id, validator_id, statut, commentaire, created_at) VALUES
('val_001', 'ts_001', 'user_po_001', 'validated', 'Approuvé', datetime('now')),
('val_002', 'ts_002', 'user_po_001', 'validated', 'Approuvé', datetime('now')),
('val_003', 'ts_003', 'user_po_001', 'validated', 'Approuvé', datetime('now')),
('val_004', 'ts_006', 'user_po_001', 'validated', 'Approuvé', datetime('now')),
('val_005', 'ts_007', 'user_po_001', 'validated', 'Approuvé', datetime('now'));

-- ============================================
-- CHAT_CONVERSATIONS (Sample conversations)
-- ============================================
INSERT INTO chat_conversations (id, user_id, titre, created_at) VALUES
('chat_001', 'user_con_001', 'Mon utilisation ce mois', datetime('now')),
('chat_002', 'user_po_001', 'État des projets', datetime('now'));

-- ============================================
-- CHAT_MESSAGES (Sample chat history)
-- ============================================
INSERT INTO chat_messages (id, conversation_id, role, content, intent, created_at) VALUES
('msg_001', 'chat_001', 'user', 'Quel est mon taux d''utilisation ce mois ?', 'consulter_utilisation', datetime('now')),
('msg_002', 'chat_001', 'assistant', 'Votre taux d''utilisation pour ce mois est de 25% avec 5 jours validés sur 20 jours ouvrés.', 'consulter_utilisation', datetime('now')),
('msg_003', 'chat_002', 'user', 'Combien de consultants actifs sur le projet Refonte SI ?', 'voir_projets', datetime('now')),
('msg_004', 'chat_002', 'assistant', 'Le projet "Refonte SI Client A" a 2 consultants actifs: Thomas Leroy et Emma Robert.', 'voir_projets', datetime('now'));

-- Seed data complete
-- Note: Password hashes are placeholders. In real usage, hash with bcrypt cost 10
-- Example: bcrypt.hash('password123', 10)
